+++
title = "CSS Day 1"
date = 2022-07-27T10:27:00+08:00
lastmod = 2022-07-27T19:27:32+08:00
tags = ["技术", "CSS"]
draft = false
+++

很久以前遇到这个[^fn:1]有趣的 CSS 效果——点击字母，就会发光。

<p class="codepen" data-height="300" data-default-tab="result" data-slug-hash="KKzdXpY" data-preview="true" data-user="prathkum" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/prathkum/pen/KKzdXpY">
  Glowing Text</a> by Pratham (<a href="https://codepen.io/prathkum">@prathkum</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

曾经在 CodePen 上照着写了一遍。没有太深刻的印象。这次打算好好想想这究竟是怎么实现的。


## 如何实现 {#如何实现}

从整体到局部看：

```txt
body -> ul -> li -> input[type="checkbox"] + div
```


### body {#body}

`margin: 0; padding: 0;` 用来重置内外边距，因为不同浏览器会有不同的默认值，为了在所有浏览器得到相同的样式，先进行这一步。

`height: 100vh;` `vh` 对我来说，经常用但之前对它的含义比较模糊。这个设置的意思就是，将 body 的高度设为和 viewport 高度相等。

通过 MDN[^fn:2] 得到如下定义：

> Represents a percentage of the height of the viewport's initial containing block. 1vh is 1% of the viewport height.

翻译过来就是，viewport 的高度的百分比。

什么是 Viewport[^fn:3]？

> A viewport represents a polygonal (normally rectangular) area in computer graphics that is currently being viewed. In web browser terms, it refers to the part of the document you're viewing which is currently visible in its window (or the screen, if the document is being viewed in full screen mode). Content outside the viewport is not visible onscreen until scrolled into view.

它的意思是，viewport 指浏览器窗口可见的部分。

`display:flex;justify-content:center;align-items:center;` 用了 Flexbox，它是用来进行一维布局的。这段 CSS 代码是我最常用的、进行水平居中、垂直居中设置的代码。


### ul {#ul}

`position: relative;` 这里的 position 设置与 li 的 input 和 div 标签的 position 设置是彼此配合的。 `relative` 是根据一般情况下的文档流进行偏移定位的。通过 top、right、bottom 或/和 left 进行调校。并且对其他元素并无影响。占据偏移前的空白部分。如果 position 的值是 `absolute` 那么该元素就会被从文档流中移出，不再保留原有空白。[^fn:4]

> It is positioned relative to its closest positioned ancestor, if any; otherwise, it is placed relative to the initial containing block. Its final position is determined by the values of top, right, bottom, and left. -- position: absolute;

`display: flex;` 设置水平排列。


### li {#li}

`list-style: none;` 隐藏 li 默认的小圆点。


### `input[type="checkbox"]` {#input-type-checkbox}

`opacity: 0;` 将 checkbox 设为透明。

`cursor: pointer;` 当光标放置到 checkbox 上时，光标会由原来的箭头变为小手。

`z-index: 10;` 只要 &gt; 0 就可以，保证 checkbox 是光标可以点击的。

`height:2em;width:2em;font-size:2.5em;margin:0 .5em;` 以前经常用 px 表示长度/距离。现在提倡使用 em、rem。px 是绝对单位，em、rem 是相对单位。后者能更好地帮助用户开发多浏览器一致的网页。

em 的标准定义：

> Equal to the computed value of the font-size property of the element on which it is used.
>
> ——CSS Values and Units Module Level 3 标准[^fn:5]

em 是以当前元素的 font-size 大小为基准的。


### div {#div}

position 已经讨论过。height、width、font-size、margin 同样。

还要设置 color、background-color。依然要通过 flexbox 设置二维居中。

border-radius 让整个 div 元素更为圆润。其氛围作用的是 box-shadow，原作者写了一个很复杂的、单位是 px 的，我改成了 em 作单位。


### `input[type="checkbox"]:checked ~ div` {#input-type-checkbox-checked-div}

这一 part 是点亮文字的效果。修改了 box-shadow 使得原本的白雾状的外层变得深色些。初始 color 设为黄色。也给文字添加了阴影 text-shadow。

最关键的就是 `animation: glow 1.5s linear infinite` 。glow 是动画 keyframe 的名称，一个周期 1.5s，线性变化，时长是无穷。

```css
@keyframes glow {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}
```

`filter` 能改变图片、背景、边框的模糊度、对比度、灰度、阴影度等。 `hue-rotate`  能够对原样式的颜色进行旋转。


### media query {#media-query}

```css
@media (max-width: 35rem) {
  ul {
    position: relative;
    top: 6rem;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  input[type="checkbox"],
  div {
    margin: 0.2em 0;
    height: 2em;
    width: 2em;
  }
  div {
    font-size: 2.5em;
  }
}
```

35rem 对于 Firefox 来说是 700px，对于 Chrome 则是 770px。


## 问题 {#问题}

1.  手机上触摸点亮的时候，会出现蓝色方形框（见下图 1，使用 Chrome Android），我想让这个方框隐藏。「此外，我截屏的图片太大，于是想让 Hugo 能够设置图片大小，寻找半天解决方案，没有合适方便的；想到可以调整图片大小，之后发现这是最佳方案。」
2.  移动端并不居中，在 meida query 中的 ul 加了 `padding: 0;` 才解决。

![图 1](/images/css-day-1.jpg "图 1")


### 1 {#1}

为 checkbox 添加以下样式[^fn:6]。

```css
@media (max-width: 35rem) {
  input[type="checkbox"], div {
    -webkit-tap-highlight-color: transparent;
  }
}
```

触摸点亮没有蓝色方框了。兼容性：支持 Chrome Android、Opera Android、Safari on iOS，不支持 Firefox for Android[^fn:7]，也没必要支持，因为在 Firefox 桌面端开启手机视图进行触摸测试，没有蓝色方框。


### 2 {#2}

发现 Chrome 的 user agent stylesheet 关于 ul 元素有个默认样式： `padding-inline-start: 40px;` ，所以才需要 `padding: 0;` 重置一下。


## 代码实现 {#代码实现}

```html
<head>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@900&display=swap");
    body {
      margin: 0;
      padding: 0;
      height: 100vh;
      background-color: #18191f;
      font-family: "Poppins", sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    ul {
      position: relative;
      display: flex;
    }
    li {
      list-style: none;
    }
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 2em;
      width: 2em;
      font-size: 2.5em;
      margin: 0 .5em;
      z-index: 10;
    }
    div {
      position: relative;
      height: 2em;
      width: 2em;
      background-color: #18191f;
      color: #555;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2.5em;
      margin: 0 .5em;
      border-radius: .5em;
      box-shadow: -.1em -.1em .4em rgba(255, 255, 255, 0.05),
        .4em .4em .6em rgba(0, 0, 0, 0.2),
        inset -.1em -.1em .4em rgba(255, 255, 255, 0.05),
        inset .1em .1em .1em rgba(0, 0, 0, 0.1);
    }
    input[type="checkbox"]:checked ~ div {
      box-shadow: inset 0 0 .2em rgba(255, 255, 255, 0.05),
        inset .4em .4em .6em rgba(0, 0, 0, 0.2);
      color: yellow;
      text-shadow: 0 0 1.5em yellow, 0 0 2.5em yellow;
      animation: glow 1.5s linear infinite;
    }
    @keyframes glow {
      0% {
        filter: hue-rotate(0deg);
      }
      100% {
        filter: hue-rotate(360deg);
      }
    }
    @media (max-width: 35rem) {
      ul {
        position: relative;
        top: 6rem;
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        -webkit-tap-highlight-color: transparent;
      }
      input[type="checkbox"], div {
        margin: .2em 0;
        height: 2em;
        width: 2em;
      }
      div {
        font-size: 2.5em;
      }
    }
  </style>
</head>
<body>
  <ul>
    <li>
      <input type="checkbox"><div>T</div>
    </li>
    <li>
      <input type="checkbox"><div>I</div>
    </li>
    <li>
      <input type="checkbox"><div>A</div>
    </li>
    <li>
      <input type="checkbox"><div>N</div>
    </li>
    <li>
      <input type="checkbox"><div>H</div>
    </li>
    <li>
      <input type="checkbox"><div>E</div>
    </li>
    <li>
      <input type="checkbox"><div>G</div>
    </li>
  </ul>
</body>
```

[^fn:1]: [Glowing Text](https://codepen.io/prathkum/pen/KKzdXpY)
[^fn:2]: [&lt;length&gt; - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/length)
[^fn:3]: [Viewport - MDN](https://developer.mozilla.org/en-US/docs/Glossary/Viewport)
[^fn:4]: [position - CSS | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/position#values)
[^fn:5]: [Font-relative Lengths: the em, ex, ch, rem units](https://www.w3.org/TR/css3-values/#font-relative-lengths)
[^fn:6]: <https://stackoverflow.com/a/61308622>
[^fn:7]: [Browser compatibility - -webkit-tap-highlight-color - CSS: Cascading Style Sheets | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color#browser_compatibility)