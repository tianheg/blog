+++
title = "CSS Day 2"
date = 2022-07-29T17:30:00+08:00
lastmod = 2022-07-30T17:15:21+08:00
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
@media (prefers-reduced-motion) {
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