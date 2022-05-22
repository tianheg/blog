+++
title = "CSS 取代 br"
date = 2022-05-22T08:02:00+08:00
lastmod = 2022-05-22T08:05:52+08:00
tags = ["技术", "CSS", "Hugo", "HTML"]
draft = false
+++

在 Hugo 中添加一个 shortcode：

```html
<div style="display: block;margin-bottom: 3em"></div>
```

在 Hugo 文章中使用：

```md
{{</* br */>}}
```

测试：

```md
test{{</* br */>}}test
```

test{{< br >}}test