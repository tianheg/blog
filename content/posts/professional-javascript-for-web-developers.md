+++
title = "JavaScript 高级程序设计第 4 版"
date = 2021-11-23T00:00:00+08:00
lastmod = 2022-02-16T15:33:49+08:00
tags = ["阅读"]
draft = false
+++

「迭代」是指，按照顺序多次执行程序，一般有明确的终止条件。ES6 规范新增了两个高级特性：迭代器和生成器。它们能帮助我们更好地实现迭代。


## 什么是迭代？ {#什么是迭代}

在 JS 中，计数循环是一种最为简单的迭代：

```js
for (let i = 1; i <= 20; ++i) {
    console.log(i);
}
```

循环是迭代机制的基础，这是因为循环可以指定迭代次数，以及每次迭代的操作。

迭代会在一个有序集合上进行。数组是 JS 中有序集合的典型例子：

```js
let collection = ['foo', 'bar', 'baz'];

for (let index = 0; index < collection.length; ++index) {
    console.log(collection[index])
}
```

数组的长度已知，且可以索引到每一项，所以整个数组可以通过递增索引来遍历。但是，通过这种循环执行例程并不理想，原因如下：

1.  迭代之前需要事先知道如何使用数据结构
2.  遍历顺序不是数据结构固有的

ES5 新增了 `Array.prototype.forEach()` 方法，部分解决了通过迭代的需要（但不够理想）：

```js
let collection = ['foo', 'bar', 'baz'];

collection.forEach((item) => console.log(item));
```

该方法解决了「单独记录索引」和「通过数组对象取值」的问题，但无法标识迭代的终止时间。故而它只适用于「数组」，且回调结构笨拙。

迭代器就是为了解决「使用过多循环导致代码混乱度增加」而出现的。


## 迭代器模式 {#迭代器模式}

迭代器模式使某些结构被称为「可迭代对象」（iterable），因为它们实现了正式的 Iterable 接口，而且可通过迭代器 Iterator 消费（？）。

可迭代对象，具体来讲可理解为数组或集合，这样的集合类型对象。特点：「有限元素」，「无歧义的遍历顺序」。

可迭代对象不仅可以是集合类型对象，也可以是仅仅具有类似数组行为的其他数据结构，比如文章开头的计数循环。该循环生成的值是暂时的，但循环本身在执行迭代。

任何实现 Iterable 接口的数据结构都可以被实现 Iterator 接口的结构「消费」（consume）。

**迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。**


### 可迭代协议 {#可迭代协议}

实现 Iterable 接口（可迭代协议）要求同时具备两种能力：「支持迭代的自我识别」和「创建实现 Iterator 接口的对象」。

实现了 Iterable 接口的内置类型：

-   字符串
-   数组
-   映射
-   集合
-   arguments 对象
-   NodeList 等 DOM 集合类型

问题：什么是工厂函数？

解答：它是[返回新对象的函数](/posts/js-factory-function/)。

实现可迭代协议的所有类型，都会自动兼容接收可迭代对象的任何语言特性。接收可迭代对象的原生语言特性包括：

-   for-of 循环
-   数组解构
-   扩展操作符
-   Array.form()
-   创建集合
-   创建映射
-   Promise.all() 接收由期约组成的可迭代对象
-   Promise.race() 接收由期约组成的可迭代对象
-   yield\* 操作符，在生成器中使用

这些原生语言结构会在后台调用提供的可迭代对象的这个工厂函数，从而创建一个迭代器：

```js
let arr = ["foo", "bar", "baz"];

// for...of 循环
for (let el of arr) {
    console.log(el);
}

// 数组解构
let [a, b, c] = arr;
console.log(a, b, c);

// 扩展操作符
let arr2 = [...arr];
console.log(arr2);

// Array.from()
let arr3 = Array.from(arr);
console.log(arr3);

// Set 构造函数
let set = new Set(arr);
console.log(set);

// Map 构造函数
let pairs = arr.map((x, i) => [x,, i]);
console.log(pairs);
let map = new Map(pairs);
console.log(map);
```