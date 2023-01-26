+++
title = "Hugo 内链当前标签页打开，外链新标签页打开"
date = 2021-02-16T00:00:00+08:00
lastmod = 2022-02-26T14:58:47+08:00
tags = ["技术", "Hugo"]
draft = false
+++

## 例子 {#例子}

-   <https://yihui.org/cn/>
-   <https://io-oi.me/>


## 实现 {#实现}

在 Hugo 博客的博客单页面（single.html）中，修改 `{{ .Content }}` 为

```text
{{ $content := .Content }}
{{ $content = replaceRE `<a href="(https?://.+)">` `<a href="$1" target="_blank" rel="noopener">` $content | safeHTML }}
{{ $content | safeHTML }}
```

这样就可以实现「内链当前标签页打开，外链新标签页打开」。这可能是应用了「正则表达式」，我还不太了解。Hugo 的语法我还不了解。

2023 年 1 月 26 日 Update：

以上方法，我不理解。直接尝试用到另一个 Hugo 主题，发现不可行。找到另一种可行的方法：

新建文件 `layouts/_default/_markup/render-link.html` ，加入内容：

```html
<a href="{{ .Destination | safeURL }}"{{ with .Title}} title="{{ . }}"{{ end }}{{ if strings.HasPrefix .Destination "http" }} target="_blank" {{ end }}>{{ .Text | safeHTML }}</a>
```

---
参考资料

1.  <https://discourse.gohugo.io/t/how-to-open-plain-url-links-in-a-new-tab/25523/6>
2.  <https://github.com/reuixiy/hugo-theme-meme/blob/d392ab1814/layouts/partials/utils/markdownify.html?rgh-link-date=2021-01-12T04%3A02%3A06Z#L27>
3.  <https://stackoverflow.com/a/4425214/12539782>
4.  <https://discourse.gohugo.io/t/internal-links-in-same-tab-external-links-in-new-tab/11048/9>
5. <https://gohugo.io/templates/render-hooks/>
