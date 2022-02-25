+++
title = "使用 ox-hugo 构建 Hugo blog 工作流"
date = 2022-02-25T00:00:00+08:00
lastmod = 2022-02-25T13:15:07+08:00
tags = ["技术", "Hugo", "Orgmode"]
draft = false
+++

## 必备条件 {#必备条件}

-   了解 Emacs[^fn:1] 的基本操作
-   熟悉 Hugo[^fn:2] 使用、Orgmode[^fn:3] 语法


## 正文 {#正文}

ox-hugo 是一个文档转换工具，它能根据配置，将 Org 文件转为 md 文件。

它有两种组织方式：一种是「一篇文章对应一个 Org 文件」，另一种是「一篇文章对应一个 Org 子树[^fn:4]」。官方文档推荐后一种，我觉得可能是因为后一种只需要一个 Org 文件，管理起来很方便。但是，对于我来说，我已经有超过 700 篇博客，都用一个文件管理并不现实。所以，我选择「一篇文章一个 Org 文件」的方式。

Emacs 安装包有两个官方仓库：MELPA 和 MELPA Stable，后者中的包是稳定版本（v0.8），前者是最新版。稳定版本的 ox-hugo 缺失了功能[^fn:5]，不能使用 `org-hugo-auto-export-mode` 。这个 mode 可以在保存 Org 文件时自动生成对应的 md 文件。设置办法[^fn:6]：

在博客根目录下，新建文件 `.dir-locals.el` ：

```elisp
(("content-org/"
  . ((org-mode . ((eval . (org-hugo-auto-export-mode)))))))
;; content-org 是 Org 文件的存放地
```

在每个 Org 文件的开头都需要进行一定设置：

```org
#+HUGO_BASE_DIR: ..
#+HUGO_AUTO_SET_LASTMOD: t
#+TITLE:
#+DATE:
#+HUGO_TAGS:
```

头 2 行是所有文件共有的可以放在一个文件 hugo_setup.org，然后所有文件都引用它。

现在每个 Org 文件的配置：

```org
#+SETUPFILE: ./hugo_setup.org
#+TITLE:
#+DATE:
#+HUGO_TAGS:
```

接下来就能够和往常一样写文章，并发布了。


### 一些使用技巧 {#一些使用技巧}

使用 yasnippet[^fn:7] 作为模板应用，使用关键字自动将配置输出。

---
参考资料

1.  <https://ox-hugo.scripter.co/>
2.  <https://www.xianmin.org/post/ox-hugo/>

[^fn:1]: <https://www.gnu.org/software/emacs/>
[^fn:2]: <https://gohugo.io/>
[^fn:3]: <https://orgmode.org/>
[^fn:4]: <https://ox-hugo.scripter.co/#screenshot-one-post-per-subtree>
[^fn:5]: <https://github.com/kaushalmodi/ox-hugo/issues/563#issuecomment-1038594914>
[^fn:6]: <https://ox-hugo.scripter.co/doc/auto-export-on-saving/>
[^fn:7]: <https://github.com/joaotavora/yasnippet>