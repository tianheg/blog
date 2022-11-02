+++
title = "使用 Org Mode 写博客"
author = ["Tianhe Gao"]
date = 2021-12-08T00:00:00+08:00
lastmod = 2022-09-19T14:50:35+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

1.  <https://github.com/dirtysalt/dirtysalt.github.io>
2.  <https://www.zhangjiee.com/blog/2019/build-site-with-org-mode.html>
3.  <https://waychan.cn/blog/2019/blogging-with-orgmode>
4.  [使用 Org-Mode 生成博客](https://www.shellcodes.org/Emacs/%E4%BD%BF%E7%94%A8Org-Mode%E7%94%9F%E6%88%90%E5%8D%9A%E5%AE%A2.html)

11 月 20 日，开始用 Org-mode 构建博客。

2022-02-09 重新使用 Hugo。


## 如何构建 {#如何构建}

我的主要参考资料已经放在文章开头。

源文件路径： `~/org/` ，生成路径： `~/repo/blog/` 。

源文件目录结构：

```text
.
├── blog
│  ├── 2018
│  ├── 2019
│  ├── 2020
│  ├── 2021
│  ├── index.org
│  └── rss.xml
├── gtd
│  ├── 2021-Q4.org
│  └── index.org
├── index.org
├── new-blog.sh
├── other
│  ├── blogroll.org
│  ├── feed.org
│  ├── health.org
│  ├── link.org
│  ├── listen.org
│  ├── memo.org
│  ├── read.org
│  ├── resume.org
│  ├── stories.org
│  ├── think.org
│  ├── watch.org
│  └── wiki.org
└── topic
   ├── coding.org
   ├── learn.org
   └── leetcode.org
```

生成路径目录结构：

```text
.
├── blog
├── CHANGELOG.md
├── gtd
├── images
├── index.html
├── Makefile
├── other
├── README.org
├── rss.xml
├── scripts
│  ├── gen-sitemap
│  ├── publish
│  ├── publish.el
│  └── run-http-server
├── sitemap.txt
├── sitemap.xml
├── theme
│  ├── link.js
│  ├── normalize.css
│  ├── org.css
│  ├── scss
│  ├── site.css
│  └── site.css.map
├── topic
├── tpl
│  ├── nil-site-tpl.org
│  └── site-tpl.org
└── videos
```

生成路径的仓库在 [GitHub:tianheg/blog](https://github.com/tianheg/blog) 。blog 目录下的 script 文件夹里放置了生成 html 的脚本文件，tpl 文件夹下的文件内容被导入每一个博客文件：

```org

或者

```

主要配置文件 `publish.el` ：

```elisp
;; load env
(load "~/.emacs.d/init.el")

;; https://orgmode.org/worg/org-tutorials/org-publish-html-tutorial.html
(require 'ox-publish)

;; https://bastibe.de/2014-05-07-speeding-up-org-publishing.html
(remove-hook 'find-file-hooks 'vc-find-file-hook 'vc-refresh-state)

(setq org-publish-project-alist
      '(("pages"
         :base-directory "~/org/"
         :publishing-directory "~/repo/blog/"
         :exclude "gtd*"
         :recursive t
         :html-head-include-default-style nil
         :html-head ""
         :publishing-function org-html-publish-to-html
         :html-postamble nil
         :with-toc 't)
        ("site" :components ("pages"))))

;; (progn (profiler-start 'cpu) (org-publish-project "site") (profiler-report) (profiler-stop))
(org-publish-project "site")
```

生成 html：

```sh
emacs --batch --script ./scripts/publish.el
```