---
title: 'JS 新标签页打开外部链接'
date: 2023-01-23T07:58:00+08:00
tags: ['技术', JavaScript]
---

代码：

```javascript
function externalLinks() {
  for (let c = document.getElementsByTagName("a"), a = 0; a < c.length; a++) {
    let b = c[a];
    b.getAttribute("href") &&
      b.hostname !== location.hostname &&
      (b.target = "_blank");
  }
}
externalLinks();
```

来自：<https://stackoverflow.com/a/13147238/12539782>

我找了它很久，以前曾在 [Sphinx](https://www.sphinx-doc.org/en/master/) 中用过。
