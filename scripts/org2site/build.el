;; -*- lexical-binding: t; -*-
;;; build.el --- 批量导出 + 站点级页面生成
;;;
;;; 用法：emacs -Q --batch -l build.el <org根目录> <输出根目录>
;;;
;;; 输出结构（URL 目录化，不带 .html 后缀）：
;;;   org/posts/foo.org        → <out>/posts/foo/index.html         → /posts/foo/
;;;   org/til/software/bar.org → <out>/til/software/bar/index.html  → /til/software/bar/
;;;   另有 /posts/ /til/ 列表页与根页 /

(require 'json)
(require 'url-util)

(require 'subr-x)
(require 'cl-lib)

(let ((args command-line-args-left))
  (setq command-line-args-left nil)  ; 避免 export.el 的单文件入口被触发
  (load (expand-file-name "export.el" (file-name-directory load-file-name)) nil t)
  (setq command-line-args-left args))

;; ---------------------------------------------------------------- 站点模型

(defun org2site--kw (file key)
  "读 org 文件头部的 #+KEY 值。KEY 里的正字符会被转义（如 TAGS[]）。"
  (with-temp-buffer
    (insert-file-contents file)
    (goto-char (point-min))
    (when (re-search-forward (format "^#\\+%s:\\s-*\\(.*\\)$" (regexp-quote key)) nil t)
      (string-trim (match-string 1)))))

(defun org2site--tags (file)
  "从 #+TAGS[]: a,b 提取标签列表。"
  (let ((raw (or (org2site--kw file "TAGS[]") (org2site--kw file "TAGS") "")))
    (seq-filter (lambda (s) (not (string-empty-p s)))
                (mapcar #'string-trim (split-string raw ",")))))

(defun org2site--date (raw)
  "从 <2026-10-15 22:24:47> 或 <2022-08-06 Sat 12:00> 抽出「日期 [时间]」。
保留时分秒 —— RSS 的 pubDate 要用；只需要日期的地方自行截前 10 字符。"
  (let ((s (string-trim raw "<>")))
    (if (string-match
         (concat "\\([0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\)"
                 "\\(?:\\s-+[A-Za-z]\\{3\\}\\)?"
                 "\\(?:\\s-+\\([0-9]\\{2\\}:[0-9]\\{2\\}\\(?::[0-9]\\{2\\}\\)?\\)\\)?")
         s)
        (let ((d (match-string 1 s)) (tm (match-string 2 s)))
          (if tm (concat d " " tm) d))
      "")))

(defun org2site--day (date)
  "取日期部分（前 10 字符）。"
  (substring date 0 (min 10 (length date))))

(defun org2site-iso8601 (date)
  "2026-10-15 22:24:47 → 2026-10-15T22:24:47+08:00（sitemap 用）。
注意空字符串要能安全通过（首页 lastmod 可能拿不到日期）。"
  (let* ((d (org2site--day date))
         (d (if (= (length d) 10) d "1970-01-01"))
         (tm (if (>= (length date) 19) (substring date 11 19) "00:00:00")))
    (concat d "T" tm "+08:00")))

;; ------------------------------------------------- 站点级输出：RSS / sitemap / 404

(defvar org2site-base-url "https://tianheg.co"
  "站点根 URL（RSS 的 link/guid 需要绝对地址）。")
(defvar org2site-rss-limit 20
  "RSS 条数，对齐原站 hugo.yaml 的 services.rss.limit。")

(defun org2site-xml-escape (s)
  (setq s (replace-regexp-in-string "&" "&amp;" s t t))
  (setq s (replace-regexp-in-string "<" "&lt;" s t t))
  (setq s (replace-regexp-in-string ">" "&gt;" s t t))
  (replace-regexp-in-string "\"" "&quot;" s t t))

(defun org2site-rfc822 (date)
  "2026-10-15 22:24:47 → Thu, 15 Oct 2026 22:24:47 +0800
用 encode-time 逐段构造，避免 org-time-string-to-time 丢掉秒。"
  (let* ((d (org2site--day date))
         (d (if (= (length d) 10) d "1970-01-01"))
         (tm (if (>= (length date) 19) (substring date 11 19) "00:00:00"))
         (time (encode-time (string-to-number (substring tm 6 8))
                            (string-to-number (substring tm 3 5))
                            (string-to-number (substring tm 0 2))
                            (string-to-number (substring d 8 10))
                            (string-to-number (substring d 5 7))
                            (string-to-number (substring d 0 4)))))
    (format-time-string "%a, %d %b %Y %H:%M:%S +0800" time)))

(defun org2site-summary (body)
  "取正文前 800 字符作为 RSS description。
换行连同其两侧空白一起去掉，否则 <p> 与正文之间会多一个空格（原站没有）。"
  (let ((s (string-trim (replace-regexp-in-string "[ \t]*\n[ \t]*" "" body))))
    (if (> (length s) 800) (substring s 0 800) s)))

(defun org2site-rss-xml (items)
  "items: ((url title date desc) ...)"
  (concat
   "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
   "<rss xmlns:atom=\"http://www.w3.org/2005/Atom\" version=\"2.0\">\n<channel>\n"
   (format "<title>%s</title>\n" org2site-site-title)
   (format "<link>%s/</link>\n" org2site-base-url)
   "<description>Knowing oneself, grasp the world</description>\n"
   "<language>zh-cn</language>\n"
   (format "<lastBuildDate>%s</lastBuildDate>\n"
           (format-time-string "%a, %d %b %Y %H:%M:%S %z"))
   (format "<atom:link rel=\"self\" type=\"application/rss+xml\" href=\"%s/index.xml\"/>\n"
           org2site-base-url)
   (mapconcat
    (lambda (it)
      (format (concat "<item>\n<title>%s</title>\n<link>%s%s</link>\n"
                      "<author>%s</author>\n<pubDate>%s</pubDate>\n"
                      "<guid>%s%s</guid>\n<description>%s</description>\n</item>\n")
              (org2site-xml-escape (nth 1 it)) org2site-base-url (nth 0 it)
              org2site-site-title
              (org2site-rfc822 (nth 2 it))
              org2site-base-url (nth 0 it)
              (org2site-xml-escape (nth 3 it))))
    items "")
   "</channel>\n</rss>\n"))

(defun org2site-sitemap-xml (pages)
  (concat
   "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
   "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
   (concat
    (format "<url><loc>%s/</loc><lastmod>%s</lastmod></url>\n"
            org2site-base-url
            (org2site-iso8601 (if pages (nth 2 (car pages)) "")))
    (format "<url><loc>%s/posts/</loc></url>\n" org2site-base-url)
    (format "<url><loc>%s/til/</loc></url>\n" org2site-base-url)
    (format "<url><loc>%s/photos/</loc></url>\n" org2site-base-url))
   (mapconcat
    (lambda (p)
      (format "<url><loc>%s%s</loc><lastmod>%s</lastmod></url>\n"
              org2site-base-url (nth 0 p) (org2site-iso8601 (nth 2 p))))
    pages "")
   "</urlset>\n"))

(defun org2site-write-file (out-root rel html)
  "按仓库相对路径直接写文件（index.xml / sitemap.xml / 404.html）。"
  (let ((path (expand-file-name rel out-root)))
    (make-directory (file-name-directory path) t)
    (let ((coding-system-for-write 'utf-8-unix)
          (select-safe-coding-system-accept-default-p t))
      (with-temp-file path (insert html)))))

(defun org2site--noexport-p (file)
  "文件头有 #+NOEXPORT: t 就不发布（agenda 等内部文件用）。"
  (equal "t" (org2site--kw file "NOEXPORT")))

(defun org2site-scan (org-root)
  "扫描 org，返回 ((url title date section rel tags) ...)，按日期倒序。
_index.org 是 Hugo 语义里的 section 索引，不是页面 —— 跳过，标题另用
org2site--index-title 取；#+NOEXPORT: t 的文件也不发布。"
  (let (out)
    (dolist (f (directory-files-recursively org-root "\\.org\\'" nil))
      (unless (or (string= (file-name-nondirectory f) "_index.org")
                  (org2site--noexport-p f))
        (let* ((rel (file-relative-name f org-root))
               (noext (file-name-sans-extension rel))
               (section (car (split-string noext "/"))))
          (push (list (concat "/" noext "/")
                      (or (org2site--typo-string (org2site--kw f "TITLE")) noext)
                      (org2site--date (or (org2site--kw f "DATE") ""))
                      section rel
                      (org2site--tags f)
                      (org2site--kw f "HEADER"))
                out))))
    (sort out (lambda (a b) (string> (nth 2 a) (nth 2 b))))))

(defun org2site-write (out-root url html)
  "url \"/posts/foo/\" → <out-root>/posts/foo/index.html"
  (let ((path (expand-file-name (concat (string-remove-prefix "/" url) "index.html") out-root)))
    (make-directory (file-name-directory path) t)
    ;; batch 下若触发 select-safe-coding-system，emacs 会去读 stdin（此时是 /dev/null）
    ;; 并直接中止导出。js-basics 那篇含组合字符就会触发 —— 强制 utf-8 且禁止交互。
    (let ((coding-system-for-write 'utf-8-unix)
          (select-safe-coding-system-accept-default-p t))
      (with-temp-file path (insert html)))))

;; ------------------------------------------------------------ 站点级页面

(defun org2site-entries-html (pages)
  (concat "<ul>\n"
          (mapconcat
           (lambda (p)
             (format "<li><a href=\"%s\">%s</a><time datetime=\"%s\">%s</time></li>"
                     (nth 0 p) (nth 1 p)
                     (org2site--day (nth 2 p)) (nth 2 p)))
           pages "\n")
          "\n</ul>"))

(defun org2site--short-date (d)
  "2022-08-06 → 08/06（原站首页用 MM/DD）"
  (if (>= (length d) 10)
      (concat (substring d 5 7) "/" (substring d 8 10))
    d))

(defun org2site--til-cat (rel)
  "til/software/vue.org → software"
  (let ((parts (split-string rel "/")))
    (if (and (>= (length parts) 3) (string= (car parts) "til"))
        (nth 1 parts)
      "")))

(defun org2site-shuffle (lst)
  "固定种子的洗牌：保留「Random TIL」语义，同时让构建可重现。"
  (let ((l (copy-sequence lst)))
    (random "org2site-til-seed")
    (dotimes (i (length l) l)
      (let ((j (random (length l))))
        (cl-rotatef (nth i l) (nth j l))))))

(defun org2site-home-section (title url items as-til)
  (concat
   (format "<section>\n<header><h2>%s</h2><a href=\"%s\">View all →</a></header>\n<ul>\n"
           title url)
   (mapconcat
    (lambda (p)
      (format "<li><a href=\"%s\">%s</a>%s</li>"
              (nth 0 p) (nth 1 p)
              (if as-til
                  (let ((cat (org2site--til-cat (nth 4 p))))
                    (if cat (format "<span>%s</span>" cat) ""))
                (format "<time datetime=\"%s\">%s</time>"
                        (nth 2 p) (org2site--short-date (nth 2 p))))))
    items "\n")
   "\n</ul>\n</section>\n"))

(defun org2site-home-html (pages)
  "与原站 layouts/home.html 对齐：Welcome + Recent Posts + Random TIL 双栏。"
  (let* ((posts (seq-filter (lambda (p) (string= (nth 3 p) "posts")) pages))
         (tils (seq-filter (lambda (p) (string= (nth 3 p) "til")) pages))
         (recent (seq-take posts 5))
         (rand (seq-take (org2site-shuffle tils) 5)))
    (concat
     "<h1>Welcome</h1>\n"
     "<p>Hi, I'm tianheg. I write this blog in both Chinese and English "
     "to share my life experiences.</p>\n"
     "<p>I hope you enjoy reading it!</p>\n"
     "<p><a data-cta href=\"/start/\">Start here <span aria-hidden=\"true\">→</span></a></p>\n"
     "<div data-home-columns>\n"
     (org2site-home-section "Recent Posts" "/posts/" recent nil)
     (org2site-home-section "Random TIL" "/til/" rand t)
     "</div>\n")))

(defun org2site-list-html (label pages)
  (concat (format "<h1>%s</h1>\n" label) (org2site-entries-html pages)))

;; ---------------------------------------------------------------- 标签页

(defun org2site-tag-counts (pages)
  "返回 ((tag . 篇数) ...)，按篇数降序。"
  (let ((m (make-hash-table :test 'equal))
        out)
    (dolist (p pages)
      (dolist (tag (nth 5 p))
        (puthash tag (1+ (gethash tag m 0)) m)))
    (maphash (lambda (k v) (push (cons k v) out)) m)
    ;; 按标签名升序 —— 原站是 Hugo taxonomy 的默认序（中文按 Unicode 码点），不是按计数
    (sort out (lambda (a b) (string< (car a) (car b))))))

(defun org2site-tags-index-html (counts)
  (concat "<h1>Tags</h1>\n<div data-tag-cloud>\n"
          (mapconcat (lambda (tc)
                       (format "<a href=\"/tags/%s/\">%s<span>%d</span></a>"
                               (url-hexify-string (downcase (car tc))) (car tc) (cdr tc)))
                     counts "\n")
          "\n</div>\n"))

(defun org2site-tag-page-html (tag pages)
  "按年份分组（原站 /tags/<tag>/ 就是这样：<h2>年份</h2> + MM/DD 条目）。"
  (let ((by-year (make-hash-table :test 'equal))
        years)
    (dolist (p pages)  ; pages 已是日期倒序，用 append 保持降序（push 会反过来）
      (let ((y (substring (org2site--day (nth 2 p)) 0 4)))
        (puthash y (append (gethash y by-year) (list p)) by-year)))
    (maphash (lambda (y ps) (push (cons y ps) years)) by-year)
    (setq years (sort years (lambda (a b) (string> (car a) (car b)))))
    (concat
     (format "<h1>%s</h1>\n" tag)
     (mapconcat
      (lambda (y)
        (concat (format "<h2>%s</h2>\n<ul data-tag-entries>\n" (car y))
                (mapconcat
                 (lambda (p)
                   (format "<li><time datetime=\"%s\">%s</time><a href=\"%s\">%s</a></li>"
                           (org2site--day (nth 2 p))
                           (org2site--short-date (nth 2 p))
                           (nth 0 p) (nth 1 p)))
                 (cdr y) "\n")
                "\n</ul>\n"))
      years ""))))

;; ---------------------------------------------------------------- 相册
;;
;; 数据源：data/photos-list.yaml（人工真源）→ scripts/gen-photos-data.py →
;;         data/photos.json（{"singles":[...], "series":[{"num","name","photos":[...]}]}）
;; 图片 URL 由 Worker 提供：缩略图 /photos/t/<k>?v=<v>、大图 /photos/h/<k>?v=<v>。

(defun org2site--repo-root (org-root)
  "org 根目录的上一级即仓库根（data/、scripts/ 在那里）。"
  (file-name-directory
   (directory-file-name (file-name-as-directory (expand-file-name org-root)))))

(defun org2site--json-read-file (path)
  (when (file-exists-p path)
    (with-temp-buffer
      (insert-file-contents path)
      (goto-char (point-min))
      (json-parse-buffer :object-type 'alist :array-type 'list))))

(defvar org2site-section-labels
  '(("posts" . "文章") ("til" . "数字花园 | TIL"))
  "section 落地页的显示名（对齐原站 h1）。_index.org 的 TITLE 次之。")

(defun org2site--index-title (repo rel-dir)
  "读 org/<rel-dir>/_index.org 的 TITLE（没有则 nil）。"
  (let ((f (expand-file-name (concat rel-dir "/_index.org")
                             (expand-file-name "org" repo))))
    (when (file-exists-p f) (org2site--typo-string (org2site--kw f "TITLE")))))

(defun org2site--subdirs (dir)
  (when (file-directory-p dir)
    (seq-filter (lambda (d)
                  (and (file-directory-p d)
                       (not (member (file-name-nondirectory d) '("." "..")))))
                (directory-files dir t))))

(defun org2site--photo-url (prefix p)
  (format "/photos/%s/%s?v=%s" prefix (alist-get 'k p) (alist-get 'v p)))

(defun org2site-lightbox-html ()
  "灯箱骨架。ID 与 static/photos.js 的契约一致；[hidden] 由 JS 切换。"
  (concat
   "<div id=\"ph-lb\" hidden role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\" aria-label=\"图片查看\">\n"
   "<button id=\"ph-lb-close\" type=\"button\" aria-label=\"关闭\">✕</button>\n"
   "<button id=\"ph-lb-prev\" type=\"button\" aria-label=\"上一张\">‹</button>\n"
   "<button id=\"ph-lb-next\" type=\"button\" aria-label=\"下一张\">›</button>\n"
   "<img id=\"ph-lb-img\" alt=\"\">\n"
   "<div id=\"ph-lb-meta\"><span id=\"ph-lb-cap\"></span><span id=\"ph-lb-count\"></span></div>\n"
   "</div>\n"
   (format "<script src=\"/js/photos.js?v=%s\" defer></script>\n" org2site-asset-version)))

(defun org2site-photos-grid-html (photos)
  "一个 [data-lb-set] 集合（原站是 CSS 多列 masonry）。
不写内联 style：<img width height> + CSS 的 height:auto 已经能占位防跳动。"
  (concat "<div data-lb-set>\n"
          (mapconcat
           (lambda (p)
             (let ((full (org2site--photo-url "h" p))
                   (thumb (org2site--photo-url "t" p))
                   (cap (or (alist-get 'title p) ""))
                   (w (alist-get 'w p))
                   (h (alist-get 'h p)))
               (format (concat "<a href=\"%s\" data-lb data-full=\"%s\" data-caption=\"%s\""
                               " target=\"_blank\" rel=\"noopener\">"
                               "<img src=\"%s\" alt=\"%s\" width=\"%s\" height=\"%s\""
                               " loading=\"lazy\" decoding=\"async\"></a>")
                       full full (org2site-xml-escape cap)
                       thumb (org2site-xml-escape cap) w h)))
           photos "\n")
          "\n</div>\n"))

(defun org2site-photos-index-html (data)
  "/photos/：系列索引（缩略图 + 系列名，链到 /photos/<num>/）。"
  (concat "<h1>Photos</h1>\n<div data-photo-series>\n"
          (mapconcat
           (lambda (s)
             (let* ((num (alist-get 'num s))
                    (name (or (alist-get 'name s) ""))
                    (first (car (alist-get 'photos s))))
               (if first
                   (format (concat "<a href=\"/photos/%s/\">"
                                   "<img src=\"%s\" alt=\"%s\" width=\"%s\" height=\"%s\""
                                   " loading=\"lazy\" decoding=\"async\">"
                                   "<span>%s</span></a>")
                           num (org2site--photo-url "t" first)
                           (org2site-xml-escape name)
                           (alist-get 'w first) (alist-get 'h first)
                           (org2site-xml-escape name))
                 "")))
           (alist-get 'series data) "\n")
          "</div>\n"))

;; ------------------------------------------------- 归档页（年份分组 + 发文热力图）
;;
;; /posts/ 对齐原站：每年一个 <details open>，内含
;;   月份标签行 + 星期标签列 + 53周×7天 热力图 SVG + 该年条目（时间在左、标题在右）
;; 热力图纯服务端生成，不依赖 JS。几何与原站一致：viewBox 687×89、格子 11×11 rx2、
;; 网格步长 13，x=周序号×13、y=星期序号×13（0=周日）。
;; 色阶五档：0 / 1 / 2–3 / 4–10 / 11+（实测自原站 rect 的 class 分布）。

(defvar org2site-heat-months
  '("Jan" "Feb" "Mar" "Apr" "May" "Jun" "Jul" "Aug" "Sep" "Oct" "Nov" "Dec"))

(defun org2site--ymd-time (ymd)
  "「YYYY-MM-DD」→ 当天 00:00 的时间值。"
  (encode-time 0 0 0
               (string-to-number (substring ymd 8 10))
               (string-to-number (substring ymd 5 7))
               (string-to-number (substring ymd 0 4))))

(defun org2site--weekday-index (ymd)
  "0=周日 … 6=周六。"
  (string-to-number (format-time-string "%w" (org2site--ymd-time ymd))))

(defun org2site--add-days (ymd n)
  (format-time-string "%Y-%m-%d"
                      (time-add (org2site--ymd-time ymd) (seconds-to-time (* 86400 n)))))

(defun org2site--days-between (a b)
  "b − a，单位天。"
  (/ (round (- (float-time (org2site--ymd-time b))
               (float-time (org2site--ymd-time a))))
     86400))

(defun org2site--heat-level (n)
  (cond ((<= n 0) 0) ((= n 1) 1) ((<= n 3) 2) ((<= n 10) 3) (t 4)))

(defun org2site--pct (num den)
  "百分比字符串；整数不带小数点（原站 Jan 写作 0%）。"
  (let ((v (* 100.0 (/ (float num) den))))
    (if (= v (floor v)) (format "%d" (floor v)) (format "%.3f" v))))

(defun org2site--year-grid-start (year)
  "该年网格的第一天：1/1 当天或之前最近的周日。YEAR 是字符串。"
  (let ((jan1 (format "%s-01-01" year)))
    (org2site--add-days jan1 (- (org2site--weekday-index jan1)))))

(defun org2site--group-by (key pages)
  "按 key 分组，保持 pages 的顺序（pages 已按日期倒序）。"
  (let (out)
    (dolist (p pages)
      (let* ((k (funcall key p))
             (cell (assoc k out)))
        (if cell (setcdr cell (append (cdr cell) (list p)))
          (push (cons k (list p)) out))))
    (nreverse out)))

(defun org2site-heat-months-html (year)
  (let ((start (org2site--year-grid-start year)))
    (concat "<div class=\"heat-months\">"
            (mapconcat
             (lambda (m)
               (let ((week (/ (org2site--days-between
                               start (format "%s-%02d-01" year m))
                              7)))
                 (format "<span%s style=\"left:%s%%\">%s</span>"
                         ;; 窄屏只留季度月（原站 hidden sm:block 的效果）
                         (if (member m '(1 4 7 10)) "" " data-hide-sm")
                         (org2site--pct week 53)
                         (nth (1- m) org2site-heat-months))))
             '(1 2 3 4 5 6 7 8 9 10 11 12) "")
            "</div>\n")))

(defun org2site-heatmap-svg (year days)
  "DAYS: ((YYYY-MM-DD . (标题 ...)) ...)，只含当天有发文的日子。"
  (let* ((start (org2site--year-grid-start year))
         (total (apply #'+ (mapcar (lambda (d) (length (cdr d))) days)))
         (pid (format "heat-%s" year)))
    (concat
     (format "<svg class=\"heat-grid\" viewBox=\"0 0 687 89\" role=\"img\" aria-label=\"%s 年发文热力图，共 %d 篇\">\n"
             year total)
     (format "<defs><pattern id=\"%s\" width=\"13\" height=\"13\" patternUnits=\"userSpaceOnUse\"><rect width=\"11\" height=\"11\" rx=\"2\" class=\"heat-empty\"></rect></pattern></defs>\n" pid)
     (format "<rect width=\"687\" height=\"89\" fill=\"url(#%s)\"></rect>\n" pid)
     (mapconcat
      (lambda (d)
        (let* ((ymd (car d))
               (ps (cdr d))
               (titles (mapcar (lambda (p) (nth 1 p)) ps))
               (n (length titles))
               (x (* 13 (/ (org2site--days-between start ymd) 7)))
               (y (* 13 (org2site--weekday-index ymd))))
          (format (concat "<rect x=\"%d\" y=\"%d\" width=\"11\" height=\"11\" rx=\"2\""
                          " class=\"heat-cell heat-l%d\" aria-label=\"%s：%d 篇\">"
                          "<title>%s：%d 篇\n%s</title></rect>")
                  x y (org2site--heat-level n) ymd n ymd n
                  (mapconcat #'org2site-xml-escape titles "\n"))))
      days "\n")
     "\n</svg>\n")))

(defun org2site-archive-entries-html (pages)
  (concat "<div class=\"archive-entries\">\n"
          (mapconcat
           (lambda (p)
             (format "<div class=\"archive-entry\"><time datetime=\"%s\">%s</time><a href=\"%s\">%s</a></div>"
                     (org2site-iso8601 (nth 2 p))
                     (org2site--short-date (nth 2 p))
                     (nth 0 p)
                     (org2site-xml-escape (nth 1 p))))
           pages "\n")
          "\n</div>\n"))

(defun org2site-year-html (year pages &optional open)
  (let ((days (org2site--group-by (lambda (p) (org2site--day (nth 2 p))) pages)))
    (concat
     ;; 只有最新那年展开，历史年份折叠（对齐原站：Hugo 产物里第一个 details 带 open，其余都没有）
     (format "<details class=\"archive-year\"%s>\n<summary>\n" (if open " open" ""))
     "<svg class=\"chev\" viewBox=\"0 0 24 24\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 5l7 7-7 7\"/></svg>\n"
     (format "<h2>%s<span class=\"archive-count\"> · %d 篇</span></h2>\n" year (length pages))
     "</summary>\n<div class=\"archive-body\">\n<div class=\"heat-main\">\n"
     (org2site-heat-months-html year)
     "<div class=\"heat-body\">\n"
     "<div class=\"heat-weekdays\"><span style=\"top:20.8%\">Mon</span><span style=\"top:50%\">Wed</span><span style=\"top:79.2%\">Fri</span></div>\n"
     (org2site-heatmap-svg year days)
     "</div>\n</div>\n"
     (org2site-archive-entries-html pages)
     "</div>\n</details>\n")))

(defun org2site-archive-html (label pages)
  (concat
   (format "<h1>%s<span class=\"archive-count\"> · %d 篇</span></h1>\n" label (length pages))
   (let ((groups (org2site--group-by (lambda (p) (substring (org2site--day (nth 2 p)) 0 4)) pages))
         (i 0))
     (mapconcat (lambda (yg)
                  (prog1 (org2site-year-html (car yg) (cdr yg) (= i 0))
                    (setq i (1+ i))))
                groups
                "\n"))))

;; ------------------------------------------------- 数字花园（/til/ 落地页）
;;
;; 对齐原站 til/dashboard.html：大字号统计 + 分类树（三组、带占比细条）+ 最近新增 10 条。
;; 原站在 ≥1280px 把分类树放进左侧 sticky 侧栏（三栏 shell 1fr/790px/1fr），窄屏内联；
;; 这里先做内联版（窄屏行为完全一致），桌面侧栏另说。

(defvar org2site-garden-groups
  '(("技术" . ("software" "hardware" "homelab" "backup"))
    ("知识" . ("learning" "science" "courses" "history"))
    ("生活" . ("life" "health" "career" "media" "music" "writing")))
  "分类分组与顺序（对齐原站分类树）。")

(defvar org2site-reading-wpm 213
  "阅读速度（字/分）。Hugo 用 213。
注意：原站的「累计阅读」来自 Hugo 的 .ReadingTime，其 WordCount 口径无法完全复现，
所以这个数字与原站页面上的值不一定相同（实测偏大）。")

(defun org2site--cjk-chars (s)
  "统计 CJK 字符数（逐字符，避开正则范围的坑）。"
  (let ((n 0) (i 0) (len (length s)))
    (while (< i len)
      (let ((c (aref s i)))
        (when (and (>= c #x4e00) (<= c #x9fff)) (setq n (1+ n))))
      (setq i (1+ i)))
    n))

(defun org2site--reading-minutes (file)
  "单篇阅读分钟数：CJK 字符 + 拉丁词，去掉 front matter / 代码块 / URL 后按 wpm 取整。"
  (with-temp-buffer
    (insert-file-contents file)
    (let ((s (buffer-string)))
      (setq s (replace-regexp-in-string "^#\\+[A-Z_\\[\\]]+:.*$" "" s t t))
      (let ((case-fold-search t))
        (setq s (replace-regexp-in-string "#\\+BEGIN_SRC\\(.\\|\n\\)*?#\\+END_SRC" "" s t t)))
      (setq s (replace-regexp-in-string "https?://[^ \t\n]+" "" s t t))
      (max 1 (ceiling (/ (float (+ (org2site--cjk-chars s)
                                   (length (split-string s "[^A-Za-z0-9]+" t))))
                         org2site-reading-wpm))))))

(defun org2site--til-category-counts (pages)
  "按分类目录统计篇数 → ((cat . n) ...)。"
  (let (out)
    (dolist (p pages)
      (let* ((parts (split-string (nth 4 p) "/"))
             (cat (and (= (length parts) 3) (nth 1 parts))))
        (when cat
          (let ((cell (assoc cat out)))
            (if cell (setcdr cell (1+ (cdr cell))) (push (cons cat 1) out))))))
    out))

(defun org2site-garden-cats-html (repo counts &optional active grid)
  "分类树内容（不含外层容器）：标题 + 三组 + 条目。
ACTIVE 是当前分类 slug（命中则高亮）；GRID 非 nil 时用多列网格（小屏内联版），
nil 时单列（桌面左栏）。占比细条宽度按最大值取整百分比（对齐原站）。"
  (let* ((maxn (let ((m 1)) (dolist (c counts) (setq m (max m (cdr c)))) m))
         (cell (lambda (cat)
                 (let ((n (or (cdr (assoc cat counts)) 0)))
                   (if (<= n 0)
                       ""
                     (format (concat "<a class=\"garden-cat%s\" href=\"/til/%s/\">"
                                     "<span class=\"garden-cat-row\">"
                                     "<span class=\"garden-cat-name\">%s</span>"
                                     "<span class=\"garden-cat-count\">%d</span></span>"
                                     "<span class=\"garden-cat-bar\"><span style=\"width:%d%%\"></span></span>"
                                     "</a>")
                             (if (and active (string= active cat)) " is-active" "")
                             cat
                             (or (org2site--index-title repo (concat "til/" cat)) cat)
                             n
                             (floor (* 100 (/ (float n) maxn)))))))))
    (concat "<div class=\"garden-cats-head\">分类</div>\n"
            (if grid "<div class=\"garden-cats-grid\">\n" "")
            (mapconcat
             (lambda (g)
               (concat (format "<div class=\"garden-cat-group\">%s</div>\n" (car g))
                       (mapconcat (lambda (c) (funcall cell c)) (cdr g) "\n")))
             org2site-garden-groups "\n")
            (if grid "\n</div>\n" "\n"))))

(defun org2site-til-tree-html (repo counts active)
  "桌面左栏的分类树（≥1280px 显示，<1280px 由 CSS 隐藏）。
ACTIVE 是当前分类 slug：分类页高亮自己，/til/ 根页与笔记页传空串。"
  (format "<nav data-til-tree>\n%s\n</nav>\n"
          (org2site-garden-cats-html repo counts active nil)))

;; ---------------------------------------------------------------- 分类页
;;
;; 原站 layouts/til/list.html 两套模板：
;;   有 #+HEADER 的分类 → 面包屑 + 顶部筛选 chips + 按 header 分组的小节 +「其他」折叠块
;;   没有的            → 面包屑 + 扁平列表
;; 两边都**按标题排序**（Hugo .ByTitle），日期只显示到天。

(defun org2site--punct-or-symbol-p (c)
  "标点 / 符号 / 空白 → t。原站 collator（CLDR）把这些排在数字与字母之前。"
  (or (<= c #x2f)                          ; ASCII control/空格/数字前标点符号
      (and (>= c #x3a) (<= c #x40))
      (and (>= c #x5b) (<= c #x60))
      (and (>= c #x7b) (<= c #x7e))
      (and (>= c #x2000) (<= c #x206f))    ; 通用标点（含破折号区）
      (and (>= c #x3000) (<= c #x303f))    ; CJK 标点（《》、。）
      (and (>= c #xff00) (<= c #xff20))    ; 全角形式
      (and (>= c #xff3b) (<= c #xff40))
      (and (>= c #xff5b) (<= c #xff65))))

(defun org2site--title-key (title)
  "标题排序键：复现原站 Hugo .ByTitle（CLDR：大小写不敏感，标点/符号先于数字字母）。
每个字符换成两字符 —— 类权重（私用区 #xE000 标点 / #xE001 其它）+ 折叠后的字符，
按字符串比较即等价于按 (类, 折叠字符) 序列比较。实测 30 个分组 462 条零差异。

**不要用 `make-string` + `aset` 拼这个键**：`(make-string n ?a)` 之类会得到 unibyte 串，
往里 `aset` 私用区码位在 emacs 31 直接报
`Attempt to store non-ASCII char into multibyte string`（30.1 只是静默截断，所以一直没暴露）。
`concat` 会正确处理多字节。"
  (let ((parts nil)
        (n (length title))
        (i 0))
    (while (< i n)
      (let* ((ch (aref title i))
             (fold (downcase (char-to-string ch))))
        (push (concat (if (org2site--punct-or-symbol-p ch) "\uE000" "\uE001") fold)
              parts))
      (setq i (1+ i)))
    (apply #'concat (nreverse parts))))

(defun org2site--by-title (pages)
  "按标题排序（对齐原站 .ByTitle）。"
  (sort (copy-sequence pages)
        (lambda (a b)
          (string< (org2site--title-key (nth 1 a))
                   (org2site--title-key (nth 1 b))))))

(defun org2site--cat-entry-html (p)
  "分类页一行：标题左、日期右。日期只到天（原站 `2006-01-02`），没有日期就不渲染。"
  (let ((day (org2site--day (nth 2 p))))
    (concat (format "<a class=\"til-entry\" href=\"%s\">" (nth 0 p))
            (format "<span class=\"til-entry-t\">%s</span>"
                    (org2site-xml-escape (nth 1 p)))
            (if (string-match-p "\\`[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\'" day)
                (format "<span class=\"til-entry-d\">%s</span>" day)
              "")
            "</a>\n")))

(defun org2site--cat-groups (items)
  "按 #+HEADER 分组 → ((key . pages) ...) 按 key 排序；其余页单列。
返回 (groups . others)，两者内部都按标题排序。"
  (let ((tm (make-hash-table :test 'equal)) (others nil) keys)
    (dolist (p items)
      (let ((h (nth 6 p)))
        (if (and h (not (string-empty-p h)))
            (progn
              (unless (gethash h tm) (push h keys))
              (puthash h (append (gethash h tm) (list p)) tm))
          (push p others))))
    (cons (mapcar (lambda (k) (cons k (org2site--by-title (gethash k tm))))
                  (sort keys (lambda (a b)
                               (string< (org2site--title-key a)
                                        (org2site--title-key b)))))
          (org2site--by-title (nreverse others)))))

(defun org2site--cat-sub-html (pages)
  (format "<div class=\"til-cat-sub\">\n%s</div>\n"
          (mapconcat #'org2site--cat-entry-html pages "")))

(defun org2site--cat-sec-html (key pages)
  (format (concat "<section class=\"til-cat-sec\" data-header=\"%s\">\n"
                  "<div class=\"til-cat-sec-head\"><h2>%s</h2>"
                  "<span class=\"til-cat-sec-n\">%d</span></div>\n%s</section>\n")
          (org2site-xml-escape key) (org2site-xml-escape key) (length pages)
          (org2site--cat-sub-html pages)))

(defun org2site--cat-others-html (others)
  "没有 #+HEADER 的页 → 折叠的「其他」小节（原站 details.group）。
data-header 留空：点了任一 chip 时它也会被过滤掉，与原站行为一致。"
  (format (concat "<section class=\"til-cat-sec\" data-header=\"\">\n"
                  "<details class=\"til-others\">\n"
                  "<summary><h2>其他</h2>"
                  "<span class=\"til-others-n\">%d 篇</span>%s</summary>\n%s</details>\n</section>\n")
          (length others)
          "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" aria-hidden=\"true\">\
<path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"/></svg>"
          (org2site--cat-sub-html others)))

(defun org2site--cat-chips-html (groups)
  "小屏（<1400px）顶部的分组筛选条；≥1400px 由右栏承担（CSS 隐藏这里）。"
  (concat "<div class=\"til-cat-chips\">\n"
          (mapconcat
           (lambda (g)
             (format (concat "<button type=\"button\" class=\"til-chip\" data-header-btn=\"%s\">"
                             "%s <span class=\"til-chip-n\">%d</span></button>\n")
                     (org2site-xml-escape (car g)) (org2site-xml-escape (car g))
                     (length (cdr g))))
           groups "")
          "<button type=\"button\" class=\"til-chip til-chip-all\" data-headers-all>全部</button>\n"
          "</div>\n"))

(defun org2site--cat-right-html (groups)
  "≥1400px 右栏「本页分组」；没有分组时返回 nil（右栏不渲染）。"
  (when groups
    (concat "<div class=\"til-cat-navhead\">本页分组</div>\n"
            "<nav id=\"header-nav\" class=\"til-cat-nav\">\n"
            (mapconcat
             (lambda (g)
               (format (concat "<button type=\"button\" class=\"til-cat-navbtn\" data-header-btn=\"%s\">"
                               "%s <span class=\"til-cat-navn\">%d</span></button>\n")
                       (org2site-xml-escape (car g)) (org2site-xml-escape (car g))
                       (length (cdr g))))
             groups "")
            "<button type=\"button\" class=\"til-cat-navall\" data-headers-all>全部显示</button>\n"
            "</nav>\n")))

(defun org2site-cat-html (label items)
  "分类页正文 + 右栏 HTML → (body . right-html)。"
  (let* ((gr (org2site--cat-groups items))
         (groups (car gr))
         (others (cdr gr))
         (crumb (format (concat "<nav class=\"til-crumb\" aria-label=\"breadcrumb\">"
                                "<a href=\"/til/\">数字花园</a>"
                                "<span class=\"til-crumb-sep\">/</span>"
                                "<span class=\"til-crumb-cur\">%s</span></nav>\n")
                        (org2site-xml-escape label)))
         (title (format "<h1 class=\"til-cat-title\">%s</h1>\n" (org2site-xml-escape label))))
    (cons (concat "<div data-pagefind-ignore>\n" crumb title
                  (if groups
                      (concat (org2site--cat-chips-html groups)
                              (mapconcat (lambda (g) (org2site--cat-sec-html (car g) (cdr g)))
                                         groups "")
                              (if others (org2site--cat-others-html others) ""))
                    (org2site--cat-sub-html (org2site--by-title items)))
                  "</div>\n")
          (org2site--cat-right-html groups))))

(defun org2site--clock-minutes (file)
  "读文件里的 CLOCK 行，累计分钟数。
org 自己会把时长写在 => 后面（如 `=>  1:30`），直接读它比再算时间差稳。
全库没有 CLOCK 时返回 0 —— 这就是为什么统计要做成「有数据才显示」。
（原站的「累计阅读」来自 Hugo 的 .ReadingTime，口径无法复现，已换成这个自洽的指标。）"
  (with-temp-buffer
    (insert-file-contents file)
    (let ((n 0))
      (goto-char (point-min))
      (while (re-search-forward "^[ \t]*CLOCK:.*=>[ \t]*\\([0-9]+\\):\\([0-9]+\\)" nil t)
        (setq n (+ n (* 60 (string-to-number (match-string 1)))
                   (string-to-number (match-string 2)))))
      n)))

(defun org2site--planning (file)
  "抽文件里的 SCHEDULED / DEADLINE → ((kind ymd) ...)，kind 是 \"计划\"/\"截止\"。"
  (with-temp-buffer
    (insert-file-contents file)
    (goto-char (point-min))
    (let (out)
      (while (re-search-forward "\\(SCHEDULED\\|DEADLINE\\):[ \t]*<\\([0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\)" nil t)
        (push (list (if (string= (match-string 1) "DEADLINE") "截止" "计划")
                    (match-string 2))
              out))
      (nreverse out))))

(defun org2site-planned-html (repo pages org-root)
  "有 SCHEDULED/DEADLINE 的条目渲染成「计划」小节；没有就返回空串。
这些日期不进页面正文（org 默认会把 SCHEDULED 渲染成文字），只在这里聚合成一张表。"
  (let (rows)
    (dolist (p pages)
      (dolist (pl (org2site--planning (expand-file-name (nth 4 p) org-root)))
        (push (list (nth 1 pl) (nth 0 pl) (nth 0 p) (nth 1 p)) rows)))
    (if (null rows)
        ""
      (setq rows (sort rows (lambda (a b) (string< (car a) (car b)))))
      (concat "<div class=\"garden-cats-head\">计划</div>\n<ul data-plan-list>\n"
              (mapconcat
               (lambda (r)
                 (format "<li><time datetime=\"%s\">%s</time><span class=\"plan-kind\">%s</span><a href=\"%s\">%s</a></li>"
                         (nth 0 r) (nth 0 r) (nth 1 r) (nth 2 r)
                         (org2site-xml-escape (nth 3 r))))
               rows "\n")
              "\n</ul>\n"))))

(defun org2site-garden-html (repo label pages org-root)
  (let* ((counts (org2site--til-category-counts pages))
         (minutes (let ((m 0))
                    (dolist (p pages)
                      (setq m (+ m (org2site--clock-minutes
                                    (expand-file-name (nth 4 p) org-root)))))
                    m))
         (recent (seq-take pages 10)))
    (concat
     (format "<h1>%s</h1>\n" label)
     "<div class=\"garden-stats\">\n"
     (format "<div><span class=\"garden-stat-num\">%d</span><span class=\"garden-stat-label\">篇笔记</span></div>\n"
             (length pages))
     ;; 只有真的记过 CLOCK 才显示投入时间；没有就不挂个 0h 出来
     (if (> minutes 0)
         (format "<div><span class=\"garden-stat-num\">%d<span class=\"garden-stat-unit\">h</span></span><span class=\"garden-stat-label\">累计投入</span></div>\n"
                 (/ minutes 60))
       "")
     "</div>\n"
     ;; 分类树：桌面端（≥1280px）由左栏承担，这里是小屏内联那份
     (format "<div class=\"garden-cats\" data-til-inline>\n%s</div>\n"
             (org2site-garden-cats-html repo counts nil t))
     (org2site-planned-html repo pages org-root)
     ;; 「随机一篇」：URL 列表由服务端生成，点击由 site.js 处理（无 JS 时按钮不显示）
     (format "<div class=\"garden-actions\"><button type=\"button\" data-random-til hidden>随机一篇</button></div>\n<script id=\"til-urls\" type=\"application/json\">[%s]</script>\n"
             (mapconcat (lambda (p) (format "\"%s\"" (nth 0 p))) pages ","))
     "<div class=\"garden-recent-head\">最近新增</div>\n<div class=\"garden-recent\">\n"
     (mapconcat
      (lambda (p)
        (format "<a class=\"garden-entry\" href=\"%s\"><span>%s</span><span>%s</span></a>"
                (nth 0 p)
                (org2site-xml-escape (nth 1 p))
                (substring (org2site--day (nth 2 p)) 5 10)))
      recent "\n")
     "\n</div>\n")))

;; ---------------------------------------------------------------- 目录（本页内容）
;;
;; 原站只有 TIL 页（有标题的那些）与 5 个根页面带「本页内容」目录，
;; /posts/ 文章一律没有。锚点用 GitHub 风格 slug（见 export.el 的 org2site-slug）。

(defvar org2site-toc-root-pages '("about" "start" "read" "watch" "important-now")
  "除 TIL 外，原站带目录的根页面（文件基名，不含扩展名）。")

(defun org2site-toc-page-p (page)
  (or (string= (nth 3 page) "til")
      (member (file-name-base (nth 4 page)) org2site-toc-root-pages)))

(defun org2site-toc-items (body)
  "按顺序抽出正文里的 (层级 slug 标题)。"
  (let (items)
    (with-temp-buffer
      (insert body)
      (goto-char (point-min))
      (let ((case-fold-search t))
        (while (re-search-forward "<\\(h[2-4]\\) id=\"\\([^\"]*\\)\">\\(.*?\\)</\\1>" nil t)
          (push (list (string-to-number (substring (match-string 1) 1))
                      (match-string 2)
                      (replace-regexp-in-string "<[^>]+>" "" (match-string 3)))
                items))))
    (nreverse items)))

(defun org2site-toc-list (items level)
  "把 ITEMS 里 level 及更深的条目渲染成嵌套 <ul>；返回 (html . 剩余 items)。"
  (let ((out "<ul>"))
    (while (and items (>= (nth 0 (car items)) level))
      (let ((lvl (nth 0 (car items)))
            (slug (nth 1 (car items)))
            (title (nth 2 (car items))))
        (setq items (cdr items))
        (setq out (concat out (format "<li><a href=\"#%s\">%s</a>" slug title)))
        (when (and items (> (nth 0 (car items)) lvl))
          (let ((sub (org2site-toc-list items (1+ lvl))))
            (setq out (concat out (car sub)))
            (setq items (cdr sub))))
        (setq out (concat out "</li>"))))
    (cons (concat out "</ul>") items)))

(defun org2site-toc-insert (body)
  "把「本页内容」目录插到 <h1> 之后（对齐原站位置）。没有可列标题时不插。"
  (let ((items (org2site-toc-items body)))
    (if (null items)
        body
      (let ((toc (concat "<details class=\"page-toc\">\n<summary>本页内容</summary>\n"
                         "<div class=\"til-toc\">\n<nav id=\"TableOfContents\">\n"
                         (car (org2site-toc-list items 2))
                         "\n</nav>\n</div>\n</details>\n")))
        (if (string-match "\\`<h1[^>]*>[^<]*</h1>\n" body)
            (concat (match-string 0 body) toc (substring body (match-end 0)))
          (concat toc body))))))

(defun org2site--bad-slug-p (url)
  "URL 含非小写 ASCII slug 字符（大写 / 中文 / 空格）时为真。
文件名直接就是 URL（见 `org2site-scan'），所以这条同时是「文件名规范」的校验。"
  (string-match-p "[^a-z0-9/._%-]" url))

(defun org2site--build-url-map (pages)
  "wikilink 解析表：路径（til/software/coding）与**不重名**的 basename（coding）→ URL。
重名的 basename 一律不进表（projects / sentences / now / 2024 这类两个目录下都有），
免得把链接指到错误的一篇。"
  (let ((h (make-hash-table :test 'equal))
        (seen (make-hash-table :test 'equal)))
    (dolist (p pages)
      (let* ((rel (nth 4 p))
             (url (nth 0 p))
             (path (file-name-sans-extension rel))
             (base (file-name-base rel)))
        (puthash path url h)
        (if (gethash base seen)
            (puthash base :ambiguous seen)
          (puthash base url seen))))
    (maphash (lambda (k v)
               (when (eq v :ambiguous) (remhash k h))
               (when (stringp v) (puthash k v h)))
             seen)
    h))

(defun org2site-long-date (day)
  "2022-02-10 → 10 Feb, 2022（对齐原站 Go 的 \"02 Jan, 2006\" 布局）。"
  (if (not (string-match-p "\\`[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\'" day))
      ""
    (let ((names ["Jan" "Feb" "Mar" "Apr" "May" "Jun"
                  "Jul" "Aug" "Sep" "Oct" "Nov" "Dec"]))
      (format "%s %s, %s"
              (substring day 8 10)
              (aref names (1- (string-to-number (substring day 5 7))))
              (substring day 0 4)))))

(defun org2site-tag-links-html (tags)
  "标签链接（原站 `<a href=/tags/x/ rel=tag>#x</a>`；href 走百分号编码，同标签索引页）。"
  (mapconcat (lambda (tag)
               (format "<a href=\"/tags/%s/\" rel=\"tag\">#%s</a>"
                       (url-hexify-string (downcase tag)) (org2site-xml-escape tag)))
             tags ""))

(defun org2site--uri-encode (s)
  "encodeURIComponent 语义的百分号编码（原站 mailto 主题就是这么编的：
  只把标题编码，`[tianheg.co] Re: ' 保留字面）。url-hexify-string 会连方括号冒号一起编。"
  (let ((out ""))
    (dolist (b (string-to-list (encode-coding-string s 'utf-8)))
      (setq out (concat out
                        (if (or (and (>= b ?A) (<= b ?Z))
                                (and (>= b ?a) (<= b ?z))
                                (and (>= b ?0) (<= b ?9))
                                (memq b '(?- ?_ ?. ?! ?~ ?* ?' ?\( ?\))))
                            (char-to-string b)
                          (format "%%%02X" b)))))
    out))

(defun org2site--mailto-reply-html (title)
  "「✍️ Reply by email」——主题按原站格式编码。"
  (format (concat "<p class=\"post-reply\"><a href=\"mailto:i@tianheg.co?subject=%s\">"
                  "✍️ Reply by email</a></p>\n")
          (format "[tianheg.co] Re: %s" (org2site--uri-encode title))))

(defun org2site--comments-html (p)
  "评论区（原站用自托管 Artalk，脚本与样式由 Worker 反代 /dist/*）。"
  (let ((url (format "https://tianheg.co%s" (nth 0 p))))
    (concat "<section id=\"comments\" class=\"post-comments\">\n"
            "<h2 class=\"post-comments-head\">"
            "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" \
stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">\
<path d=\"M7.9 20A9 9 0 104 16.1L2 22z\"/></svg>"
            "<span>Comments</span></h2>\n"
            (org2site--mailto-reply-html (nth 1 p))
            "<div id=\"Comments\"></div>\n</section>\n"
            "<link rel=\"stylesheet\" href=\"/dist/Artalk.css\">\n"
            "<script src=\"/dist/Artalk.js\"></script>\n"
            "<script>\n(function(){var e=document.documentElement,t=Artalk.init({el:\"#Comments\","
            "pageKey:" (concat "\"" url "\"") ",pageTitle:"
            (let ((json (json-encode (nth 1 p)))) json)
            ",server:\"\",site:\"Tianhe Gao\",darkMode:e.classList.contains(\"dark\")}),"
            "n=function(){t.setDarkMode(e.classList.contains(\"dark\"))},"
            "s=e.classList.contains(\"dark\");t.on(\"mounted\",n),"
            "new MutationObserver(function(){var t=e.classList.contains(\"dark\");"
            "if(t===s)return;s=t,n()}).observe(e,{attributes:!0,attributeFilter:[\"class\"]})})()\n"
            "</script>\n")))

(defun org2site-post-augment (p body)
  "文章页补两处（原站有、我们原来没有）：h1 下方的日期条 + 尾部的分割线/标签/评论区。"
  (let* ((day (org2site--day (nth 2 p)))
         (meta (if (string-match-p "\\`[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\'" day)
                   (format "<div class=\"post-meta\"><time datetime=\"%s\">%s</time></div>\n"
                           day (org2site-long-date day))
                 ""))
         (tags (nth 5 p)))
    (concat (if (string-match "\\`<h1[^>]*>[^<]*</h1>\n" body)
                (concat (match-string 0 body) meta (substring body (match-end 0)))
              (concat meta body))
            "<hr class=\"post-rule\">\n"
            (if tags
                (format "<footer class=\"post-tags\"><div>%s</div></footer>\n"
                        (org2site-tag-links-html tags))
              "")
            (org2site--comments-html p))))

(defun org2site--report-bad-slugs (pages)
  "文件名规范检查：一律小写英文 slug，中文名请翻译成英文（用户定的规则）。
只警告不中断 —— 构建不能因为新加了一篇中文名文件就整个挂掉。"
  (let (bad)
    (dolist (p pages)
      (when (org2site--bad-slug-p (nth 0 p)) (push (nth 4 p) bad)))
    (if (null bad)
        (princ "文件名规范：全部为小写 ASCII slug ✓\n")
      (setq bad (nreverse bad))
      (princ (format "文件名规范：%d 个不合规（要小写英文 slug，中文请翻译；只警告）\n"
                     (length bad)))
      (dolist (b (seq-take bad 10)) (princ (format "  警告 %s\n" b))))))

;; ---------------------------------------------------------------- 构建

(defun org2site-build (org-root out-root)
  (let* ((pages (org2site-scan org-root))
         (ok 0) (fail 0) (errs nil) (rss-items nil))
    (org2site--report-bad-slugs pages)
    ;; wikilink 解析表：必须在导出任何一篇之前建好（export.el 里按它把 [[slug]] 还原成真链接）
    (setq org2site-url-map (org2site--build-url-map pages))
    ;; 0) 静态资源：仓库 scripts/org2site/static/ → 输出。
    ;;    样式表与灯箱 JS 都是随仓库走的冻结产物，不需要 node 构建。
    ;;    以前把 style.css 只放在输出目录，清空输出就丢了 —— 现在以仓库为准。
    (let* ((repo (org2site--repo-root org-root))
           (static (expand-file-name "scripts/org2site/static" repo)))
      (dolist (pair '(("style.css" . "style.css")
                      ("photos.js" . "js/photos.js")
                      ("site.js" . "js/site.js")))
        (let ((src (expand-file-name (car pair) static))
              (dst (expand-file-name (cdr pair) out-root)))
          (when (file-exists-p src)
            (make-directory (file-name-directory dst) t)
            (copy-file src dst t))))
      ;; 资源版本号跟随源文件 mtime：改样式后重跑即自动失效浏览器缓存
      (let ((css (expand-file-name "style.css" static)))
        (when (file-exists-p css)
          (setq org2site-asset-version
                (format-time-string "%Y%m%d%H%M%S"
                                    (file-attribute-modification-time
                                     (file-attributes css))))))
      ;; 仓库 static/（原站由 Hugo 整目录拷过来）：favicon / icon-* / manifest /
      ;; robots.txt / _headers / images/ / fonts/ / js/ / projects/ / resume*.pdf /
      ;; pagefind-semantic/（语义检索索引，脚本 worker.js 从 ASSETS 读）。
      ;; 只有 _photos/ 不拷：13M，且全站没有任何引用（那是 photos.json 的上游素材）。
      (let ((hugo-static (expand-file-name "static" repo)))
        (when (file-exists-p hugo-static)
          (dolist (entry (directory-files hugo-static t "\\`[^.]"))
            (unless (string= (file-name-nondirectory entry) "_photos")
              (let ((dst (expand-file-name (file-name-nondirectory entry) out-root)))
                (if (file-directory-p entry)
                    (copy-directory entry dst t t t)
                  (copy-file entry dst t))))))))
    ;; 1) 文章页（目录化）。相册 stub 跳过 —— /photos/<num>/ 由 3.6 用 photos.json 生成。
    (dolist (p (seq-remove (lambda (p) (string= (nth 3 p) "photos")) pages))
      (let ((rel (nth 4 p)) (url (nth 0 p)) (title (nth 1 p)))
        (condition-case err
            (let* ((file (expand-file-name rel org-root))
                   (body (org2site-export-string file rel))
                   (body (if (org2site-toc-page-p p) (org2site-toc-insert body) body))
                   ;; 文章页补日期条 + 尾部标签/评论（原站有；til 页没有这两块）
                   (body (if (string= (nth 3 p) "posts") (org2site-post-augment p body) body)))
              (org2site-write out-root url
                              (org2site-page title body (string= (nth 3 p) "til")))
              ;; RSS 只收 posts：原站 index.xml 不含 til（逐条对比 URL 实测确认）
              (when (string= (nth 3 p) "posts")
                (push (list url title (nth 2 p) (org2site-summary body)) rss-items))
              (setq ok (1+ ok)))
          (error (setq fail (1+ fail))
                 (push (cons rel (error-message-string err)) errs)))
        (let ((b (get-file-buffer (expand-file-name rel org-root))))
          (when b (kill-buffer b)))))
    ;; 2) section 列表页（相册不在此列：/photos/ 是相册索引，见 3.6）
    (let* ((repo (org2site--repo-root org-root))
           ;; 左栏分类树用的是全库 til 计数（分类页也要显示完整树，不是只有自己那栏）
           (til-counts (org2site--til-category-counts
                        (seq-filter (lambda (p) (string= (nth 3 p) "til")) pages))))
      (dolist (sec '("posts" "til"))
        (let* ((items (seq-filter (lambda (p) (string= (nth 3 p) sec)) pages))
               (label (or (cdr (assoc sec org2site-section-labels))
                          (org2site--index-title repo sec) sec))
               ;; posts 走年份归档 + 热力图；til 走数字花园落地页（对齐原站）
               (body (cond ((string= sec "posts") (org2site-archive-html label items))
                           ((string= sec "til") (org2site-garden-html repo label items org-root))
                           (t (org2site-list-html label items)))))
          (when items
            (org2site-write out-root (concat "/" sec "/")
                            (org2site-page label body (string= sec "til")
                                           (when (string= sec "til")
                                             (org2site-til-tree-html repo til-counts "")))))))
      ;; 2.5) TIL 分类页 /til/<cat>/（原站有这一层 URL；标题取该目录的 _index.org）
      (dolist (d (org2site--subdirs (expand-file-name "org/til" repo)))
        (let* ((cat (file-name-nondirectory d))
               (items (seq-filter (lambda (p)
                                    (string-prefix-p (concat "til/" cat "/") (nth 4 p)))
                                  pages))
               (label (or (org2site--index-title repo (concat "til/" cat)) cat)))
          (when items
            (let ((page (org2site-cat-html label items)))
              (org2site-write out-root (concat "/til/" cat "/")
                              (org2site-page label (car page) t
                                             (org2site-til-tree-html repo til-counts cat)
                                             (cdr page))))))))
    ;; 3) 根页（footer 只有首页有，见 export.el 的 org2site-show-footer）
    (let ((org2site-show-footer t))
      (org2site-write out-root "/"
                      (org2site-page org2site-site-title (org2site-home-html pages))))

    ;; 3.5) 标签页：/tags/ 索引 + /tags/<tag>/（中文直接做目录名，与原站一致）
    (let* ((counts (org2site-tag-counts pages))
           (tm (make-hash-table :test 'equal)))
      (dolist (p pages)  ; 用 append 保持日期降序（push 会反过来）
        (dolist (tag (nth 5 p))
          (puthash tag (append (gethash tag tm) (list p)) tm)))
      (org2site-write out-root "/tags/" (org2site-page "Tags" (org2site-tags-index-html counts)))
      (maphash
       (lambda (tag ps)
         ;; 目录名/URL 走 downcase：原站 ASCII 标签是小写 english，中文标签不变
         (org2site-write out-root (concat "/tags/" (downcase tag) "/")
                         (org2site-page tag (org2site-tag-page-html tag ps))))
       tm))

    ;; 3.6) 相册：/photos/ 系列索引 + /photos/<num>/ 网格 + 灯箱
    (let* ((repo (org2site--repo-root org-root))
           (data (org2site--json-read-file (expand-file-name "data/photos.json" repo))))
      (when data
        (org2site-write out-root "/photos/"
                        (org2site-page "Photos" (org2site-photos-index-html data)))
        (dolist (s (alist-get 'series data))
          (let ((photos (alist-get 'photos s))
                (name (or (alist-get 'name s) "")))
            (when photos
              (org2site-write
               out-root (format "/photos/%s/" (alist-get 'num s))
               (org2site-page name
                              (concat (format "<h1>%s</h1>\n" (org2site-xml-escape name))
                                      (org2site-photos-grid-html photos)
                                      (org2site-lightbox-html)))))))))

    ;; 4) RSS / sitemap / 404（pages 已是日期倒序，rss-items 是 push 出来的，需 nreverse）
    (org2site-write-file out-root "index.xml"
      (org2site-rss-xml (seq-take (nreverse rss-items) org2site-rss-limit)))
    (org2site-write-file out-root "sitemap.xml" (org2site-sitemap-xml pages))
    (org2site-write-file out-root "404.html"
      (org2site-page "页面不存在"
                     (concat "<div class=\"notfound\">\n"
                             "<h1>404</h1>\n"
                             "<p>Page not found</p>\n"
                             "<p>The page may have been moved or deleted. Try "
                             "<a href=\"/search\">searching</a> for what you need.</p>\n"
                             "<a class=\"notfound-btn\" href=\"/\">Take me home</a>\n"
                             "</div>\n")))

    (let ((un (nreverse org2site-unresolved-wikilinks)))
      (princ (format "wikilink 未解析（已退成纯文本）：%d 处%s\n"
                     (length un)
                     (if un (format "；样例 %s" (mapconcat #'identity (seq-take un 5) " | ")) ""))))
    (princ (format "文章 %d 篇 OK / %d FAIL（共 %d）；index.xml / sitemap.xml / 404.html\n"
                   ok fail (length pages)))
    (dolist (e (seq-take (nreverse errs) 30))
      (princ (format "  FAIL %s :: %s\n" (car e) (cdr e))))
    (if (> fail 0) 1 0)))

(when (and noninteractive (>= (length command-line-args-left) 2))
  (kill-emacs (org2site-build (nth 0 command-line-args-left) (nth 1 command-line-args-left))))
