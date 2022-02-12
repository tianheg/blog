+++
title = "使用 Org-mode 为文本添加高亮"
date = 2021-12-10T00:00:00+08:00
lastmod = 2022-02-12T21:43:44+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

<https://github.com/fniessen/org-macros/blob/master/README.org#color>

```org
#+MACRO: highlight @@html:<span style="background-color: $1;">$2</span>@@
#+MACRO: hl {{{highlight(#FFFF00,$1)}}}
{{{hl(变量为什么需要初始化)}}}
```

<span style="background-color: #FFFF00;">变量为什么需要初始化</span>