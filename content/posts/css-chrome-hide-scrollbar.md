---
title: 'CSS 隐藏 Chrome 的滚动条'
date: 2022-11-07T15:03:00+08:00
tags: ['技术', CSS]
---

<https://www.w3schools.com/howto/howto_css_hide_scrollbars.asp>

```css
/* Hide scrollbar for Chrome, Safari and Opera */
.example::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.example {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
```
