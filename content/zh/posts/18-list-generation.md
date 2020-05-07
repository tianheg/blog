---
title: 18列表生成式
toc: false
date: 2020-04-12T23:02:17+08:00
categories: ["技术"]
tags: ["list"]
series: ["Python"]
---
列表生成式即 List Comprehensions，是 Python 内置的非常简单却强大的可以用来创建 list 生成式。

<!--more-->

举个例子，要生成 list `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` 可以用 `list(range(1, 11))`：

```
>>> list(range(1, 11))
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

用列表生成式生成 `[1x1, 2x2, 3x3, ..., 10x10]`：

```
>>> [x * x for x in range(1, 11)]
[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

