---
title: 'CSS 取代 br'
date: 2022-05-22
tags: ['技术', CSS, Hugo, HTML]
---

在 Hugo 中添加一个 shortcode：

```
    <div style="display: block;margin-bottom: 3em"></div>
```

在 Hugo 文章中使用：

```
    {{</* br */>}}
```

测试：

```
    test{{</* br */>}}test
```

test-----test
