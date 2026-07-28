package main

import (
	"database/sql"
	"encoding/json"
	"html"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

type Server struct {
	db     *sql.DB
	cache  sync.Map // map[slug][]byte — pre-rendered HTML
	origin string
	rl     *rateLimiter
}

type rateLimiter struct {
	mu     sync.Mutex
	counts map[string]int
}

func newRateLimiter() *rateLimiter {
	rl := &rateLimiter{counts: make(map[string]int)}
	go func() {
		for {
			time.Sleep(1 * time.Minute)
			rl.mu.Lock()
			rl.counts = make(map[string]int)
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *rateLimiter) allow(ip string, limit int) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.counts[ip]++
	return rl.counts[ip] <= limit
}

func main() {
	dbPath := getEnv("DATABASE_PATH", "/data/comments.db")
	port := getEnv("PORT", "8080")
	origin := getEnv("ORIGIN", "*")

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	// WAL mode for better concurrent performance
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("wal hint: %v", err)
	}
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS comments (
			id         INTEGER PRIMARY KEY AUTOINCREMENT,
			slug       TEXT    NOT NULL,
			name       TEXT    NOT NULL,
			body       TEXT    NOT NULL,
			email      TEXT    DEFAULT '',
			created_at TEXT    NOT NULL DEFAULT (datetime('now'))
		);
		CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);
	`); err != nil {
		log.Fatalf("schema: %v", err)
	}

	srv := &Server{db: db, origin: origin, rl: newRateLimiter()}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /comments/{slug}.html", srv.handleGetComments)
	mux.HandleFunc("POST /api/comment", srv.handlePostComment)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("ok"))
	})

	handler := corsMiddleware(srv.origin, mux)

	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func corsMiddleware(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// handleGetComments returns pre-rendered comment HTML for a slug.
// Serves from in-memory cache; only hits SQLite on cache miss.
func (s *Server) handleGetComments(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(r.PathValue("slug"))
	if slug == "" {
		http.Error(w, "bad slug", http.StatusBadRequest)
		return
	}

	if cached, ok := s.cache.Load(slug); ok {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(cached.([]byte))
		return
	}

	html, err := s.renderComments(slug)
	if err != nil {
		log.Printf("render %s: %v", slug, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	s.cache.Store(slug, html)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(html)
}

// handlePostComment accepts a new comment via JSON or form POST.
// On success it invalidates the slug's cache entry.
func (s *Server) handlePostComment(w http.ResponseWriter, r *http.Request) {
	// Rate limit: max 5 comments per minute per IP
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	if !s.rl.allow(ip, 5) {
		http.Error(w, `{"error":"rate limited"}`, http.StatusTooManyRequests)
		return
	}

	var slug, name, body, email string

	switch r.Header.Get("Content-Type") {
	case "application/json":
		var req struct {
			Slug  string `json:"slug"`
			Name  string `json:"name"`
			Body  string `json:"body"`
			Email string `json:"email,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}
		slug, name, body, email = req.Slug, req.Name, req.Body, req.Email
	default:
		slug = r.FormValue("slug")
		name = r.FormValue("name")
		body = r.FormValue("body")
		email = r.FormValue("email")
	}

	slug = strings.TrimSpace(slug)
	name = strings.TrimSpace(name)
	body = strings.TrimSpace(body)

	if slug == "" || name == "" || body == "" {
		http.Error(w, `{"error":"slug, name, body required"}`, http.StatusBadRequest)
		return
	}

	if len(name) > 100 || len(body) > 10000 || len(email) > 200 {
		http.Error(w, `{"error":"fields too long"}`, http.StatusBadRequest)
		return
	}

	// Honeypot: if "website" is filled, silently accept but don't save
	if r.FormValue("website") != "" {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}

	if _, err := s.db.Exec(
		"INSERT INTO comments (slug, name, body, email) VALUES (?, ?, ?, ?)",
		slug, name, body, email,
	); err != nil {
		log.Printf("insert: %v", err)
		http.Error(w, `{"error":"db error"}`, http.StatusInternalServerError)
		return
	}

	// Invalidate cache — next read re-renders from DB
	s.cache.Delete(slug)

	// Form POST: redirect back
	if r.Header.Get("Content-Type") != "application/json" {
		referer := r.Header.Get("Referer")
		if referer == "" {
			referer = "/"
		}
		http.Redirect(w, r, referer, http.StatusFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// renderComments queries DB and returns full <ol> HTML.
func (s *Server) renderComments(slug string) ([]byte, error) {
	rows, err := s.db.Query(
		`SELECT name, body, created_at
		 FROM comments
		 WHERE slug = ?
		 ORDER BY id ASC`,
		slug,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type row struct{ name, body, createdAt string }
	var comments []row
	for rows.Next() {
		var c row
		if err := rows.Scan(&c.name, &c.body, &c.createdAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(comments) == 0 {
		return []byte(`<p class="comments-empty">还没有评论。来写第一条吧 ✍️</p>`), nil
	}

	var b strings.Builder
	b.WriteString(`<ol class="comments-list">`)
	for _, c := range comments {
		b.WriteString(`<li class="comment">`)
		b.WriteString(`<footer class="comment-meta">`)
		b.WriteString(html.EscapeString(c.name))
		b.WriteString(` · <time>`)
		b.WriteString(c.createdAt[:10]) // YYYY-MM-DD only
		b.WriteString(`</time></footer>`)
		b.WriteString(`<div class="comment-body">`)
		body := html.EscapeString(c.body)
		body = strings.ReplaceAll(body, "\n\n", "</p><p>")
		body = strings.ReplaceAll(body, "\n", "<br>")
		b.WriteString(`<p>`)
		b.WriteString(body)
		b.WriteString(`</p>`)
		b.WriteString(`</div>`)
		b.WriteString(`</li>`)
	}
	b.WriteString(`</ol>`)
	return []byte(b.String()), nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
