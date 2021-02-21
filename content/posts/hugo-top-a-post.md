---
title: "Hugo 置顶博客"
date: 2021-02-21T16:01:05+08:00
description: "Hugo 如何置顶文章"
tags: ["Hugo"]
keywords: ["Hugo"]
---

简单得令我怀疑，只需要在 `Front-matter` 内添加如下片段即可：

```md
---
weight: 1
---
```

我已经按照这个方法置顶了《[书目](/posts/books)》，你可以在标签「[读书](/tags/读书)」看到效果。

如果我想在某个标签页面展示特定文章的话，也是可以通过 `weight` 的数字的依次递增，优先级依次递减的。

---

**参考资料**：

1. [Assign Weight - Taxonomy Templates](https://gohugo.io/templates/taxonomy-templates/#assign-weight)
