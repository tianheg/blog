;; -*- lexical-binding: t; -*-
;;; build.el --- 批量导出 + 站点级页面生成
;;;
;;; 用法：emacs -Q --batch -l build.el <org根目录> <输出根目录>
;;;
;;; 输出结构（URL 目录化，不带 .html 后缀）：
;;;   org/posts/foo.org        → <out>/posts/foo/index.html         → /posts/foo/
;;;   另有 /posts/ 列表页与根页 /

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
  "取日期部分（前 10 字符）。空/非法日期返回哨兵 \"0000-01-01\"：排序自然落到最后、
归档里归入「无日期」分组。必须对任何输入都返回合法字符串 —— 一个缺 #+DATE: 的草稿
曾让归档页 substring(\"\" 0 4) 直接 args-out-of-range，把整站构建打断。"
  (let ((d (or date "")))
    (if (string-match "\\([0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}\\)" d)
        (match-string 1 d)
      "0000-01-01")))

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

(defun org2site--lastmod-tag (date)
  "有真实日期才输出 <lastmod>。页面文件（uses/links/watch/search…）本来没有日期，
大列表里硬塞 1970-01-01 / 0000-01-01 属于非法或误导值 —— sitemap 里 lastmod 本就可选。"
  (let ((d (org2site--day date)))
    (if (equal d "0000-01-01") ""
      (format "<lastmod>%s</lastmod>" (org2site-iso8601 d)))))

(defun org2site-sitemap-xml (pages)
  (concat
   "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
   "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
   (concat
    (format "<url><loc>%s/</loc>%s</url>\n"
            org2site-base-url
            (org2site--lastmod-tag (if pages (nth 2 (car pages)) "")))
    (format "<url><loc>%s/posts/</loc></url>\n" org2site-base-url)
    (format "<url><loc>%s/photos/</loc></url>\n" org2site-base-url))
   (mapconcat
    (lambda (p)
      (format "<url><loc>%s%s</loc>%s</url>\n"
              org2site-base-url (nth 0 p) (org2site--lastmod-tag (nth 2 p))))
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

(defvar org2site--no-date-files nil
  "缺可解析 #+DATE:、被跳过不构建的内容页（rel . 原始值）；构建结束时点名列出来。")

(defun org2site-scan (org-root)
  "扫描 org，返回 ((url title date section rel tags) ...)，按日期倒序。
_index.org 是 Hugo 语义里的 section 索引，不是页面 —— 跳过，标题另用
org2site--index-title 取；#+NOEXPORT: t 的文件也不发布。"
  (let (out)
    (dolist (f (directory-files-recursively org-root "\\.org\\'" nil))
      ;; Emacs 的锁文件（.#foo.org -> user@host.pid）与自动保存（#foo.org#）不是内容页。
      ;; 上一轮构建被中断时会留下 .# 锁，下一轮若把它当页面读，会以 file-missing 直接崩掉整站构建。
      (unless (or (string-prefix-p ".#" (file-name-nondirectory f))
                  (string-prefix-p "#" (file-name-nondirectory f))
                  (string= (file-name-nondirectory f) "_index.org")
                  (org2site--noexport-p f))
        (let* ((rel (file-relative-name f org-root))
               (noext (file-name-sans-extension rel))
               (section (car (split-string noext "/")))
               (raw-date (or (org2site--kw f "DATE") ""))
               (date (org2site--date raw-date)))
          ;; 规则（2026-10-19 用户定）：posts/ 下的内容页必须有可解析的 #+DATE:；
          ;; 没有的**直接跳过不构建**（不进归档/RSS/sitemap），只在构建日志里点名。
          ;; 页面文件（uses/links/watch/search…）本来就没有日期，照常构建。
          (if (and (string= section "posts")
                   (not (string-match "[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}" date)))
              (push (cons rel raw-date) org2site--no-date-files)
            (push (list (concat "/" noext "/")
                        (or (org2site--typo-string (org2site--kw f "TITLE")) noext)
                        date
                        section rel
                        (org2site--tags f)
                        (org2site--kw f "HEADER"))
                  out)))))
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

(defun org2site-write-source (out-root url src-file)
  "纯文本源文：URL \"/posts/foo/\" → <out-root>/posts/foo.org（原文照搬，不改一个字节）。

为什么是 .org 而不是原来的 .md：内容真源已经是 org，再导一份 Markdown 等于维护
第二份文本；.org 直接就是源文件本身，给阅读器 / 爬虫 / LLM 用。
响应头（charset）在 static/_headers 里强制，否则 CF 会按 latin-1 解码出乱码。"
  (let* ((rel (concat (directory-file-name (string-remove-prefix "/" url)) ".org"))
         (path (expand-file-name rel out-root)))
    (make-directory (file-name-directory path) t)
    (let ((coding-system-for-write 'utf-8-unix)
          (select-safe-coding-system-accept-default-p t))
      (copy-file src-file path t))))

(defun org2site-source-link-html (url)
  "文章页末尾指向自己源文的链接（URL \"/posts/foo/\" → \"/posts/foo.org\"）。"
  (format "<p class=\"src-link\"><a href=\"%s.org\">源文（.org）</a></p>\n"
          (directory-file-name url)))

(defun org2site-source-link-page-p (page)
  "这篇页面是否该在末尾挂「源文（.org）」链接。
只挂 posts 下的页面。根页面（about / search / watch / links …）是站点功能性页面，
挂源文对读者没意义。注意 /posts/2019/ 这类年份页是用户自己写的年度流水，**要挂**
（用户 2026-10-24 定）。"
  (string= (nth 3 page) "posts"))

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

(defun org2site-home-section (title url items)
  (concat
   (format "<section>\n<header><h2>%s</h2><a href=\"%s\">View all →</a></header>\n<ul>\n"
           title url)
   (mapconcat
    (lambda (p)
      (format "<li><a href=\"%s\">%s</a><time datetime=\"%s\">%s</time></li>"
              (nth 0 p) (nth 1 p)
              (nth 2 p) (org2site--short-date (nth 2 p))))
    items "\n")
   "\n</ul>\n</section>\n"))

(defun org2site-home-html (pages)
  "首页：Welcome + Recent Posts。"
  (let* ((posts (seq-filter (lambda (p) (string= (nth 3 p) "posts")) pages))
         (recent (seq-take posts 5)))
    (concat
     "<h1>Welcome</h1>\n"
     "<p>Hi, I'm tianheg. I write this blog in both Chinese and English "
     "to share my life experiences.</p>\n"
     "<p>I hope you enjoy reading it!</p>\n"
     "<p><a data-cta href=\"/start/\">Start here <span aria-hidden=\"true\">→</span></a></p>\n"
     "<div data-home-columns>\n"
     (org2site-home-section "Recent Posts" "/posts/" recent)
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
  '(("posts" . "文章"))
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
  (let* ((no-date (string= year "0000"))
         (label (if no-date "无日期" year))
         (days (org2site--group-by (lambda (p) (org2site--day (nth 2 p))) pages)))
    (concat
     ;; 只有最新那年展开，历史年份折叠（对齐原站：Hugo 产物里第一个 details 带 open，其余都没有）
     (format "<details class=\"archive-year\"%s>\n<summary>\n" (if open " open" ""))
     "<svg class=\"chev\" viewBox=\"0 0 24 24\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 5l7 7-7 7\"/></svg>\n"
     (format "<h2>%s<span class=\"archive-count\"> · %d 篇</span></h2>\n" label (length pages))
     "</summary>\n<div class=\"archive-body\">\n"
     ;; 无日期分组（year=0000）没有可画的热力图，跳过整块 heat 结构
     (unless no-date
       (concat "<div class=\"heat-main\">\n"
               (org2site-heat-months-html year)
               "<div class=\"heat-body\">\n"
               "<div class=\"heat-weekdays\"><span style=\"top:20.8%\">Mon</span><span style=\"top:50%\">Wed</span><span style=\"top:79.2%\">Fri</span></div>\n"
               (org2site-heatmap-svg year days)
               "</div>\n</div>\n"))
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

;; ---------------------------------------------------------------- 目录（本页内容）
;;
;; 只有 5 个根页面带「本页内容」目录，/posts/ 文章一律没有。
;; 锚点用 GitHub 风格 slug（见 export.el 的 org2site-slug）。

(defvar org2site-toc-root-pages '("about" "start" "read" "watch" "important-now")
  "除 TIL 外，原站带目录的根页面（文件基名，不含扩展名）。")

(defun org2site-toc-page-p (page)
  (member (file-name-base (nth 4 page)) org2site-toc-root-pages))

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
                         "<div class=\"page-toc-list\">\n<nav id=\"TableOfContents\">\n"
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
  "wikilink 解析表：路径（posts/javascript）与**不重名**的 basename（javascript）→ URL。
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

;; ── 反链（「引用这篇的」）───────────────────────────────────────────────────
;; 构建时全站扫一遍（O(n)），不是每页扫全站 —— 网上常见的 Hugo backlink partial 是
;; 每渲染一页扫一次全站（O(n²)）。只收站内引用，两类写法都认：
;;   wikilink  [[名字]] / [[名字|显示]] / [[名字#小节]]
;;   org 链接  [[/posts/foo/][显示]]
;; 字面量块（#+BEGIN_SRC / EXAMPLE / VERSE / EXPORT）里的不算引用，跳过。
;; 索引在 `org2site-build' 开头建好（与 org2site-url-map 同时机），两个全局量承接。

(defvar org2site--backlink-idx nil
  "URL → ((来源URL 上下文上下文) ...)。由 `org2site-build' 填充。")
(defvar org2site--backlink-pages nil
  "URL → (标题 日期)。由 `org2site-build' 填充。")

(defun org2site--internal-targets (line)
  "从一行里取出所有引用的原始目标（未解析的写法，原样返回）。"
  (let (out)
    (dolist (re (list "\\[\\[\\([^][]*\\)\\]\\[[^]]*\\]\\]"    ; [[target][desc]]
                      "\\[\\[\\([^][]*\\)\\]\\]"))            ; [[target]]
      (let ((start 0))
        (while (string-match re line start)
          (push (match-string 1 line) out)
          (setq start (match-end 0)))))
    (nreverse out)))

(defun org2site--resolve-target (target rel urls)
  "引用目标 → 站内页面 URL；不是站内引用就返回 nil。
用导出层同一个解析器 `org2site--wikilink-url'（REL 是引用方文件相对 org 根），
保证反链与页面里**真实渲染出来的链接**完全一致 —— 各写一套规则的话，反链会指向
页面根本没链过去的东西，或者漏掉真链。最后再用 URLS 过滤，只留真实存在的页面
（`org2site--wikilink-url' 对站内绝对路径不查表，会原样返回 /resume.pdf 这种）。"
  (let ((tgt (string-trim target)))
    (cond
     ((string= tgt "") nil)
     ;; 带协议头的一律不是站内（http: https: mailto: file: …）
     ((string-match-p "\\`[[:alpha:]][[:alnum:]+.-]*:" tgt) nil)
     ((string-prefix-p "#" tgt) nil)
     (t (let ((url (org2site--wikilink-url tgt rel)))
          (when url
            (let ((u (car (split-string url "#"))))
              (when (gethash u urls) u))))))))

(defun org2site--backlink-context (line)
  "引用所在行的可读上下文：剥掉链接与行内标记，压掉空白，截 140 字。"
  (let ((s line))
    (setq s (replace-regexp-in-string "\\[\\[\\([^][]*\\)\\]\\[[^]]*\\]\\]" "\\1" s))
    (setq s (replace-regexp-in-string "\\[\\[\\([^][]*?\\)|\\([^][]*\\)\\]\\]" "\\2" s))
    (setq s (replace-regexp-in-string "\\[\\[\\([^][]*\\)\\]\\]" "\\1" s))
    (setq s (replace-regexp-in-string "=\\([^=\n]+\\)=" "\\1" s))
    (setq s (replace-regexp-in-string "\\*+" "" s))
    (setq s (replace-regexp-in-string "[[:space:]]+" " " s))
    (setq s (string-trim s))
    (if (> (length s) 140) (concat (substring s 0 139) "…") s)))

(defun org2site--backlink-index (pages org-root)
  "返回 (反链表 . 页面表)：反链表是 URL → ((来源URL 上下文) ...)，页面表是 URL → (标题 日期)。"
  (let ((idx (make-hash-table :test 'equal))
        (urls (make-hash-table :test 'equal))
        (pages-h (make-hash-table :test 'equal)))
    (dolist (p pages)
      (puthash (nth 0 p) t urls)
      (puthash (nth 0 p) (list (nth 1 p) (nth 2 p)) pages-h))
    (dolist (p pages)
      (let ((src (nth 0 p))
            (rel (nth 4 p))
            (file (expand-file-name (nth 4 p) org-root)))
        (when (file-readable-p file)
          (with-temp-buffer
            (insert-file-contents file)
            (goto-char (point-min))
            (let ((in-literal nil))
              (while (not (eobp))
                (let ((line (buffer-substring-no-properties
                             (line-beginning-position) (line-end-position))))
                  (cond
                   ((string-match-p
                     "\\`[[:space:]]*#\\+[Bb][Ee][Gg][Ii][Nn]_\\(SRC\\|EXAMPLE\\|VERSE\\|EXPORT\\)" line)
                    (setq in-literal t))
                   ((string-match-p "\\`[[:space:]]*#\\+[Ee][Nn][Dd]_" line)
                    (setq in-literal nil))
                   (in-literal nil)
                   (t
                    (let ((ctx (org2site--backlink-context line)))
                      (dolist (target (org2site--internal-targets line))
                        (let ((url (org2site--resolve-target target rel urls)))
                          (when (and url (not (string= url src)))
                            (puthash url (cons (list src ctx) (gethash url idx)) idx))))))))
                (forward-line 1)))))))
    (cons idx pages-h)))

(defun org2site--backlink-li (entry pages-h)
  "ENTRY 是 (来源URL 上下文)。"
  (let* ((src (car entry))
         (info (gethash src pages-h))
         (title (or (car info) src))
         (ctx (cadr entry)))
    (concat (format "<li><a href=\"%s\">%s</a>" src (org2site-xml-escape title))
            (if (string= ctx "") ""
              (format "<div class=\"backlink-ctx\">%s</div>" (org2site-xml-escape ctx)))
            "</li>")))

(defun org2site-backlinks-html (url idx pages-h)
  "URL 是本页；IDX 是全站反链表（URL → ((来源 上下文)...)）；PAGES-H 是 URL → (标题 日期)。
每条按来源日期倒序，超过 6 条折叠。"
  (let ((raw (gethash url idx))
        (seen (make-hash-table :test 'equal))
        out)
    (dolist (e raw)
      (unless (gethash (car e) seen)
        (puthash (car e) t seen)
        (push e out)))
    (when out
      (setq out (sort out (lambda (a b)
                            (string> (or (cadr (gethash (car a) pages-h)) "")
                                     (or (cadr (gethash (car b) pages-h)) "")))))
      (let* ((n (length out))
             (head (seq-take out 6))
             (rest (seq-drop out 6)))
        (concat
         "<section class=\"backlinks\" data-pagefind-ignore>\n<h2>引用这篇的</h2>\n<ul>\n"
         (mapconcat (lambda (e) (org2site--backlink-li e pages-h)) head "\n")
         "\n</ul>\n"
         (if (null rest) ""
           (concat (format "<details><summary>还有 %d 篇…</summary>\n<ul>\n" (length rest))
                   (mapconcat (lambda (e) (org2site--backlink-li e pages-h)) rest "\n")
                   "\n</ul>\n</details>\n"))
         "</section>\n")))))

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
  "评论区外壳 —— Artalk 已下线（2026-10-29 起 comments.tianheg.co 不再对外），只留邮件回复。"
  (concat "<section id=\"comments\" class=\"post-comments\">\n"
          "<h2 class=\"post-comments-head\">"
          "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" \
stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">\
<path d=\"M7.9 20A9 9 0 104 16.1L2 22z\"/></svg>"
          "<span>Comments</span></h2>\n"
          (org2site--mailto-reply-html (nth 1 p))
          "</section>\n"))

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
    ;; 反链索引：同样必须在导出任何一页之前建好（全站扫一遍，O(n)）
    (let ((bk (org2site--backlink-index pages org-root)))
      (setq org2site--backlink-idx (car bk)
            org2site--backlink-pages (cdr bk)))
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
      ;; 资源版本号取 **内容的 sha256 前 12 位**，不要取 mtime：
      ;; CI 每次 checkout 都把 mtime 设成当前时间 → 版本每次都变 → 所有 HTML 的 `?v=` 都变
      ;; → PageFind 的输入跟着变（分片名全换）→ 每次部署 2000+ 文件被当成新资产重传、
      ;; 浏览器缓存全失效（CF 构建日志里的 `Found 2111 new or modified static assets`）。
      ;; 内容没改就该是同一个版本 —— 这也是「输入没变 → 产物逐字节相同」的前提之一。
      (let ((css (expand-file-name "style.css" static)))
        (when (file-exists-p css)
          (setq org2site-asset-version
                (substring
                 (secure-hash 'sha256
                              (with-temp-buffer
                                (insert-file-contents css)
                                (buffer-string)))
                 0 12))))
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
                   ;; 反链：引用这篇的 —— **只加在 posts 内容页**。
                   ;; 根页面（about / search / watch / links …）是站点功能性页面，底部挂一串
                   ;; 「引用这篇的」是噪声（用户 2026-10-19 定）。
                   ;; 注意：**索引里照旧收录根页面作为来源** —— 它们引用别的内容时，
                   ;; 那条引用要出现在被引页的反链里，只是它们自己页面上不显示这一区。
                   (body (concat body (if (string= (nth 3 p) "posts")
                                          (org2site-backlinks-html
                                           url org2site--backlink-idx
                                           org2site--backlink-pages)
                                        "")))
                   ;; 每篇正文末尾指向自己的 .org 源文（文件同批写进产物，见下）。
                   ;; **只挂 posts 内容页** —— 判定见
                   ;; org2site-source-link-page-p：根页面与年份归档页都不挂（用户 2026-10-24 定）。
                   (body (concat body (if (org2site-source-link-page-p p)
                                          (org2site-source-link-html url)
                                        "")))
                   ;; 文章页补日期条 + 尾部标签/评论
                   (body (org2site-post-augment p body)))
              (org2site-write out-root url
                              (org2site-page title body))
              ;; 纯文本源文：/posts/foo/ → /posts/foo.org（Content-Type 见 static/_headers）。
              ;; **只给挂链接的页面写**（posts）—— 根页面不挂源文也就没镜像可写，
              ;; 否则产物里躺着一堆没人引用的孤儿 .org（用户 2026-10-24 定）。
              (when (org2site-source-link-page-p p)
                (org2site-write-source out-root url file))
              ;; RSS 只收 posts
              (when (string= (nth 3 p) "posts")
                (push (list url title (nth 2 p) (org2site-summary body)) rss-items))
              (setq ok (1+ ok)))
          (error (setq fail (1+ fail))
                 (push (cons rel (error-message-string err)) errs)))
        (let ((b (get-file-buffer (expand-file-name rel org-root))))
          (when b (kill-buffer b)))))
    ;; 2) /posts/ 列表页（年份归档 + 热力图）
    (let* ((repo (org2site--repo-root org-root))
           (items (seq-filter (lambda (p) (string= (nth 3 p) "posts")) pages))
           (label (or (cdr (assoc "posts" org2site-section-labels))
                      (org2site--index-title repo "posts") "Posts")))
      (when items
        (org2site-write out-root "/posts/"
                        (org2site-page label (org2site-archive-html label items)))))
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

    ;; 0 处时静默：这行以前每次构建都打、永远是 0 处，纯噪音（2026-10-19 用户要求）
    (let ((un (nreverse org2site-unresolved-wikilinks)))
      (when un
        (princ (format "wikilink 未解析（已退成纯文本）：%d 处；样例 %s\n"
                       (length un)
                       (mapconcat #'identity (seq-take un 5) " | ")))))
  (when org2site--no-date-files
    (princ (format "WARN %d file(s) under posts/ have no usable #+DATE: -> SKIPPED (not built)\n"
                   (length org2site--no-date-files)))
    (dolist (ndf (nreverse org2site--no-date-files))
      (princ (format "      %s   (DATE=%S)\n" (car ndf) (cdr ndf)))))
    (princ (format "文章 %d 篇 OK / %d FAIL（共 %d）；index.xml / sitemap.xml / 404.html\n"
                   ok fail (length pages)))
    (dolist (e (seq-take (nreverse errs) 30))
      (princ (format "  FAIL %s :: %s\n" (car e) (cdr e))))
    (if (> fail 0) 1 0)))

(when (and noninteractive (>= (length command-line-args-left) 2))
  (kill-emacs (org2site-build (nth 0 command-line-args-left) (nth 1 command-line-args-left))))
