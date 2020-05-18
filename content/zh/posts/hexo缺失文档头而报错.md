---
title: Hexo缺失文档头而报错
date: 2020-05-18T14:32:31+08:00
categories: ["技术"]
series: ["Hexo"]
slug: hexo no doc head error
keywords: ["Hexo"]
description: "记录当 Hexo 博客的 md 文档没有文档头时会产生的错误"
---

如果一个 hexo 文档，没有

```yaml
---
title: 08 问题解决/缺失文档头而报错
date: 2020-04-23 23:49:32
categories: 问题
toc: true
---
```

会报如下错误：

```
YAMLException: end of the stream or a document separator is expected at line 23, column 1:
```

