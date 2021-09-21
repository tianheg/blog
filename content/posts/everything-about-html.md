+++
date = '2021-05-05T15:51:03+08:00'
description = '关于 HTML 的所有事'
keywords = ['HTML', 'Front-end']
slug = 'everything-about-html'
tags = ['HTML', 'Front-end']
title = '关于 HTML 的所有事'
+++

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="description" content="This is an example.">
    <title>Title</title>
  </head>
  <body>
  <h2>Hello World!</h2>
  <p>Hello World!</p>
  </body>
</html>
```

## Basic Tags

`html`, `head`, `body`, `meta`, `title`, `hx`(x=1~6), `p`, `b`(bold), `i`(italic), `br/`, `hr/`, `big`, `small`, `sub`, `sup`, `aside`, `a`, `img`, `video`, `iframe`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`

## Comments

```html
<!-- -->
```

## Style and Colors

```html
<p style="color: green;">Hello World!</p>
```

## Formatting a Page

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="description" content="This is an example.">
    <title>Title</title>
  </head>
  <body>
    <header>
      <nav></nav>
    </header>
    <main>
      <article>
        <section>
          <h2>Hello World!</h2>
          <p>Hello World!</p>
        </section>
      </article> 
    </main>
    <footer></footer>
  </body>
</html>
```

## Links

```html
<a href="https://www.google.com" target="_blank"><h1>Google's Homepage</h1></a>
<a href="pages2.html">Tss</a>
```

## Images

```html
<a href="">
  <img src="" alt="" width="" height="100"/> <!-- 100px pixels-->
</a>
```

在进行图片的显示大小设置时，可以只设置一个（width 或 height），之后 HTML 会自动把没有设置的那一个按图片比例调整到合适大小。adjust the aspect ratio for you（为你调整长宽比）。

## Videos and YouTube iFrames

```html
<video src="" width="" height="" poster="" loop autoplay controls></video> <!-- 添加封面 -->

<iframe width="560" height="315" src="https://www.youtube.com/embed/pQN-pnXPaVg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

## Lists

```html
<ul>
  <li><a href="#">Apples</a></li>
  <li>Oranges
    <ol>
      <li>tetx</li>
    </ol>
  </li>
  <li>Bananas</li>
</ul>

<ol type="a/A/I/i">
  <li>Apples</li>
  <li>Oranges</li>
  <li>Bananas</li>
</ol>

<dl>
  <dt>Apples</dt>
  <dd>- They are red.</dd>
  <dt>Oranges</dt>
  <dd>- They are orange.</dd>
</dl>
```

## Tables

```html
<table>
  <thead>
    <caption><h2>List of Numbers</h2></caption>
    <tr>
      <th>Num1</th>
      <th>Num2</th>
      <th>Num3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2">Four</td>
      <td>Five</td>
      <td>Six</td>
    </tr>
  </tbody>
</table>
```

## Divs and Spans

```html
<!-- Inline element -->
<a href="#">link1</a>
<a href="#">linkk2</a>
<span>text</span>

<!-- block element -->
<hr>
  <p>Text</p>
  <p>Tsts</p>
  <div>div1</div>
  <div>div2</div>
```

## Input and Forms

```html
<form>
  <input type="text" value="Enter your username"/>
  <input type="password" />
  <textarea rows="10" cols="30">
  Enter a paragraph
  </textarea>
  <input type="date" />
  <input type="email" />
  <input type="range" />
  <input type="file" />
  <input type="checkbox" />
  <input name="btn" type="radio" />
  <input name="btn" type="radio" />
  <input type="submit" />
</form>
```

## iFrames

```html
<iframe src="https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" frameborder="0" width="" height="">
fCC JavaScript
</iframe>
```

有些网站不允许通过 `iframe` 嵌入到其他网站中，因为这会使得浏览网站的人误以为“其他网站”才是真网站，而把那个真正的官方网站视为假网站。

## Meta Tags

```html
<meta charset="UTF-8">
<meta name="description" content="This is an example.">
<meta name="author" content="Jim Gao">
<meta name="keywords" content="Tags, HTML">

<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

**参考资料**：

1. [Basic HTML and HTML5 - freeCodeCamp](https://www.freecodecamp.org/learn/responsive-web-design/#basic-html-and-html5)
2. [HTML Full Course - Build a Website Tutorial](https://youtu.be/pQN-pnXPaVg)
3. [HTML Tutorial - W3Schools](https://www.w3schools.com/html/default.asp)
