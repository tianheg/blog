+++
title = "学习《网道 HTML 教程》"
date = 2022-02-21T00:00:00+08:00
lastmod = 2022-02-21T13:48:37+08:00
tags = ["技术", "HTML"]
draft = false
toc = true
+++

<https://wangdoc.com/html/>

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

---

1.  <https://developer.mozilla.org/en-US/docs/Web/HTML>