+++
title = "学习《网道 JavaScript 教程》"
date = 2022-02-12T00:00:00+08:00
lastmod = 2022-02-12T20:38:31+08:00
tags = ["JavaScript", "技术"]
draft = false
+++

<https://wangdoc.com/javascript/index.html>


## 基本语法 {#基本语法}


### 语句 {#语句}

以行（line）为单位执行语句（statement）。

```js
var a = 1 + 4;
```

使用 `var` 命令声明变量 `a` ，然后将 `1 + 4` 的运算结果赋值给变量 `a` 。

`1 + 4` 是表达式（expression），指一个为了得到返回值的计算式。

> 语句和表达式的区别？
>
> 前者主要进行操作，基本情况下不需要返回值；后者则需要返回值。

语句以 `;` 结尾。分号前若无内容，JS 引擎视其为空语句。


### 变量 {#变量}

变量是对值（字符串、数字等）的引用。

```js
var a = 1;
```

上述代码的运行流程：

1.  声明变量 `a` ： `var a`
2.  建立 `a` 与 1 的引用关系： `a = 1`

第 2 步的专用术语是「赋值」。 `var` 是变量声明命令。

在未赋值时，变量的初始值为 `undefined` 。

声明变量一定要使用 var/let 命令，如果声明时不使用命令，很容易因声明过多全局变量而产生混乱。

如果未声明直接使用会报错： `Uncaught ReferenceError: a is not defined` 。

JS 是动态类型语言，变量声明为一种数据类型后，可以被轻易改变为其他数据类型：

```js
var a = 1;
a = 'hello';
```

对已声明变量的二次声明，如果没有赋值则二次声明无效；若赋值变量的值得到更新。


#### 变量提升 {#变量提升}

JS 引擎的工作方式是，先解析代码，获取所有被声明的变量，然后再一行一行地运行。这样的结果就是变量提升（hoisting）。


### 标识符 {#标识符}

标识符（identifier）指的是用来识别各种值的合法名称。

最常见的是变量名和函数名。JS 的标识符对大小写敏感。

标识符命名规则：

-   第一个字符，可以是任意 Unicode 字母（包括英文字母和其他语言的字母），以及美元符号（ `$` ）和下划线（ `_` ）
-   第二个及以后的字符，除了 Unicode 字母、美元符号和下划线，还可以使用数字 `0-9`

> JS 中存在一些保留字，不能用作标识符：arguments、break、case、catch、class、const、continue、debugger、default、delete、do、else、enum、eval、export、extends、false、finally、for、function、if、implements、import、in、instanceof、interface、let、new、null、package、private、protected、public、return、static、super、switch、this、throw、true、try、typeof、var、void、while、with、yield


### 注释 {#注释}

两种，单行、多行

历史原因 JS 兼容 HTML 注释：

```js
x = 1; <!-- x = 2;
--> x = 3;
```

以上只有 `x = 1` 有意义， `-->` 只有在行首才会被识别为单行注释。


### 区块 {#区块}

JS 使用大括号（curly braces），将多个相关的语句组合在一起，称为区块（block）。

对于 `var` 命令来说，JS 区块不构成独立的作用域；而 ES6 引入的 `let` 则具备这样的特点（独立作用域）。


### 条件语句 {#条件语句}

JS 提供 `if` 结构和 `switch` 结构，完成条件判断，即只有满足预设条件，才会执行相应的语句。


#### if 结构 {#if-结构}

`if` 结构先判断一个人表达式的布尔值，然后根据布尔值的真伪，执行不同的语句。

注意， `if` 后面的表达式之中，不要混淆赋值表达式（ `=` ）、严格相等运算符（ `===` ）和相等运算符（ `==` ）。尤其是赋值表达式不具有比较作用。

错误代码：

```js
var x = 1;
var y = 2;
if (x = y) {
  console.log(x);
}
```

优先使用 `===` 。


#### if...else 结构 {#if-dot-dot-dot-else-结构}


#### switch 结构 {#switch-结构}

多个 `if...else` 连在一起使用时，可以用 `switch` 以一种更轻便的方式替代。

代码示例：

```js
switch (fruit) {
  case "banana":
    //...
    break;
  case "appple":
    //...
    break;
  default:
    //...
}
```


#### 三元运算符 ?: {#三元运算符}

```js
(条件) ? 表达式 1 : 表达式 2
```

它可以是 `if...else...` 的简写。


### 循环语句 {#循环语句}

循环语句用于重复执行某个操作。


#### while 循环 {#while-循环}

```js
while (条件)
  语句;

// 或者
while (条件) 语句;
```


#### for 循环 {#for-循环}

```js
for (初始化表达式; 条件; 递增表达式) {
  语句
}
```

-   初始化表达式（initialize）：确定循环变量的初始值，只在循环开始时执行一次
-   条件表达式（test）：每轮循环开始时，都要执行这个条件表达式，只有值为真，才继续进行循环
-   递增表达式（increment）：每轮循环的最后一个操作通常用来递增循环变量

for 循环在 JS 引擎级别是如何实现的？


#### do...while 循环 {#do-dot-dot-dot-while-循环}

与 `while` 的区别在于先运行一次循环体，然后判断循环条件。

```js
do {
  语句
} while (条件);
```

不论是 `i++` 还是 `++i` i 都是加 1，区别在于前一个表达式的结果是 i，后一个表达式的结果是 i+1。


#### break 语句和 continue 语句 {#break-语句和-continue-语句}

`break` 语句和 `continue` 语句都具有跳转作用，可以让代码不按既有的顺序执行。

`break` 语句用于跳出代码块或循环； `continue` 语句用于立刻终止本轮循环，返回循环结构的头部，开始下一轮循环。


#### 标签（label） {#标签-label}

JS 语言允许，语句的前面有标签（label），相当于定位符，用于跳转到程序的任意位置，标签格式如下：

```js
label:
  语句
```

标签可以是任意标识符，但不能是保留字，语句部分可以是任意语句。

标签通常与 `break` 语句和 `continue` 语句配合使用，跳出特定的循环。也可用于跳出代码块。


## 数据类型 {#数据类型}