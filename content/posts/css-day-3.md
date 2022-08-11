+++
title = "CSS Day 3"
date = 2022-08-10T14:06:00+08:00
lastmod = 2022-08-11T14:28:18+08:00
tags = ["技术", "CSS"]
draft = false
+++

最近几天练习 MDN-CSS Guide-CSS first steps overview 下的 [Guides](https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps#guides) 部分。

练习 Demo 在「[这里](https://csszengarden.tianheg.xyz/days/first-30-days/3/)」。在 Demo 最后可以看到我的 [scss](https://sass-lang.com/) 样式文件。

对 `:root` 设置 font-size 为 62.5%。然后对 body 的 font-size 设置为 1.6rem。此时的 1.6rem 相当于 16px。这样做可以轻松地将 px 向 rem 转换，方便进行响应式布局设计。

对所有元素的 `box-sizing` 的属性应用 `border-box` 值。通过阅读 box-sizing[^fn:1]了解到。

box-sizing 有两个值：content-box 和 border-box，前一个是默认值。

-   当 box-sizing 的值为 content-box 时，如果设置元素宽度为 100px，边框宽度为 10px，那么最终该元素的宽度大约为 120px；
-   当 box-sizing 的值为 border-box 时，如果设置元素宽度为 100px，边框宽度为 10px，那么最终该元素的宽度依旧是 100px。

因此，如果 box-sizing 的值设为 content-box，如果设置元素宽度为固定值，border、padding 的宽度会加入到元素宽度中；如果设置 border-box，则元素宽度即为给定值，border、padding 宽度不影响元素宽度。

整个 `<body>` 用到了 `rgba(128, 128, 128, 0.9)` 颜色，整个呈现一种暗灰色调。

.flexbox 用到了 flex 布局，它能够很方便地对元素进行一维排序。为其添加了 media query，使得 viewport 宽度 &lt; 30em 时，.flexbox 的内容布局变成 column 并且居中。

MDN[^fn:2] 中对 `em` 单位的解释：

> Font size of the parent, in the case of typographical properties like font-size, and font size of the element itself, in the case of other properties like width.

它的大小取决于两类要素：一个是父级元素的字体大小，一个是自身的字体大小。 后半句不理解。

为 h1 的内容设置了设置了 hover 动画——鼠标悬浮在标题内容上，会出现一个颜色变化的动画。

img 图片使用了 aspect-ratio[^fn:3]，通过它可以很方便地设置纵横比。它是用来代替 width 和 height 设置的。

通过 id 和 class 练习了外部样式中顺序的优先级。也使用 `nth-child(3)`&nbsp;[^fn:4] 选中了第三个自然段。

在改变链接 a 的样式时，用 text-underline-offset[^fn:5] 把链接下划线向下偏移一定距离，让这个链接看起来明显且舒适。而且，还通过 `a[href^`"http"]= 属性选择器，为链接添加一个小图标，以暗示这是一个链接。主要通过 `background: url('link.png') no-repeat 100% 0;` 添加图标，background-size 调整大小，padding-right 调整图标相对文字位置。

接下来是一个 lists。一个是有序列表，一个是无序。无序列表的引导变成了 emoji；有序列表的序号也进行了一些修改。在 lists 中运用了大量 flex、grid 布局。主要使用 content 属性自定义列表的引导样式。

```html
<ul role="list">
  <li data-icon="🦄">Apple</li>
  <li data-icon="🌈">Banana</li>
  <li data-icon="😎">Orange</li>
</ul>

<ol role="list">
  <li>Apple</li>
  <li style="--li-bg: darkcyan">Banana</li>
  <li style="--li-bg: navy">Orange</li>
</ol>
```

对于 ul 首先如上述代码所示，添加 data-icon 属性，然后设置样式。

```css
ul > li::before {
  content: attr(data-icon);
  font-size: 1.6rem;
}
```

attr()[^fn:6] 目前只能用于 content 属性。

对于 ol 用到了 counter-reset[^fn:7], counter-increment[^fn:8], counter()[^fn:9]。

```css
ol {
  --li-bg: purple;
  counter-reset: orderedlist;
  li::before {
    counter-increment: orderedlist;
    content: counter(orderedlist);
    background-color: var(--li-bg);
  }
}
```

除此之外，还设置了 `--li-bg` 变量，使得可以通过改变 `--li-bg` 的值来改变背景色。

还考虑到，在小屏幕上看的话需要将两列变成一列，这通过 `flex-direction` 实现。

下一个是通过 calc() 函数来动态改变盒子宽度的。

再下面可以看到四个盒子，左右两边是对称的。中间的竖黑线，不是第一次就知道怎么设置的。

```html
<div class="flexbox2">
  <div class="outer">
    <div class="box"></div>
  </div>
  <div class="outer">
    <div class="box"></div>
  </div>
</div>
```

如上所示，我在 .box 外面又加了 .outer。通过对两个 .outer 设置 border 左右边框，来实现竖直线。

绿色方框的旋转是通过 transform[^fn:10] 实现的。

下一个应用了 @counter-style，一开始写好后发现列表怎么也不变，后来明白这种 at-rules 要写在最外面，不能嵌套在选择器内部。

```scss
@counter-style blacknwhite {
  // can't place it inside cascading scss
  system: cyclic;
  symbols: ◆ ◇;
  suffix: ' ';
}
```

这里是 scss 语法，所以注释可以这样写。

接下来是：font, background, border, padding, margin 的快捷写法练习。background 设置三个 linear-gradient 颜色变得很是花哨。

最后记录了 CSS 的工作原理。

最后我想把 `style.scss` 也展示出来，用到以下代码：

```js
fetch('./style.scss')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    return response.text();
  })
  .then((result) => {
    const scssFile = document.getElementById('scssFile');
    const preElem = document.createElement('pre');
    const codeElem = document.createElement('code');
    codeElem.innerHTML = result;
    preElem.appendChild(codeElem);
    scssFile.appendChild(preElem);
  });
```

对应的，HTML 文件中要有 id 为 scssFile 的元素。

```html
<details class="get-scss-content">
  <summary>scss style file</summary>
  <div id="scssFile"></div>
</details>
```

我加了 `details`&nbsp;[^fn:11] 元素是为了节省空间。

不过，将 scss 文件内容展示到页面上后，总是因为代码太长，无法在屏幕内看完，有些内容被遮住了，如果想看的话需要将页面向左移动才能看到被遮住的部分。于是，想到用 word-wrap[^fn:12] 或者 overflow-wrap[^fn:13] 解决。最开始，发现怎么改样式都没变，只有仔细看看样式代码，发现本应该用 `#scssFile` 选中对应元素的，却少写了 `#` 。

给 `<code>` 应用了 `overflow-wrap: anywhere;` 后还是不行，后来还发现 word-wrap 是 overflow-wrap 的别名，也就是说它们俩是一样的。而 word-break[^fn:14] 的所有属性都无法让文本产生样式变化。

直到读了这页内容[^fn:15]，才发现 `<pre>` 包裹的内容的样式是默认无法被改变的。pre 已弃用的 wrap 属性介绍中，给了一种实现 pre 中换行的 CSS 方式：white-space[^fn:16]。终于，只通过 `white-space: pre-wrap;` 我便让 pre 标签内部的文本换行了。

[^fn:1]: [box-sizing - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)
[^fn:2]: [em - Relative length units - Lengths - CSS values and units - MDN](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units#numbers_lengths_and_percentages)
[^fn:3]: [aspect-ratio - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
[^fn:4]: [:nth-child() - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child)
[^fn:5]: [text-underline-offset - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-underline-offset)
[^fn:6]: [attr() - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)
[^fn:7]: [counter-reset - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/counter-reset)
[^fn:8]: [counter-increment - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/counter-increment)
[^fn:9]: [counter() - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/counter)
[^fn:10]: [transform - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
[^fn:11]: [&lt;details&gt; - HTML - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
[^fn:12]: [word-break - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break)
[^fn:13]: [overflow-wrap - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap)
[^fn:14]: [word-break - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/word-break)
[^fn:15]: [&lt;pre&gt; - HTML - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre)
[^fn:16]: [white-space - CSS - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)