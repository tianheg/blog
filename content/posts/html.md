+++
title = "学习 HTML"
date = 2022-02-21T00:00:00+08:00
lastmod = 2022-02-24T16:03:53+08:00
tags = ["技术", "HTML"]
draft = false
toc = true
+++

HTML 是网页使用的语言，定义了网页的结构和内容。


## 网页基本概念 {#网页基本概念}


### 标签 {#标签}

学习 HTML = 学习 HTML 标签的用法


### 元素 {#元素}

浏览器渲染网页时，会把 HTML 源码解析成一个标签树，每个标签都是树的一个节点（node）。这个节点就称为网页元素（element）。

所以，标签与元素同义。只是使用场景不同，前者从源码来看，后者从编程角度来看。


### 块级元素、行内元素 {#块级元素-行内元素}

前者默认占据一行，100% 宽度；后者则与其他元素处于同一行。


### 属性 {#属性}

属性是标签的额外信息，使用空格与标签名和其他属性分隔。


## 网页基本标签 {#网页基本标签}

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title></title>
</head>
<body>
</body>
</html>
```

-   head 标签的子元素一般会有这几个：meta、link、title、style、script、noscript、base

几乎所有网页必备的 meta 信息：

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

meta 的五个属性：

-   charset
-   name、content
-   http-equiv、content


## URL {#url}

URL 是“统一资源定位符”（Uniform Resource Locator）的首字母缩写。


### 网址的组成 {#网址的组成}

-   协议 scheme
-   主机 域名、IP
-   端口
-   路径
-   **查询参数** parameter `?key1=value1&key2=value2`
-   锚点 anchor


### URL 字符 {#url-字符}

URL 的各个组成只能使用：

-   26 个英语字母（大小写）
-   10 个阿拉伯数字
-   连字符（ `-` ）
-   句点（ `.` ）
-   下划线（ `_` ）

还有 18 个保留字符。比如，查询参数的开头是问号（ `?` ）。网页的其他部分要使用保留字符，必须使用它们的转义形式。

URL 字符转义的方法是，在这些字符的 16 进制 ASCII 码前面加上百分号（ `%` ）。常用字符转义形式：

-   !：%21
-   \#：%23
-   $：%24
-   &amp;：%26
-   '：%27
-   (：%28
-   )：%29
-   \*：%2A
-   +：%2B
-   ,：%2C
-   /：%2F
-   :：%3A
-   ;：%3B
-   =：%3D
-   ?：%3F
-   @：%40
-   [：%5B
-   ]：%5D

注意，空格的转义形式是 `%20` 。

对于既不属于合法字符、也不属于保留字符的其他字符（比如汉字），理论上不需要手动转义，可直接写在 URL 中，浏览器会自动转义。


### 绝对 URL 和相对 URL {#绝对-url-和相对-url}


### base {#base}

base 标签指定网页内部的所有相对 URL 的计算基准。


## 元素属性 {#元素属性}


### 全局属性 {#全局属性}

-   id
-   class
-   title
-   tabindex
-   accesskey
-   style
-   hidden
-   lang、dir
-   contenteditable
-   spellcheck
-   data-
-   事件处理属性


## 字符编码 {#字符编码}


### 数字表示 {#数字表示}

每个字符都有一个 Unicode 号码，称为码点（code point）。

但不是每一个 Unicode 字符都能在 HTML 中显示：

-   不可打印的字符无法显示
-   大于小于号在 HTML 中有专门作用，要显示需转义
-   现有键盘无法输入所有 Unicode 字符
-   网页不允许混合编码

HTML 为了解决上述问题，允许使用 Unicode 码点表示字符，浏览器会自动将码点转成对应的字符。

注意，如果用 Unicode 码点表示 HTML 标签，则 HTML 标签不起到原本作用，会显式展现。


### 实体表示 {#实体表示}

一些特殊字符得到优待：

-   &lt;：&amp;lt;
-   &gt;：&amp;gt;
-   "：&amp;quot;
-   '：&amp;apos;
-   &amp;：&amp;amp;
-   ©：&amp;copy;
-   \#：&amp;num;
-   §：&amp;sect;
-   ¥：&amp;yen;
-   $：&amp;dollar;
-   £：&amp;pound;
-   ¢：&amp;cent;
-   %：&amp;percnt;
-   \*：$ast;
-   @：&amp;commat;
-   ^：&amp;Hat;
-   ±：&amp;plusmn;
-   空格：&amp;nbsp;


## 网页的语义结构 {#网页的语义结构}

```html
<body>
  <header>页眉</header>
  <main>
    <article>
      <h1>文章标题</h1>
      <p>文章内容</p>
    </article>
  </main>
  <footer>页尾</footer>
</body>
```

除此之外还有，aside、section、nav、h1~h6、hgroup


## 文本标签 {#文本标签}

div、p、span、br、wbr、hr（属于历史遗留、不建议使用。建议使用 CSS 表示水平线效果）、pre、strong、b（属于历史遗留的纯样式标签、不建议使用）、em、i（语义不强，用 em 代替）、sub、sup、var、u、s、blockquote、cite、q、code、kbd、samp、mark、small、time、data、address、abbr、ins、del、dfn、ruby、bdo、bdi


## 列表标签 {#列表标签}

ol、ul、li、dl（description list）、dt(description term)、dd(description detail)


### 列表标签属性 {#列表标签属性}

ol：

-   reversed 倒序数字
-   start 开始的数字
-   type：A、a、i、I、1


## 图像标签 {#图像标签}


### img {#img}

```html
<img src="" alt="">
```

默认是行内元素。

如何让图片变成链接？

```html
<a href="">
  <img src="" alt="">
</a>
```

属性：

-   alt
-   width、height
-   srcset、sizes
-   referrerpolicy
-   crossorigin
-   loading

一旦设置 width、height，浏览器会为图片预留出这些空间，但图片无法加载时就会很难看。

如果只设置 width 或 height，则图片会等比例调整大小。


### figure、figcaption {#figure-figcaption}

```html
<figure>
  <img src="">
  <figcaption>说明文字</figcaption>
</figure>
```

除了图像，figure 还可以用于引用、代码、诗歌等场景。


### 响应式图像 {#响应式图像}

响应式设计（responsive web design）：网页在不同尺寸的设备上，都能产生良好的显示效果；

响应式设计中的图像部分，就是响应式图像（responsive image）。

图片在不同尺寸的设备上显示时，显示效果不同。在电脑上显示正常的图片，在手机看着就很别扭。而响应式图像就是能够同时满足电脑和手机两类终端的图片设置方式。

-   srcset 用于指定多张图像，适应不同像素密度的屏幕

<!--listend-->

```html
<img srcset="a-320w.jpg, a-480w.jpg 1.5x, a-640w.jpg x2" src="a-640w.jpg">
```

`1.5x` 是 1.5 倍像素密度。

-   sizes 不同尺寸显示不同大小图像，配合 srcset 使用

<!--listend-->

```html
<img srcset="foo-160.jpg 160w,
             foo-320.jpg 320w,
             foo-640.jpg 640w,
             foo-1280.jpg 1280w"
sizes="(max-width: 440px) 100vw,
(max-width: 900px) 33vw,
254px"
src="foo-1280.jpg">
```


### picture {#picture}

```html
<picture>
  <source media="(max-width: 500px)" srcset="a.jpg">
  <source media="(min-width: 501px)" srcset="b.jpg">
  <img src="c.jpg" alt="test">
</picture>
```

还可以同时考虑屏幕尺寸和像素密度的适配进行操作。

图片格式的调整：

```html
<picture>
  <source type="image/svg+xml" srcset="logo.xml">
  <source type="image/webp" srcset="logo.webp">
  <img src="logo.png" alt="ACME Corp">
</picture>
```

浏览器按照 picture 中的图片格式顺序，依次检查是否支持：svg、webp、png。


## 链接标签 {#链接标签}

-   a

rel：

noreferrer 告诉浏览器打开链接时，不要将当前网址作为 HTTP 头信息的 Referer 字段发送出去，这样可以隐藏点击来源。

noopener 告诉浏览器打开链接时，不让链接窗口通过 JS 的 window.opener 属性引用原始窗口，这样就提高了安全性。

-   mailto
-   tel
-   link
-   script
-   noscript


## 多媒体标签 {#多媒体标签}

-   video
-   audio
-   track
-   source
-   embed
-   object, param


## iframe {#iframe}

用于嵌入其他网页。


## 表格 {#表格}

-   table、caption
-   thead、tbody、tfoot
-   colgroup、col
-   tr
-   th、td


## 表单 {#表单}

-   form


## 其他标签 {#其他标签}

-   dialog
-   details、summary

---


## 参考资料 {#参考资料}

1.  <https://wangdoc.com/html/>
2.  <https://developer.mozilla.org/en-US/docs/Web/HTML>
3.  <https://htmlhead.dev/>
4.  <http://html5doctor.com/>
5.  <https://www.w3schools.com/html/default.asp>
6.  HTML 5 权威指南
7.  HTML 标准 <https://html.spec.whatwg.org/multipage/>
8.  <https://github.com/diegocard/awesome-html5>