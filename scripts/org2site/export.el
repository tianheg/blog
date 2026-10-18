;;; export.el --- org -> HTML 导出层 -*- lexical-binding: t; -*-
;;
;; 顺序与位置都不能改：
;;   1. org-emphasis-regexp-components 必须在 (require 'org) 之前设置，否则不生效
;;   2. 边界字符集禁止用 [:nonascii:]，实测会破坏解析（所有强调失效）
;;   3. 必须显式列全角标点 + CJK 范围
(setq org-emphasis-regexp-components
      '("-[:space:]('\"{，。、！？；：（）【】《》「」『』“”‘’…—\u4e00-\u9fff"
        "-[:space:].,:!?;'\")}\\[，。、！？；：（）【】《》「」『』“”‘’…—\u4e00-\u9fff"
        "[:space:]" "." 1))

(require 'ox-html)

;; 代码块不做 token 级高亮：htmlize 会把非 ASCII 转成字面八进制（\346\211\213）导致乱码，
;; 且它本身是外部包。代码块只保留 data-lang，配色交给 CSS 的 pre 规则。
(setq org-html-htmlize-output-type nil)

(setq org-html-doctype "html5"
      org-html-html5-fancy t
      org-export-with-section-numbers nil
      org-html-head-include-scripts nil
      org-html-head-include-default-style nil
      org-html-self-link-headlines nil
      org-html-validation-link nil
      ;; 链接解析失败时不中止整篇：当作普通文本输出（兜底）
      org-export-with-broken-links t
      ;; 脚注段标题由 declass filter 摘掉。不要自定义 org-html-footnotes-section：
      ;; 它的占位符语义与默认模板绑定，自改会丢掉脚注内容（实测踩过）。
      org-export-with-toc nil
      org-html-text-markup-alist '((bold . "<strong>%s</strong>")
                                   (italic . "<em>%s</em>")
                                   (verbatim . "<code>%s</code>")
                                   (code . "<code>%s</code>")
                                   (strike-through . "<del>%s</del>")
                                   (underline . "<span>%s</span>")))

;; ---------------------------------------------------------------- transcoder

(defun org2site-plain-text (text _info)
  "白名单内联标签放行，其余照常转义。"
  (let ((keep '()))
    (setq text (replace-regexp-in-string
                "<\\(\\/?\\(?:sub\\|sup\\|kbd\\|mark\\|br\\|abbr\\|span\\|small\\|u\\)\\)\\([^>]*\\)>"
                (lambda (m) (push m keep) (format "\x01%d\x02" (1- (length keep)))) text t))
    (setq text (replace-regexp-in-string "&" "&amp;" text t t))
    (setq text (replace-regexp-in-string "<" "&lt;" text t t))
    (setq text (replace-regexp-in-string ">" "&gt;" text t t))
    (let ((i -1))
      (dolist (tag (reverse keep))
        (setq i (1+ i))
        (setq text (replace-regexp-in-string (format "\x01%d\x02" i) tag text t t))))
    text))

(defun org2site-declass (text _backend _info)
  "输出零 class：代码块语言搬到 data-lang 属性，其余 class 属性一律删除。"
  ;; 脚注段的 "Footnotes: " 标题（org-html-footnotes-section 在此版本下不生效，直接摘掉）
  (setq text (replace-regexp-in-string "<h2[^>]*>Footnotes:?[ \t]*</h2>" "" text))
  (setq text (replace-regexp-in-string
              "<pre class=\"src src-\\([^\" ]+\\)\">" "<pre data-lang=\"\\1\">" text))
  ;; 只删 ox-html 自己生成的 class（白名单式）。
  ;; 不能无差别删所有 class="..."：代码块里的 HTML 示例（<div class="btn">）
  ;; 会被一并删掉，那是内容被改坏（实测踩过）。
  (replace-regexp-in-string
   " class=\"\\(?:org-[^\"]*\\|src src-[^\"]*\\|foot[^\"]*\\|figure\\|outline-[^\"]*\\|section-number-[^\"]*\\|timestamp-[^\"]*\\)\""
   "" text))

(defun org2site-decode-escapes (text _backend _info)
  "还原 org 导出的转义残留：十进制实体 &#20013;、双重转义 &amp;gt;，
以及时间戳文本留下的 \&lt; / \&gt;。

历史遗留：这里曾有「八进制字节序列 → UTF-8」的还原（htmlize 时代需要，
把 \346\211\213 这类还原成汉字）。htmlize 已弃用，那条规则反而会误伤
正文里的八进制写法 —— JS 转义示例 \251 会被解成非法 UTF-8 字节（0xa9），
整页输出就不是合法 UTF-8 了，所以删掉。"
  (setq text (replace-regexp-in-string "&#\\([0-9]+\\);"
              (lambda (m) (char-to-string (string-to-number (match-string 1 m))))
              text))
  (setq text (replace-regexp-in-string "&amp;\\(gt\|lt\|amp\\);" "&\1;" text))
  ;; 只处理「反斜杠 + 实体」形式。
  ;; 曾经也处理「反斜杠 + <」，结果把 verbatim 末尾的 \\ 和 </code> 的 < 连起来
  ;; 误转成 &lt;，把标签弄坏了 —— 所以只留实体形式。
  (setq text (replace-regexp-in-string "\\\\&lt;" "&lt;" text))
  (setq text (replace-regexp-in-string "\\\\&gt;" "&gt;" text))
  (replace-regexp-in-string "\\\\&amp;" "&amp;" text))

(defun org2site-timestamp (timestamp _contents _info)
  "时间戳按纯文本输出：默认会包成 <span class=\"timestamp-wrapper\">，
而正文里的 <2022-11-13 Sat> 只是普通文字，不是时间戳语义。"
  (let ((raw (or (org-element-property :raw-value timestamp) "")))
    (if (stringp raw)
        (org-html-encode-plain-text raw)
      (format "%s" (org-element-property :year-start timestamp)))))

(defvar org2site-site-title "Tianhe Gao")
(defvar org2site-menu
  '(("Home" . "/") ("About" . "/about/") ("Posts" . "/posts/")
    ("Photos" . "/photos/") ("TIL" . "/til/") ("Projects" . "/projects/"))
  "站点导航，与原 Hugo 站的 menu.main 一致。")

(defun org2site-nav-links ()
  "导航链接串（顺序与原 Hugo 站 menu.main 一致）。桌面 nav 与移动菜单共用。"
  (mapconcat (lambda (it) (format "<a href=\"%s\">%s</a>" (cdr it) (car it)))
             org2site-menu ""))

(defun org2site-header-html ()
  "站点 header：站点名 + 工具区（主题/搜索/汉堡）+ 桌面导航 + 移动菜单。

工具区对齐原站：主题按钮是 moon/sun 两个 SVG（显隐交给 CSS 的 :root.dark），
搜索入口指向 /search/ 页（无 JS 可用；命令面板是独立功能）；汉堡按钮在
40rem 以下出现，菜单展开由 /js/site.js 切换 [hidden]。"
  (concat
   "<header data-site-header>\n"
   "<div data-header-bar>\n"
   (format "<a href=\"/\">%s</a>\n" org2site-site-title)
   "<div data-header-tools>\n"
   "<button data-theme-toggle type=\"button\" aria-label=\"切换到暗色\" aria-pressed=\"false\" title=\"切换主题\">"
   "<svg data-icon=\"moon\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z\"/></svg>"
   "<svg data-icon=\"sun\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\"/></svg>"
   "</button>\n"
   "<a href=\"/search/\" data-icon-link aria-label=\"搜索\" title=\"搜索\">"
   "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/></svg>"
   "</a>\n"
   "<button data-menu-toggle type=\"button\" aria-label=\"菜单\" aria-expanded=\"false\" aria-controls=\"mobile-menu\" title=\"菜单\">"
   "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 6h18M3 12h18M3 18h18\"/></svg>"
   "</button>\n"
   "<nav data-site-nav>" (org2site-nav-links) "</nav>\n"
   "</div>\n"
   "</div>\n"
   "<div id=\"mobile-menu\" hidden><nav>" (org2site-nav-links) "</nav></div>\n"
   "</header>\n"))

(defvar org2site-theme-init-js
  "(function(){try{var t=localStorage.getItem(\"theme\");if(t===\"dark\"||t===\"light\"){document.documentElement.classList.add(t)}}catch(e){}})()"
  "首绘前定主题：写在 <head> 内联执行，避免闪一下白/黑。")

(defvar org2site-asset-version (format-time-string "%Y%m%d%H%M")
  "静态资源版本号：写进 CSS 的查询串，避免浏览器启发式缓存导致改样式看不到效果。")

(defvar org2site-show-footer nil
  "是否输出站点 footer。原站**只有首页**有 footer（posts / about / til 都没有），
所以默认 nil，只有写首页时由 build.el 绑成 t。")

(defun org2site--main-html (body &optional shell side right)
  "main 区。SHELL 非 nil 时包进 TIL 三栏 shell（1fr / 790px / 1fr）：
内容列固定 790 居中，侧栏悬挂在外侧 1fr 轨道里 —— 这样 /til/ 下所有页面
（列表页、分类页、笔记页）的正文左边缘完全一致，不随侧栏出现/消失而位移。
SIDE 是左栏 HTML（已含 <nav data-til-tree>）；笔记页只要 shell 不要左栏。
RIGHT 是右栏 HTML（原站只用在 ≥1400px 的分类页「本页分组」）。"
  (if shell
      (concat "<div data-til-shell>\n"
              (if side (format "<aside data-til-side>\n%s\n</aside>\n" side) "")
              "<main id=\"main-content\">\n"
              "<article data-pagefind-body>\n"
              body "\n</article>\n</main>\n"
              (if right (format "<aside data-til-right>\n<div>\n%s</div>\n</aside>\n" right) "")
              "</div>\n")
    (concat "<main id=\"main-content\">\n<article data-pagefind-body>\n"
            body "\n</article>\n</main>\n")))

(defun org2site-page (title body &optional shell side right)
  "完整页面：head（charset/主题预置）+ header + main + footer。
SHELL/SIDE/RIGHT 见 `org2site--main-html'。"
  (format "<!DOCTYPE html>
<html lang=\"zh-CN\">
<head>
<meta charset=\"utf-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">
<meta name=\"color-scheme\" content=\"light dark\">
<meta name=\"format-detection\" content=\"telephone=no, date=no, address=no, email=no\">
<meta name=\"theme-color\" content=\"#f7f5f3\" media=\"(prefers-color-scheme: light)\">
<meta name=\"theme-color\" content=\"#121c22\" media=\"(prefers-color-scheme: dark)\">
<title>%s</title>
<script>%s</script>
<link rel=\"stylesheet\" href=\"/style.css?v=%s\">
</head>
<body>
<a data-skip-link href=\"#main-content\">Skip to content</a>
%s%s%s<script src=\"/js/site.js?v=%s\" defer></script>
</body>
</html>
" (if (string= title org2site-site-title) title (format "%s | %s" title org2site-site-title))
  org2site-theme-init-js org2site-asset-version (org2site-header-html)
  (org2site--main-html body shell side right)
  (if org2site-show-footer
      "<footer data-site-footer>\n<p>© 2018–2026 tianhe · <a href=\"/index.xml\">RSS</a></p>\n</footer>\n"
    "")
  org2site-asset-version))

(defun org2site-template (contents info)
  "文章页骨架：h1 = 文档标题，之后接正文。
原站每页都有 <h1>（来自页面标题），早期只在 <title> 里用了标题，页面上没有 —— 补上。"
  (let ((title (or (org-export-data (plist-get info :title) info) "")))
    (org2site-page title
                   (concat (format "<h1>%s</h1>\n" title) contents))))

;; 不让裸下划线/插入符变成上下标：正文里的 rfcomm_bind 会被导出成
;; rfcomm<sub>bind</sub>（原站是字面文本）。'{} 形态只认显式写的 _{x} / ^{x}。
(setq org-export-with-sub-superscripts '{})

;; 深层标题必须导出成 <h4>/<h5>：headline-levels 默认 3，第 4 层起会被转成列表，
;; 结果 TIL 页里 4/5 级标题整段消失（TOC 和锚点也跟着少 9 个）。
(setq org-export-headline-levels 6)

(org-export-define-derived-backend 'org2site 'html
  :translate-alist '((plain-text . org2site-plain-text)
                     (template . org2site-template)
                     (timestamp . org2site-timestamp)))

;; ---------------------------------------------------------------- 导出管线

(org-link-set-parameters "wiki"
  :export (lambda (path desc _backend)
            (format "<a href=\"%s\">%s</a>" path (or desc path))))

;; 未注册的自定义 link scheme（如内容里写的 [[skill:xxx]]）：导出成纯文本，
;; 而不是让 org 抛 "Unable to resolve link" 中止整篇。
(org-link-set-parameters "skill"
  :export (lambda (path desc _backend) (or desc path)))

(defun org2site--count-char (s ch)
  (let ((n 0))
    (dolist (c (string-to-list s)) (when (= c ch) (setq n (1+ n))))
    n))

(defvar org2site-url-map nil
  "wikilink 解析表：路径（til/software/coding）与不重名的 basename → 站点 URL。
由 build.el 扫描后填充（见 `org2site--build-url-map'）；单文件导出时为 nil，
此时只有带 scheme 或站内绝对路径的链接能解析。")

(defvar org2site-unresolved-wikilinks nil
  "本次构建里没解析成链接的 wikilink（收集起来给构建末尾报一行用）。")

(defun org2site--wikilink-url (target rel)
  "把 wikilink 的 TARGET 解析成站点 URL；解析不了返回 nil。
TARGET 可为：纯 slug（coding）、多段路径（til/software/coding、../hardware/x.md）、
站内绝对路径（/about/）；可带 #锚点 与 .md/.org 扩展名。REL 是当前文件相对 org 根。
用 map 查不到就返回 nil —— **宁可退成纯文本，也不要生成假链接**（正文里的 [[Prototype]]
这种本来就不是链接，原来一律改写成 /posts/Prototype/ 造出一堆死链）。"
  (let ((frag "") (tgt target))
    (when (string-match "\\`\\(.*?\\)\\(#[^#]*\\)\\'" tgt)
      (setq frag (match-string 2 tgt) tgt (match-string 1 tgt)))
    (setq tgt (replace-regexp-in-string "\\.\\(?:md\\|org\\)\\'" "" tgt))
    ;; 尾部斜杠要去掉：`/about/#frag' 这种 target 会先切成 "/about/" —— map 的键是 "about"
    (setq tgt (replace-regexp-in-string "/+\\'" "" tgt))
    (when (and org2site-url-map (not (string-empty-p tgt)))
      (let* ((abs (string-prefix-p "/" tgt))
             (bare (if abs (substring tgt 1) tgt))
             (dir (and rel (file-name-directory rel)))
             (cands (delq nil
                          (list (and abs (gethash bare org2site-url-map))
                                (gethash bare org2site-url-map)
                                (and (not abs)
                                     (gethash (org2site--join-path dir tgt) org2site-url-map))
                                ;; 相对路径算出来的位置不存在时（源里 ../ 写歪了），
                                ;; 退一步用文件名查 —— 不重名才命中，指错的风险由 map 挡住
                                (and (not abs)
                                     (gethash (file-name-nondirectory tgt) org2site-url-map)))))
             (url (car cands)))
        (when url (concat url frag))))))

(defun org2site--join-path (dir rel)
  "把相对路径 REL 按 DIR 归一化（处理 ./ 与 ../），返回不带前导斜杠的路径。"
  (let (out)
    (dolist (p (append (split-string (or dir "") "/" t) (split-string rel "/" t)))
      (cond ((or (string= p ".") (string= p "")) nil)
            ((string= p "..") (when out (setq out (butlast out))))
            (t (push p out))))
    (mapconcat #'identity (nreverse out) "/")))

(defun org2site-in-inline-code-p (pos)
  "POS 是否落在同一行的 =verbatim= 或 ~code~ 内部。
判断依据：从行首到 POS 的标记字符数为奇数 → 在标记中间。
不跳过的话，行内代码里的 [[This]] 会被当 wiki 链接改写（实测踩过）。"
  (save-excursion
    (goto-char pos)
    (let ((prefix (buffer-substring-no-properties (line-beginning-position) pos)))
      (or (= 1 (mod (org2site--count-char prefix ?=) 2))
          (= 1 (mod (org2site--count-char prefix ?~) 2))))))

(defun org2site-rewrite-wikilinks (&optional rel)
  "把站内 wikilink 改写成 [[URL][desc]]（URL 由 `org2site--wikilink-url' 解析）。
两种形态都要处理：带描述符的 [[slug][desc]]，以及不带描述符的 [[slug]]
（后者原来漏了，会让 org 当 fuzzy link 解析失败并中止整篇导出）。

解析不了的就**原样留着**（org 会当普通文本/模糊链接处理），绝不硬套 /posts/ 前缀：
正文里本来就有 [[Prototype]] 这类写法，被当成链接会造出一片死链。REL 是当前
文件相对 org 根的路径，用于解析相对路径形式的目标。

**判完之后绝不能用 replace-match**：`string-match' 与 `org2site-in-src-block-p'
内部的 re-search-backward 成功时都会**冲掉 match data**，replace-match 于是去替换
「上一次匹配」的位置 —— 实测把同文件 src 块的 #+END_SRC 行替换成了链接文本
（代码块崩掉、`#+END_SRC` 变成可见文字，全站 100+ 页中招）。所以先取出位置与
内容，再做显式区域替换。"
  (dolist (spec '(("\\[\\[\\([^]|]+\\)\\]\\[\\([^]]*\\)\\]\\]" . t)
                  ("\\[\\[\\([^]|]+\\)\\]\\]" . nil)))
    (goto-char (point-min))
    (while (re-search-forward (car spec) nil t)
      (let* ((beg (match-beginning 0))
             (end (match-end 0))
             (target (match-string 1))
             (desc (if (cdr spec) (match-string 2) target)))
        (unless (save-match-data
                  (or (string-match "\\`[a-zA-Z][a-zA-Z0-9+.-]*:" target)
                      (org2site-in-inline-code-p beg)
                      (org2site-in-src-block-p beg)))
          (let ((url (org2site--wikilink-url target rel)))
            (goto-char beg)
            (delete-region beg end)
            (if url
                ;; 走注册过的 wiki: scheme（`org-link-set-parameters "wiki"' 的 :export 会
                ;; 输出干净 href）；直接写 `[[/til/x/][desc]]' 会被 org 当 file: 链接加前缀。
                (insert (format "[[wiki:%s][%s]]" url desc))
              ;; 解析不了 → 退成纯文本。不能留着 [[...]]：org 会当模糊链接，
              ;; 严重时直接报 Unable to resolve link 中止整篇导出。
              (insert desc)
              (setq org2site-unresolved-wikilinks
                    (cons (format "%s → %s" rel target) org2site-unresolved-wikilinks)))))))))

(defun org2site-in-src-block-p (&optional pos)
  "POS（默认 point）是否落在 #+BEGIN_SRC 块内（代码块里的 */= 不该被当标记处理）。"
  (save-excursion
    (when pos (goto-char pos))
    (let ((case-fold-search t))
      (and (re-search-backward "^[ \t]*#\\+begin_src\\|^[ \t]*#\\+end_src" nil t)
           (looking-at-p "^[ \t]*#\\+begin_src")))))

(defun org2site-zwsp-wrap ()
  "CJK 边界标记两侧插 ZWSP：强调（*/_+）与 verbatim（=~）。
org-element 把这些边界硬编码成 ASCII，配置变量管不着；导出后统一过滤掉。"
  (dolist (re (list org-emph-re org-verbatim-re))
    (goto-char (point-min))
    (while (re-search-forward re nil t)
      (let ((beg (match-beginning 2)) (end (match-end 2)))
        (when (and beg end (not (org2site-in-src-block-p (match-beginning 0))))
          (goto-char end)
          (unless (or (eobp) (memq (char-after) '(?\s ?\t ?\n))) (insert "\u200b"))
          (goto-char beg)
          (unless (or (bobp) (memq (char-before) '(?\s ?\t ?\n))) (insert "\u200b"))
          (goto-char end))))))

(defun org2site-strip-zwsp (text _backend _info)
  (replace-regexp-in-string "\u200b" "" text))

;; 顺序有依赖：先摘 class → 再还原转义 → 最后清 ZWSP
;; （add-to-list 默认前插，会把顺序倒过来，所以直接 setq）
(setq org-export-filter-final-output-functions
      (list #'org2site-declass #'org2site-decode-escapes #'org2site-strip-zwsp))

(defun org2site--title-of (infile)
  "读 #+TITLE 并做 HTML 转义，供 body-only 导出补 <h1> 用。
body-only 导出不经过模板（org2site-template 不会跑），标题得在这里自己加。"
  (when-let ((title (with-current-buffer (find-file-noselect infile)
                      (save-excursion
                        (goto-char (point-min))
                        (when (re-search-forward "^#\\+TITLE:\\s-*\\(.*\\)$" nil t)
                          (string-trim (match-string 1)))))))
    (unless (string-empty-p title)
      (if (fboundp 'org-html-encode-plain-text)
          (org-html-encode-plain-text title)
        title))))

(defun org2site--plain-for-slug (inner)
  "标题 HTML → 纯文本：去标签、还原常见实体、去掉 org 的转义反斜杠。
标题里可能有 org 转义残留（如 1\\-2），直接拿去做 slug 和目录文字都不对。"
  (let ((s inner))
    (setq s (replace-regexp-in-string "<[^>]+>" "" s))
    (dolist (pair '(("&amp;" . "&") ("&lt;" . "<") ("&gt;" . ">")
                    ("&quot;" . "\"") ("&#39;" . "'") ("&nbsp;" . " ")))
      (setq s (replace-regexp-in-string (regexp-quote (car pair)) (cdr pair) s t t)))
    ;; org 转义：反斜杠 + ASCII 标点 → 只留标点
    (replace-regexp-in-string
     "\\\\\\([^A-Za-z0-9]\\)" "\\1" s)))

(defun org2site-slug (text)
  "GitHub 风格锚点，对齐原站 Hugo/goldmark 的 autoHeadingID：
小写；去掉标点（保留 - 和 _）；空白转 -；中日韩字符原样保留；两端空白不产生连字符。
实测样本（原站）：\"Docs/Books\"→docsbooks、\"AI 调教\"→ai-调教、
\"现代机器学习基础设施2.0新架构\"→现代机器学习基础设施20新架构。"
  (let (out)
    (dolist (c (string-to-list (downcase (string-trim text))))
      (cond ((or (and (>= c ?a) (<= c ?z))
                 (and (>= c ?0) (<= c ?9))
                 (= c ?-) (= c ?_))
             (push (char-to-string c) out))
            ((memq c '(?\s ?\t ?\n)) (push "-" out))
            ((or (and (>= c #x4e00) (<= c #x9fff))    ; CJK
                 (and (>= c #x3040) (<= c #x30ff))    ; 假名
                 (and (>= c #xac00) (<= c #xd7a3)))   ; 谚文
             (push (char-to-string c) out))))
    (apply #'concat (nreverse out))))

(defun org2site-fix-heading-ids (html)
  "把 org 自动生成的头 id（org + 7 位十六进制）换成 GitHub 风格 slug，重名追加 -1/-2。

内容里用 :CUSTOM_ID: 显式写死的锚点原样保留 —— 那是对外契约，覆盖了旧链接就断。

写回必须用 replace-match 的 LITERAL 参数：标题文本里可能有反斜杠（org 转义残留），
而 replace-regexp-in-string 会把替换值当模板解释反斜杠，直接塞会报
Invalid use of \\ in replacement text 并中止整篇导出（踩过）。"
  (let ((seen (make-hash-table :test 'equal)))
    (with-temp-buffer
      (insert html)
      (goto-char (point-min))
      (while (re-search-forward "<\\(h[2-6]\\) id=\"\\([^\"]*\\)\">\\(.*?\\)</\\1>" nil t)
        (let* ((beg (match-beginning 0))
               (end (match-end 0))
               (tag (match-string 1))
               (cur (match-string 2))
               (inner (match-string 3)))
          (when (and (string-prefix-p "org" cur) (= (length cur) 10))
            (let* ((base (org2site-slug (org2site--plain-for-slug inner)))
                   (n (gethash base seen 0)))
              (puthash base (1+ n) seen)
              ;; 同样别用 replace-match：--plain-for-slug 里的 replace-regexp-in-string
              ;; 会动 match data（和 rewrite-wikilinks 一个坑）。显式区域替换最稳，
              ;; insert 也不会把替换值当模板解释反斜杠。
              (goto-char beg)
              (delete-region beg end)
              (insert (format "<%s id=\"%s\">%s</%s>" tag
                              (if (= n 0) base (format "%s-%d" base n)) inner tag))))))
      (buffer-string))))

(defun org2site-export-string (infile &optional rel)
  "导出单篇为**正文片段**字符串（骨架由调用方用 org2site-page 包）。
片段顶部补 `<h1>`：原站每页都有 h1（来自页面标题）。
REL 是文件相对 org 根的路径，供 wikilink 解析相对路径用（见 org2site-rewrite-wikilinks）。"
  (with-current-buffer (find-file-noselect infile)
    (org2site-rewrite-wikilinks rel)
    (org2site-zwsp-wrap)
    (let* ((out (org-export-as 'org2site nil nil t))
           (body (if (bufferp out) (with-current-buffer out (buffer-string)) out))
           (title (org2site--title-of infile)))
      (setq body (org2site-fix-heading-ids body))
      (if title (concat (format "<h1>%s</h1>\n" title) body) body))))

(defun org2site-export-file (infile outfile)
  "导出单篇 org 到 outfile（正文片段，外包 <article>）。"
  (with-current-buffer (find-file-noselect infile)
    (org2site-rewrite-wikilinks)
    (org2site-zwsp-wrap)
    (let ((out (org-export-as 'org2site nil nil nil))
          (coding-system-for-write 'utf-8-unix))
      (with-temp-file outfile (insert out)))))

(provide 'org2site-export)

;; batch 入口：emacs -Q --batch -l export.el <in.org> <out.html>
(when (and noninteractive (>= (length command-line-args-left) 2))
  (org2site-export-file (nth 0 command-line-args-left)
                        (nth 1 command-line-args-left)))
