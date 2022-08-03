+++
title = "CSS Day 2"
date = 2022-07-29T17:30:00+08:00
lastmod = 2022-08-03T15:38:57+08:00
tags = ["技术", "CSS"]
draft = false
+++

今天主要用了动画 animation。想法来自 Twitter 上 @shuding\_ 的分享[^fn:1]。实际效果：

<p class="codepen" data-height="537" data-default-tab="result" data-slug-hash="KKoyRaw" data-editable="true" data-user="tianheg" style="height: 537px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tianheg/pen/KKoyRaw">
  Fade-in animation that is not so boring</a> by tianheg (<a href="https://codepen.io/tianheg">@tianheg</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

介绍了两种图片动画的变化效果。


## 笔记 {#笔记}

`height: 100vh` 和 `display: flex;align-items:center;` 搭配才能得到垂直居中的效果。

最关键的部分在于怎么写好 keyframes，我写的还不行，对于 filter 的使用还不够熟练。还有对于选择分割点的时机问题。

在手机上查看时，发现动画不起作用。猜测可能是 `prefers-reduced-motion` ，于是把它改成 `prefers-reduced-motion: no-preference` 。终于 work 了。

找到 MDN 上关于 prefers-reduced-motion[^fn:2] 的页面：

> The prefers-reduced-motion CSS media feature is used to detect if the user has requested that the system minimize the amount of non-essential motion it uses.

了解到，将 prefers-reduced-motion 设置为 `reduce` 或者仅写 `prefers-reduced-motion` 都会使得浏览器减少/移除动画效果。

从 web.dev 的这篇《prefers-reduced-motion: Sometimes less movement is more》[^fn:3]可以将和动画有关的样式放到一个 CSS 文件 `animations.css` 里，然后这样设置：

```html
<link rel="stylesheet" href="animations.css" media="(prefers-reduced-motion: no-preference)">
```

一个 Demo： <https://prefers-reduced-motion.glitch.me/>

如果想强制关闭动画，可以通过 [Stylus](https://add0n.com/stylus.html) 这样的插件扩展为所有网站插入以下样式，但 **风险自负** ！

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    background-attachment: initial !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
```

因为某些网站为了顺利加载会依赖于动画（某一步依赖于触发 [animationend](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event) 事件），更激进的 `animation: none !important;` 不起作用。即便是以上设置也不能保证所有网站都能屏蔽掉动画（这段代码无法屏蔽通过 Web Animation API 启动的动作）。


## 代码实现 {#代码实现}

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Day2 in CSS</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h2>
      Inspired by
      <a href="https://twitter.com/shuding_/status/1552438750470340610"
        >@shuding_</a
      >
    </h2>
    <div class="containers">
      <div class="container">
        <p>Boring Fade-in</p>
        <img
          class="img-left"
          src="benjamin-voros-phIFdC6lA4E-unsplash.jpg"
          alt="Star"
          width="400"
        />
      </div>
      <div class="container">
        <p>Not so Boring Fade-in</p>
        <img
          class="img-right"
          src="benjamin-voros-phIFdC6lA4E-unsplash.jpg"
          alt="Star"
          width="400"
        />
      </div>
    </div>
  </body>
</html>
```

```css
body {
  background-color: #000;
  color: #fff;
}

h2 {
  text-align: center;
}

.containers {
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 600px) {
  .containers {
    flex-direction: column;
  }
}

.container {
  text-align: center;
  margin: 0 1rem;
}

@media (prefers-reduced-motion: no-preference) {
  .container .img-left {
    animation-name: fastFadein;
    animation-duration: 3s;
    animation-iteration-count: infinite;
  }

  .container .img-right {
    animation-name: slowFadein;
    animation-duration: 3s;
    animation-iteration-count: infinite;
  }
}

@media (prefers-reduced-motion: reduce) {

  .container .img-left,
  .container .img-right {
    animation: none;
  }
}

@keyframes fastFadein {
  0% {
    opacity: 1;
    filter: brightness(0) blur(0);
  }

  100% {
    opacity: 1;
    filter: brightness(1) blur(0);
  }
}

@keyframes slowFadein {
  0% {
    opacity: 0;
    filter: brightness(1) blur(20px);
  }

  15% {
    opacity: 1;
    filter: brightness(2) blur(10px);
  }
}
```

[^fn:1]: <https://twitter.com/shuding_/status/1552438750470340610>
[^fn:2]: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
[^fn:3]: <https://web.dev/prefers-reduced-motion/>