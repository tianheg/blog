+++
title = "CSS 触屏上的 hover"
date = 2022-08-04T18:52:00+08:00
lastmod = 2022-08-04T19:03:43+08:00
tags = ["技术", "CSS"]
draft = false
+++

触屏上的 CSS hover 问题。（Chrome Android）点击一下会选中可 hover 的文本。

从这篇文章[^fn:1]找到一处 CodePen 演示&nbsp;[^fn:2]。代码：

```html
<button
  data-title="Hello guys!"
  data-help="My name is @tianheg"
>Subscribe</button>
```

```css
button {
  color: #333;
  font-size: 1.3rem;
  padding: 2rem;
  background-color: #eee;
  border: 1px solid #ddd;
  position: relative;
  transition: all ease 200ms;
}

@media (pointer: fine) {
  button:hover {
    color: #fff;
    border-color: #000;
    background-color: #333;
  }
  button:hover::after {
    top: 90%;
    background: #aaa;
    border-radius: 0.25rem;
    content: attr(data-title);
    position: absolute;
    font-size: 0.7rem;
    padding: 0.5rem 0.8rem;
    width: max(100%, 200px);
    max-width: max-content;
  }
}

@media (pointer: coarse) {
  button::after {
    content: attr(data-title);
    display: block;
    font-size: 0.75rem;
  }
  button:hover {
    color: #ddd;
    border-color: #aaa;
    background-color: #999;
  }
}

@media (pointer: none) {
  button::before, button::after {
    display: block;
    font-size: 0.75rem;
  }
  button::after {
    content: attr(data-title);
  }
  button::before {
    content: attr(data-help);
  }
}
```

我自己做的一个 Demo。

<p class="codepen" data-height="230" data-default-tab="html,result" data-slug-hash="MWVVGbx" data-preview="true" data-editable="true" data-user="tianheg" style="height: 230px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tianheg/pen/MWVVGbx">
  Pointer Media Queries in CSS</a> by tianheg (<a href="https://codepen.io/tianheg">@tianheg</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

当你在电脑上把鼠标移到区块上时，会出现 `Hello guys!` 字样；当你在触屏手机上查看时，会发现 `Subscribe` 下面会有 `Hello guys!` 字样。正好对应了我的 CSS 设置。

从 MDN 的这一页面[^fn:3]可见 @media 下 pointer 的详细用法：

1.  `none` 表示当前显示设备无指向装置
2.  `coarse` 表示当前设备有不精确的指向装置，例如，触屏环境
3.  `fine` 表示当前设备包含精确的指向装置

[^fn:1]: <https://medium.com/time2hack/can-i-use-hover-on-touch-devices-d9f039e24899>
[^fn:2]: <https://codepen.io/pankajpatel/pen/rNYQJBw>
[^fn:3]: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer>