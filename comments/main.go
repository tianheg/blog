package main

import (
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// --- Data types ---

type Comment struct {
	ID        int64  `json:"id"`
	Slug      string `json:"slug"`
	ParentID  int64  `json:"parent_id"`
	Name      string `json:"name"`
	Body      string `json:"body"`
	Email     string `json:"email,omitempty"`
	Visible   bool   `json:"visible"`
	CreatedAt string `json:"created_at"`
}

type Store struct {
	mu       sync.RWMutex
	path     string
	comments []Comment
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
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func (s *Store) Insert(slug, name, body, email string, parentID int64) *Comment {
	s.mu.Lock()
	defer s.mu.Unlock()

	c := &Comment{
		ID:        s.nextID,
		Slug:      slug,
		ParentID:  parentID,
		Name:      name,
		Body:      body,
		Email:     email,
		Visible:   true,
		CreatedAt: time.Now().UTC().Format("2006-01-02 15:04:05"),
	}
	s.nextID++
	s.comments = append(s.comments, *c)

	if err := s.save(); err != nil {
		log.Printf("save: %v", err)
	}
	return c
}

func (s *Store) SetVisible(id int64, visible bool) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.comments {
		if s.comments[i].ID == id {
			s.comments[i].Visible = visible
			if err := s.save(); err != nil {
				log.Printf("save: %v", err)
			}
			return true
		}
	}
	return false
}

func (s *Store) GetBySlug(slug string) []Comment {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []Comment
	for _, c := range s.comments {
		if c.Slug == slug && c.Visible {
			result = append(result, c)
		}
	}
	return result
}

func (s *Store) GetByID(id int64) *Comment {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, c := range s.comments {
		if c.ID == id {
			return &c
		}
	}
	return nil
}

// --- Email notifier ---

type Mailer struct {
	enabled    bool
	host       string
	port       string
	user       string
	pass       string
	adminEmail string
	siteURL    string
}

func NewMailer() *Mailer {
	m := &Mailer{
		host:       getEnv("SMTP_HOST", ""),
		port:       getEnv("SMTP_PORT", "587"),
		user:       getEnv("SMTP_USER", ""),
		pass:       getEnv("SMTP_PASS", ""),
		adminEmail: getEnv("ADMIN_EMAIL", ""),
		siteURL:    getEnv("SITE_URL", "https://tianheg.co"),
	}
	m.enabled = m.host != "" && m.user != "" && m.pass != "" && m.adminEmail != ""
	if m.enabled {
		log.Printf("mail: enabled (%s → %s)", m.host, m.adminEmail)
	} else {
		log.Printf("mail: disabled (set SMTP_HOST, SMTP_USER, SMTP_PASS, ADMIN_EMAIL)")
	}
	return m
}

func (m *Mailer) SendCommentNotification(c *Comment) {
	if !m.enabled {
		return
	}

	slug := c.Slug
	if slug == "index" {
		slug = ""
	} else {
		slug = "/" + slug
	}
	pageURL := m.siteURL + "/" + strings.ReplaceAll(slug, "_", "/")
	pageURL = strings.TrimRight(pageURL, "/") + "/"

	subject := fmt.Sprintf("[Blog] New comment from %s", c.Name)
	body := fmt.Sprintf(`New comment on your blog:

  Page: %s
  Author: %s (%s)
  Date: %s

  ———————————————————
  %s
  ———————————

  Manage: %s
`,
		pageURL,
		c.Name, c.Email,
		c.CreatedAt,
		c.Body,
		pageURL+"#comments",
	)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		m.user, m.adminEmail, subject, body)

	addr := m.host + ":" + m.port
	auth := smtp.PlainAuth("", m.user, m.pass, m.host)

	if err := smtp.SendMail(addr, auth, m.user, []string{m.adminEmail}, []byte(msg)); err != nil {
		log.Printf("mail send: %v", err)
	} else {
		log.Printf("mail sent to %s about comment #%d", m.adminEmail, c.ID)
	}
}

// --- Server ---

type Server struct {
	store  *Store
	mailer *Mailer
	cache  sync.Map
	origin string
	rl     *RateLimiter
	admKey string
}

func main() {
	storePath := getEnv("STORE_PATH", "/data/comments.json")
	port := getEnv("PORT", "8080")
	origin := getEnv("ORIGIN", "*")
	admKey := getEnv("ADMIN_KEY", "")

	if admKey == "" {
		log.Println("WARN: ADMIN_KEY not set — delete endpoint disabled")
	}

	store, err := NewStore(storePath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}

	srv := &Server{
		store:  store,
		mailer: NewMailer(),
		origin: origin,
		rl:     NewRateLimiter(),
		admKey: admKey,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /comments/", srv.handleGetComments)
	mux.HandleFunc("POST /api/comment", srv.handlePostComment)
	mux.HandleFunc("DELETE /api/comment/{id}", srv.handleDeleteComment)
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// --- GET /comments/{slug}.html ---

func (s *Server) handleGetComments(w http.ResponseWriter, r *http.Request) {
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

// --- POST /api/comment ---

func (s *Server) handlePostComment(w http.ResponseWriter, r *http.Request) {
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	if !s.rl.Allow(ip, 5) {
		writeJSON(w, http.StatusTooManyRequests, map[string]any{"error": "rate limited"})
		return
	}

	var slug, name, body, email string
	var parentID int64
	var honeypot string

	switch r.Header.Get("Content-Type") {
	case "application/json":
		var req struct {
			Slug     string `json:"slug"`
			Name     string `json:"name"`
			Body     string `json:"body"`
			Email    string `json:"email,omitempty"`
			ParentID int64  `json:"parent_id"`
			Website  string `json:"website,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad json"})
			return
		}
		slug, name, body, email, parentID, honeypot = req.Slug, req.Name, req.Body, req.Email, req.ParentID, req.Website
	default:
		slug = r.FormValue("slug")
		name = r.FormValue("name")
		body = r.FormValue("body")
		email = r.FormValue("email")
		parentID, _ = strconv.ParseInt(r.FormValue("parent_id"), 10, 64)
		honeypot = r.FormValue("website")
	}

	slug = strings.TrimSpace(slug)
	name = strings.TrimSpace(name)
	body = strings.TrimSpace(body)

	if slug == "" || name == "" || body == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "slug, name, body required"})
		return
	}
	if len(name) > 100 || len(body) > 10000 || len(email) > 200 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "fields too long"})
		return
	}

	// Honeypot
	if honeypot != "" {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}

	// Validate parent_id exists if set
	if parentID != 0 {
		parent := s.store.GetByID(parentID)
		if parent == nil || parent.Slug != slug {
			parentID = 0 // ignore invalid parent
		}
	}

	c := s.store.Insert(slug, name, body, email, parentID)
	s.cache.Delete(slug)
	s.mailer.SendCommentNotification(c)

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "id": c.ID})
}

// --- DELETE /api/comment/{id} ---

func (s *Server) handleDeleteComment(w http.ResponseWriter, r *http.Request) {
	if s.admKey == "" {
		writeJSON(w, http.StatusForbidden, map[string]any{"error": "admin key not configured"})
		return
	}

	key := r.Header.Get("X-Admin-Key")
	if key != s.admKey {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid admin key"})
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "bad id"})
		return
	}

	if !s.store.SetVisible(id, false) {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
		return
	}

	// Find slug to invalidate cache
	c := s.store.GetByID(id)
	if c != nil {
		s.cache.Delete(c.Slug)
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// --- renderComments: threaded, nested ---

func renderComments(comments []Comment) []byte {
	if len(comments) == 0 {
		return []byte(`<p class="comments-empty">还没有评论。来写第一条吧 ✍️</p>`)
	}

	// Build lookup and separate top-level vs replies
	byID := make(map[int64]Comment)
	var topLevel []Comment
	children := make(map[int64][]Comment)

	for _, c := range comments {
		byID[c.ID] = c
		if c.ParentID == 0 {
			topLevel = append(topLevel, c)
		} else {
			children[c.ParentID] = append(children[c.ParentID], c)
		}
	}

	var b strings.Builder
	b.WriteString(`<ol class="comments-list">`)
	for _, c := range topLevel {
		renderComment(&b, c, children, byID, 0)
	}
	b.WriteString(`</ol>`)
	return []byte(b.String())
}

func renderComment(b *strings.Builder, c Comment, children map[int64][]Comment, byID map[int64]Comment, depth int) {
	b.WriteString(`<li class="comment"`)
	if depth > 0 {
		b.WriteString(` style="margin-left:`)
		b.WriteString(strconv.Itoa(depth * 24))
		b.WriteString(`px"`)
	}
	b.WriteString(` data-id="`)
	b.WriteString(strconv.FormatInt(c.ID, 10))
	b.WriteString(`"`)

	// Check if it's a reply and show @parent
	parentName := ""
	if c.ParentID != 0 {
		if p, ok := byID[c.ParentID]; ok {
			parentName = p.Name
		}
	}

	b.WriteString(`>`)

	// Meta
	b.WriteString(`<footer class="comment-meta">`)
	b.WriteString(html.EscapeString(c.Name))
	if parentName != "" {
		b.WriteString(` <span class="comment-reply-arrow">↩</span> `)
		b.WriteString(html.EscapeString(parentName))
	}
	b.WriteString(` · <time>`)
	if len(c.CreatedAt) >= 10 {
		b.WriteString(c.CreatedAt[:10])
	} else {
		b.WriteString(c.CreatedAt)
	}
	b.WriteString(`</time></footer>`)

	// Body
	b.WriteString(`<div class="comment-body">`)
	body := html.EscapeString(c.Body)
	body = strings.ReplaceAll(body, "\n\n", "</p><p>")
	body = strings.ReplaceAll(body, "\n", "<br>")
	b.WriteString(`<p>`)
	b.WriteString(body)
	b.WriteString(`</p>`)
	b.WriteString(`</div>`)

	// Reply button
	b.WriteString(`<button class="comment-reply-btn text-sm text-blue-600 dark:text-blue-400 hover:underline" data-id="`)
	b.WriteString(strconv.FormatInt(c.ID, 10))
	b.WriteString(`" data-name="`)
	b.WriteString(html.EscapeString(c.Name))
	b.WriteString(`">Reply</button>`)

	b.WriteString(`</li>`)

	// Children
	if kids, ok := children[c.ID]; ok {
		for _, kid := range kids {
			renderComment(b, kid, children, byID, depth+1)
		}
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
