+++
title = "Emacs 下将 Org 导出为 pdf"
date = 2021-12-27T00:00:00+08:00
lastmod = 2022-02-12T21:42:53+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

使用系统：Arch Linux

起初想安装 texlive-core，texlive-latexextra 等包，通过 Tex 导出，后来通过这篇文章[^fn:1]找到更快速的办法——Pandoc。它是一个强大的文本格式转换软件，在 Emacs 中使用可以安装 pandoc-mode[^fn:2] 开启。通过快捷键 `M-x pandoc-convert-to-pdf` 即可导出。如果却少某些包，直接安装即可。

[^fn:1]: <https://linuxhint.com/documents_emacs_org_mode/>
[^fn:2]: <https://joostkremers.github.io/pandoc-mode/>