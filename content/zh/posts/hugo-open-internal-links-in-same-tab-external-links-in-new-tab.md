+++
date = '2021-02-16T21:45:07+08:00'
description = '记录<Hugo 内链当前标签页打开，外链新标签页打开>实现过程'
keywords = ['Hugo']
tags = ['Hugo']
title = 'Hugo 内链当前标签页打开，外链新标签页打开'
+++

## 例子

- <https://yihui.org/cn/>
- <https://io-oi.me/>

## 实现

在 Hugo 博客的博客单页面（single.html）中，修改 `{{ .Content }}` 为

```html
{{ $content := .Content }}
{{ $content = replaceRE `<a href="(https?://.+)">` `<a href="$1" target="_blank" rel="noopener">` $content | safeHTML }}
{{ $content | safeHTML }}
```

这样就可以实现「内链当前标签页打开，外链新标签页打开」。这可能是应用了「正则表达式」，我还不太了解。Hugo 的语法我还不了解。

---

**参考资料**：

1. <https://discourse.gohugo.io/t/how-to-open-plain-url-links-in-a-new-tab/25523/6>
2. <https://github.com/reuixiy/hugo-theme-meme/blob/d392ab1814/layouts/partials/utils/markdownify.html?rgh-link-date=2021-01-12T04%3A02%3A06Z#L27>
3. <https://stackoverflow.com/a/4425214/12539782>
4. <https://discourse.gohugo.io/t/internal-links-in-same-tab-external-links-in-new-tab/11048/9>
