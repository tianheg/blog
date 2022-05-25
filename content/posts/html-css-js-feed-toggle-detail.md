+++
title = "展开、收缩 details 标签"
date = 2022-05-25T12:11:00+08:00
lastmod = 2022-05-25T12:32:35+08:00
tags = ["技术", "CSS", "HTML", "JavaScript"]
draft = false
+++

我的信息源网站，用到了 [&lt;details&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) 标签，当文章很多的时候，一个一个点击展开收缩很费劲，所以设计了一个按钮，来简化这个过程。（[源码](https://github.com/tianheg/feed)）

用到 @antfu 提供的图标网站 [Icones](https://icones.js.org/)，关于 DOM 操作和位置样式布局的一些知识。


## 第一步，在 HTML 模板里放 button 标签 {#第一步-在-html-模板里放-button-标签}

```html
<button class="toggle-details">
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--bi" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zm7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0zm-.5 11.707l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0v-3.793z"></path></svg>
</button>
```


## 第二步，在 JS 文件中写入 DOM 操作 {#第二步-在-js-文件中写入-dom-操作}

```js
const collapse =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--bi" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zm7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0zm-.5 11.707l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0v-3.793z"></path></svg>'
const expand =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--bi" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zM7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10z"></path></svg>'
const details = document.querySelectorAll('.site-expander')
// .site-expander
const toggle_details = document.querySelector('.toggle-details')
console.log(details)

toggle_details.addEventListener('click', () => {
  details.forEach((detail) => {
    if (detail.hasAttribute('open')) {
      detail.removeAttribute('open')
      toggle_details.setHTML(expand)
    } else {
      detail.setAttribute('open', '')
      toggle_details.setHTML(collapse)
    }
  })
})
```


## 第三步，设置样式 {#第三步-设置样式}

```css
.toggle {
  position: fixed;
  bottom: 2rem;
  right: 2.7rem;
  color: var(--base07);
  background-color: var(--base06);
  border: none;
  cursor: pointer;
}
.toggle-details {
  position: fixed;
  bottom: 2rem;
  right: 0;
  color: var(--base07);
  background-color: var(--base06);
  border: none;
  cursor: pointer;
}
@media screen and (max-width: 600px) {
  .toggle {
    right: 0;
    bottom: 4.6rem;
    border-top-left-radius: 15rem;
    border-top-right-radius: 15rem;
    border-top: 0.1rem solid #ff6550;
    border-right: 0.1rem solid #ff6550;
    border-left: 0.1rem solid #ff6550;
  }
  .toggle-details {
    border-bottom-right-radius: 15rem;
    border-bottom-left-radius: 15rem;
    border-right: 0.1rem solid #ff6550;
    border-bottom: 0.1rem solid #ff6550;
    border-left: 0.1rem solid #ff6550;
  }
}
```