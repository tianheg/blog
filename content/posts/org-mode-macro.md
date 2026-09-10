---
title: '使用 Org-mode 为文本添加高亮'
date: 2021-12-10
tags: [Org-mode, '技术']
---

<https://github.com/fniessen/org-macros/blob/master/README.org#color>

```org
    #+MACRO: highlight @@html:<span style="background-color: $1;">$2</span>@@
    #+MACRO: hl {{{highlight(#FFFF00,$1)}}}
    {{{hl(变量为什么需要初始化)}}}
```

变量为什么需要初始化
