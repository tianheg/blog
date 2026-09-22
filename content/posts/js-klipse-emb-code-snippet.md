---
title: 'Klipse 嵌入可执行代码片段'
date: 2023-04-10T13:38:00+08:00
tags: ['技术']
---

https://github.com/viebel/klipse

新建一个 HTML 文档，输入以下内容：

```html
<div class="klipse">
  function foo(name) {
  return "Hello " + name;
  }
  foo("Klipse");
</div>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/viebel/klipse@master/dist/codemirror.css">
<script>
  window.klipse_settings = {
    selector_eval_js: '.klipse', // css selector for the html elements you want to klipsify
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/viebel/klipse@master/dist/klipse_plugin.min.js"></script>
```
