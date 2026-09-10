---
title: 'Hugo 修复水平溢出'
date: 2022-10-24T22:34:00+08:00
tags: ['技术', Hugo]
---

有一个样式问题困扰了我很久——当博客处于移动版，访问归档页面，手指向左滑，会发现右边有一段空白。我不知道原因是什么，直到前天读到《[小技巧 debug 网页 css overflow ，避免出现底部滚动条](https://www.xianmin.org/post/2022/05-debug-css-x-overflow/)》，猜测可能是某个元素溢出了可视窗口（viewport）导致。

贤民文章里提到一个检查所有元素溢出情况的 bookmarklet：

```javascript
javascript:(function(){var css='* {outline: 1px solid red;}';var heads=document.getElementsByTagName('head');if(heads.length>0){var node=document.createElement('style');node.appendChild(document.createTextNode(css));heads[0].appendChild(node);}})();
```

易读的 JS 版本：

```javascript
(function() {
  var css = '* { outline: 1px solid red; }';
  var heads = document.getElementsByTagName('head');
  if (heads.length > 0) {
    var node = document.createElement('style');
    node.appendChild(document.createTextNode(css));
    heads[0].appendChild(node);
  }
})()
```

通过这个工具，我发现是 **文章题目过长导致日期水平移动** 的原因（我的文章列表是文章题目在左，日期在右）。我发现通过修改题目和日期的顺序，能够解决水平溢出的问题。就这样，困扰了我很久的一个问题终于解决了。

除了贤民的文章，我还阅读了谢益辉的《[是谁带来了水平滚动条](https://yihui.org/cn/2017/07/horizontal-overflow/)》。
