---
title: 'CSS 外边距(margin)折叠'
date: 2023-03-20T08:51:00+08:00
tags: ['技术', CSS]
---

https://www.w3schools.com/Css/css_margin_collapse.asp

上下外边距有时会折叠成一个。新的外边距的大小，取决于两者间最大的那一个。

左右外边距不发生折叠，仅发生在顶部和底部。

例子：

```html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
```

```css
h1 {
  margin: 0 0 50px 0;
}
h2 {
  margin: 20px 0 0 0;
}
```
