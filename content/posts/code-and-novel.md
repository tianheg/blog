+++
title = "把代码像小说一样进行推荐"
date = 2022-04-22T00:00:00+08:00
lastmod = 2022-04-22T09:35:58+08:00
tags = ["技术", "思考"]
draft = false
+++

[为什么说读代码像读小说？| 王建硕](http://home.wangjianshuo.com/cn/20210825_%e4%b8%ba%e4%bb%80%e4%b9%88%e8%af%b4%e8%af%bb%e4%bb%a3%e7%a0%81%e5%83%8f%e8%af%bb%e5%b0%8f%e8%af%b4%ef%bc%9f-2.htm)

[anime/anime.js at master · juliangarnier/anime](https://github.com/juliangarnier/anime/blob/master/lib/anime.js#L58-L74)

```js
var is = {
  arr: function (a) {
    return Array.isArray(a)
  },
  obj: function (a) {
    return stringContains(Object.prototype.toString.call(a), 'Object')
  },
  pth: function (a) {
    return is.obj(a) && a.hasOwnProperty('totalLength')
  },
  svg: function (a) {
    return a instanceof SVGElement
  },
  inp: function (a) {
    return a instanceof HTMLInputElement
  },
  dom: function (a) {
    return a.nodeType || is.svg(a)
  },
  str: function (a) {
    return typeof a === 'string'
  },
  fnc: function (a) {
    return typeof a === 'function'
  },
  und: function (a) {
    return typeof a === 'undefined'
  },
  nil: function (a) {
    return is.und(a) || a === null
  },
  hex: function (a) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a)
  },
  rgb: function (a) {
    return /^rgb/.test(a)
  },
  hsl: function (a) {
    return /^hsl/.test(a)
  },
  col: function (a) {
    return is.hex(a) || is.rgb(a) || is.hsl(a)
  },
  key: function (a) {
    return (
      !defaultInstanceSettings.hasOwnProperty(a) &&
      !defaultTweenSettings.hasOwnProperty(a) &&
      a !== 'targets' &&
      a !== 'keyframes'
    )
  },
}
```

在这里 `===` 表达了更严格的相等，其实使用 `==` 效果也是一样的。计算机执行不会报错，但是为什么还是要使用 `===` 呢？我认为作者是想让人们阅读代码时有一种更舒适的感受。曾经听到过一句话，好的程序员不仅能写出计算机理解的代码，还能写出人能理解的代码。
