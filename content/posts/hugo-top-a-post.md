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

**问题**：

在获取 RSS 订阅时，因为《书目》和另一篇文章的优先级同为 `weight: 1`，所以通过 RSS 获取的文章，最近更新的三篇文章总是包含这两篇文章。

可是，为什么在“归档”页面，这两篇文章没有排在前两位呢？因为“归档”页的排序规则是按照日期进行的，而不是 `weight`。

---

**参考资料**：

1. [Assign Weight - Taxonomy Templates](https://gohugo.io/templates/taxonomy-templates/#assign-weight)
