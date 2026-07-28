package main

import (
	"encoding/json"
	"html"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// --- Data types ---

type Comment struct {
	ID        int64  `json:"id"`
	Slug      string `json:"slug"`
	Name      string `json:"name"`
	Body      string `json:"body"`
	Email     string `json:"email,omitempty"`
	CreatedAt string `json:"created_at"`
}

type Store struct {
	mu       sync.RWMutex
	path     string
	comments []Comment // flat list, sorted by id asc
	nextID   int64
}

// --- Rate limiter ---

type RateLimiter struct {
	mu     sync.Mutex
	counts map[string]int
}

func NewRateLimiter() *RateLimiter {
	rl := &RateLimiter{counts: make(map[string]int)}
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

func (rl *RateLimiter) Allow(ip string, limit int) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	rl.counts[ip]++
	return rl.counts[ip] <= limit
}

// --- JSON store ---

func NewStore(path string) (*Store, error) {
	s := &Store{path: path}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err == nil {
		if err := json.Unmarshal(data, &s.comments); err != nil {
			return nil, err
		}
		for _, c := range s.comments {
			if c.ID >= s.nextID {
				s.nextID = c.ID + 1
			}
		}
	}
	return s, nil
}

func (s *Store) save() error {
	data, err := json.MarshalIndent(s.comments, "", "  ")
	if err != nil {
		return err
	}
	// atomic write: write to temp, then rename
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func (s *Store) Insert(slug, name, body, email string) *Comment {
	s.mu.Lock()
	defer s.mu.Unlock()

	c := &Comment{
		ID:        s.nextID,
		Slug:      slug,
		Name:      name,
		Body:      body,
		Email:     email,
		CreatedAt: time.Now().UTC().Format("2006-01-02 15:04:05"),
	}
	s.nextID++
	s.comments = append(s.comments, *c)

	if err := s.save(); err != nil {
		log.Printf("save: %v", err)
	}
	return c
}

func (s *Store) GetBySlug(slug string) []Comment {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Comment
	for _, c := range s.comments {
		if c.Slug == slug {
			result = append(result, c)
		}
	}
	return result
}

// --- Server ---

type Server struct {
	store  *Store
	cache  sync.Map // map[slug][]byte
	origin string
	rl     *RateLimiter
}

func main() {
	storePath := getEnv("STORE_PATH", "/data/comments.json")
	port := getEnv("PORT", "8080")
	origin := getEnv("ORIGIN", "*")

	store, err := NewStore(storePath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}

	srv := &Server{
		store:  store,
		origin: origin,
		rl:     NewRateLimiter(),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /comments/", srv.handleGetComments)
	mux.HandleFunc("POST /api/comment", srv.handlePostComment)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("ok"))
	})

	log.Printf("listening on :%s (store: %s)", port, storePath)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(srv.origin, mux)))
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

func (s *Server) handleGetComments(w http.ResponseWriter, r *http.Request) {
	// Parse slug from path: /comments/{slug}.html
	slug := strings.TrimPrefix(r.URL.Path, "/comments/")
	slug = strings.TrimSuffix(slug, ".html")
	slug = strings.TrimSpace(slug)
	if slug == "" {
		http.Error(w, "bad slug", http.StatusBadRequest)
		return
	}

	if cached, ok := s.cache.Load(slug); ok {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(cached.([]byte))
		return
	}

	html := renderComments(s.store.GetBySlug(slug))
	s.cache.Store(slug, html)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(html)
}

func (s *Server) handlePostComment(w http.ResponseWriter, r *http.Request) {
	// Rate limit
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	if !s.rl.Allow(ip, 5) {
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

	// Honeypot
	if r.FormValue("website") != "" {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}

	s.store.Insert(slug, name, body, email)
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

// renderComments renders comment list to HTML. No DB reads at request time.
func renderComments(comments []Comment) []byte {
	if len(comments) == 0 {
		return []byte(`<p class="comments-empty">还没有评论。来写第一条吧 ✍️</p>`)
	}

	var b strings.Builder
	b.WriteString(`<ol class="comments-list">`)
	for _, c := range comments {
		b.WriteString(`<li class="comment">`)
		b.WriteString(`<footer class="comment-meta">`)
		b.WriteString(html.EscapeString(c.Name))
		b.WriteString(` · <time>`)
		if len(c.CreatedAt) >= 10 {
			b.WriteString(c.CreatedAt[:10])
		} else {
			b.WriteString(c.CreatedAt)
		}
		b.WriteString(`</time></footer>`)
		b.WriteString(`<div class="comment-body">`)
		body := html.EscapeString(c.Body)
		body = strings.ReplaceAll(body, "\n\n", "</p><p>")
		body = strings.ReplaceAll(body, "\n", "<br>")
		b.WriteString(`<p>`)
		b.WriteString(body)
		b.WriteString(`</p>`)
		b.WriteString(`</div>`)
		b.WriteString(`</li>`)
	}
	b.WriteString(`</ol>`)
	return []byte(b.String())
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
