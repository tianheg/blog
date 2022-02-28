+++
title = "学习《网道 JavaScript 教程》"
date = 2022-02-12T00:00:00+08:00
lastmod = 2022-02-28T16:10:28+08:00
tags = ["JavaScript", "技术"]
draft = false
mathjax = true
toc = true
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

对已声明变量的二次声明，如果没有赋值则二次声明无效；若赋值则变量的值得到更新。


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

JS 有 7 种数据类型：

-   数值（number）
-   字符串（string）
-   布尔值（boolean）
-   `undefined`
-   `null`
-   对象（object）
-   Symbol（ES6 引入）

以上列出的 7 种，前三种是原始类型（primitive type）的值，是最基本的数据类型。对象被称为合成类型（complex type）的值，因为一个对象往往是多个原始类型的值的合成，可以看作是一个存放各种值的容器。 `undefined` 和 `null` 是两个特殊值。Symbol 的存在是为了解决属性名冲突。

对象又可以分成三个子类型：

-   狭义的对象（object）
-   数组（array）
-   函数（function）

狭义的对象和数组是两种不同的数据组合方式。函数是处理数据的方法，JS 视其为一种数据类型，可以赋值给变量。

> 函数被视为一种数据类型，能够赋值给变量这件事，为编程带来很大的灵活性，也为 JS 的函数式编程奠定基础。


### typeof 运算符 {#typeof-运算符}

JS 有三种方法，可以确定一个值到底是什么类型。

-   `typeof` 运算符
-   `instanceof` 运算符
-   `Object.prototype.toString` 方法

`null` 的类型是 `object` 。是历史原因，JS 最初的设计没考虑 `null` 只是把它作为 `object` 的一种特殊值。后来 `null` 独立出来，作为一种单独的数据类型，为了兼容以前的代码， `typeof null` 返回 `object` 就没法改变了。


### null,undefined 和布尔值 {#null-undefined-和布尔值}

`null` 与 `undefined` 相似，都表示“不存在”。

存在它们的历史原因：

> 1995 年 JavaScript 诞生时，最初像 Java 一样，只设置了 `null` 表示"无"。根据 C 语言的传统， `null` 可以自动转为 `0` 。
>
> 但是，JavaScript 的设计者 Brendan Eich，觉得这样做还不够。首先，第一版的 JavaScript 里面， `null` 就像在 Java 里一样，被当成一个对象，Brendan Eich 觉得表示“无”的值最好不是对象。其次，那时的 JavaScript 不包括错误处理机制，Brendan Eich 觉得，如果 `null` 自动转为 0，很不容易发现错误。
>
> 因此，他又设计了一个 `undefined` 。区别是这样的： `null` 是一个表示“空”的对象，转为数值时为 `0` ； `undefined` 是一个表示"此处无定义"的原始值，转为数值时为 `NaN` 。

理解 `null` 和 `undefined` ：

`null` 表示空值，即该处的值现在为空。调用函数时，某个参数未设置任何值，这时就可以传入 `null` ，表示该参数为空。比如，某个函数接受引擎抛出的错误作为参数，如果运行过程中未出错，那么这个参数就会传入 `null` ，表示未发生错误。

`undefined` 表示“未定义”，典型场景：

```js
// 变量声明了，但没有赋值
var i;
console.log(i); // undefined

// 调用函数时，应该提供的参数没有提供，该参数等于 undefined
function f(x) {
  return x;
}
console.log(f()); // undefined

// 对象没有赋值的属性
var o = new Object();
console.log(o.p); // undefined
```

布尔值代表“真”（ `true` ）和“假”（ `false` ）两个状态。

下列运算符返回布尔值：

-   前置逻辑运算符： `!` （Not）
-   相等运算符： `===` ， `!==` ， `==` ， `!=`
-   比较运算符： `>` ， `>=` ， `<` ， `<=`

JS 会将结果是布尔值但不是布尔值的位置，自动转换为布尔值。转换规则：除去以下六个值被转为 `false` ，其他值都视为 `true` 。

-   `undefined`
-   `null`
-   `false`
-   `0`
-   `NaN`
-   `""` 或 `''` （空字符串）


### 数值 {#数值}


#### 整数和浮点数 {#整数和浮点数}

JS 内部，所有数字都是以 64 位浮点数形式储存，即使整数也是如此。

```js
1 === 1.0 // true
```

这也说明：JS 语言的底层没有整数，所有数字都是小数（64 位浮点数）。容易造成混淆的是 **某些运算只有整数才能完成，此时 JS 会自动把 64 位浮点数，转成 32 整数，然后再进行运算。**

浮点数不是精确的值，所以会出现以下情况：

```js
0.1 + 0.2 === 0.3
// false

0.3 / 0.1
// 2.9999999999999996
```


#### 数值精度 {#数值精度}

根据国际标准 IEEE754，JS 浮点数的 64 个二进制位，从左边开始，是这样组成的：

-   第 1 位：符号位， `0` 表示正数， `1` 表示负数
-   第 2 位到第 12 位（共 11 位）：指数部分
-   第 13 位到第 64 位（共 52 位）：小数部分（即有效数字）

符号位决定了一个数的正负，指数部分决定了数值的大小，小数部分决定了数值的精度。

指数部分一共有 11 个二进制位，因此大小范围就是 0 到 2047。IEEE754 规定，如果指数部分的值在 0 到 2047 之间（不含两个端点），那么有效数字的第一位默认总是 1，不保存在 64 位浮点数中。也就是说，有效数字这时总是 `1.xx...xx` 形式，其中 `xx...xx` 的部分保存在 64 位浮点数中，最长可能为 52 位。因此 JS 提供的有效数字最长为 53 个二进制位。

```js
(-1)^符号位 * 1.xx...xx * 2^指数部分
```

上面公式是正常情况下（指数部分在 0 到 2047 之间），一个数在 JS 内部实际的表示形式。

精度最多只能到 53 个二进制位，这意味着，绝对值小于 2 的 53 次方的整数，即 \\(-2^{53}\\) 到 \\(2^{53}\\) ，都可以精确表示。

```js
Math.pow(2, 53)
// 9007199254740992

Math.pow(2, 53) + 1
// 9007199254740992

Math.pow(2, 53) + 2
// 9007199254740994

Math.pow(2, 53) + 3
// 9007199254740996

Math.pow(2, 53) + 4
// 9007199254740996
```

由于 \\(2^{53}\\) 是一个 16 位的十进制数值，所以简单来说，JS 对 15 位的十进制数都可以精确处理。


#### 数值范围 {#数值范围}

根据标准，64 位浮点数的指数部分的长度是 11 个二进制位，意味着指数部分的最大值是 2047（ \\(2^{11}\\) -1）。也就是说，64 位浮点数的指数部分的值最大为 2047，分出一半表示负数，则 JS 能够表示的数值范围为 \\(2^{1024}\\) 到 \\(2^{-1024}\\) （开区间），超出这个范围的数无法表示。

当 JS 因为某个正数过大而无法表示时，会返回 `Infinity` ；因为某个负数过小时，会返回 0。

JavaScript 提供 `Number` 对象的 `MAX_VALUE` 和 `MIN_VALUE` 属性，返回可以表示的具体的最大值和最小值。

```js
Number.MAX_VALUE // 1.7976931348623157e+308
Number.MIN_VALUE // 5e-324
```


#### 数值表示法 {#数值表示法}

-   字面形式：十进制(1432)、八进制(074)、十六进制（0xff）
-   科学记数法：123e3、123e-3、-3.1e+12

JS 自动将数值转为科学记数法的两种情况：

-   小数点前的数字多于 21 位
-   小数点后的零多于 5 个


#### 数值的进制 {#数值的进制}

使用字面量（literal）直接表示一个数值时，JS 对整数提供四种进制的表示方法：

-   十进制：没有前导 0 的数值
-   八进制：有前缀 `0o` 或 `00` 的数值，或者有前导 0、且只用到 0-7 八个阿拉伯数字的数值
-   十六进制：有前缀 `0x` 或 `0X` 的数值
-   二进制：有前缀 `0b` 或 `0B` 的数值

默认情况下，JS 内部会自动将八进制、十六进制、二进制转为十进制。如果八进制、十六进制、二进制中出现不属于该进制的数字，就会报错。

前到一般情况下，有前导 0 的数值会被视为八进制，但如果前导 0 后面有数字 `8` 和 `9` ，则该数值被视为十进制。

前导 0 表示八进制，处理时很容易造成混乱。ES5 的严格模式和 ES6，已经废除了这种表示法，但是浏览器为了兼容以前的代码，目前还继续支持这种表示法。


#### 特殊数值 {#特殊数值}

一、 `+0` ， `-0`

除了用作分母时，返回值不同外， `+0` 和 `-0` 在其他情况下使用时可以等效。

上面的代码之所以出现这样结果，是因为除以正零得到 `+Infinity` ，除以负零得到 `-Infinity` ，这两者是不相等的。

二、NaN

`NaN` 是 JS 的特殊值，表示非数字（Not a Number）。主要出现在将字符串解析成数字出错的场合。

```js
2 - 'x' // NaN
```

上述代码运行时，会自动将字符串 `x` 转为数值，但是由于 `x` 不是数值，所以最后得到结果 `NaN` 。

另外，一些数学函数的运算结果会出现 `NaN` 。

```js
Math.acos(2) // NaN
Math.log(-1) // NaN
Math.sqrt(-1) // NaN
```

还有

```js
0 / 0 // NaN
```

需要注意的是， `NaN` 不是独立的数据类型，而是一个特殊数值，它的数据类型依然属于 `Number` ，使用 `typeof` 运算符可以看得很清楚。

```js
typeof NaN // "number"
```

NaN 的运算规则

`NaN` 不等于任何值，包括它自身。

数组的 `indexOf` 方法内部使用的是严格相等操作符，所以该方法对 `NaN` 不成立。

`NaN` 在布尔运算时被当作 `false` 。

`NaN` 与任何数（包括它自己）的运算，得到的都是 `NaN` 。

三、Infinity

`Infinity` 表示“无穷”，用来表示两种场景。一种是一个正的数值太大，或一个负的数值太小，无法表示；另一种是非 0 数值除以 0，得到 `Infinity` 。

由于数值正向溢出（overflow）、负向溢出（underflow）和被 `0` 除，JavaScript 都不报错，所以单纯的数学运算几乎没有可能抛出错误。

`Infinity` 的运算规则

```js
5 * Infinity // Infinity
5 - Infinity // -Infinity
Infinity / 5 // Infinity
5 / Infinity // 0
```

```js
0 * Infinity // NaN
0 / Infinity // 0
Infinity / 0 // Infinity
```

```js
Infinity - Infinity // NaN
```

Infinity 与 null 计算时，null 会转成 0，等同于与 0 的计算。

Infinity 与 undefined 计算，返回的都是 NaN。


#### 与数值相关的全局方法 {#与数值相关的全局方法}

-   `parseInt()` 字符串-&gt;整数/NaN
-   `parseFloat()` 字符串-&gt;浮点数
-   `isNaN()` 判断一个值是否是 NaN
-   `isFinite()` 返回布尔值，表示某个值是否为正常的数值

parseInt 会把字符串中是科学记数法形式的数字，当成普通字符串看待，也就是说： `e` 是字符而不是数字 10。

parseInt 接受第二个参数进行进制转换。参数取值为[2, 36]。

parseInt 第一个参数不是字符串，会被先转为字符串，再运算。注意：第一个参数是八进制数字的情况。

> JavaScript 不再允许将带有前缀 0 的数字视为八进制数，而是要求忽略这个 0。但是，为了保证兼容性，大部分浏览器并没有部署这一条规定。

parseFloat 会把空字符串转为 NaN。与 Number 函数有所不同。

isNaN 为 true 时，可能是字符串 / NaN。出于同样的原因，对象和数组，isNaN 也返回 true。但，空数组和只有一个数值元素的数组，isNaN 返回 false。原因是这些数组能够被 Number 函数转成数值。因此，使用 isNaN 之前要判断数据类型：

```js
function myIsNaN(value) {
  return typeof value === 'number' && isNaN(value);
}
myIsNaN()
```

判断 NaN 更可靠的方法，利用 NaN 是唯一不等于自身的值的这个特点：

```js
function myIsNaN(value) {
  return value !== value;
}
myIsNaN(NaN)
```

> 除了 Infinity、-Infinity、NaN 和 undefined 这几个值会返回 false，isFinite 对于其他的数值都会返回 true。


### 字符串 {#字符串}


#### 字符串定义 {#字符串定义}

> 由于 HTML 语言的属性值使用双引号，所以很多项目约定 JavaScript 语言的字符串只使用单引号。

字符串默认只能写在一行内，分成多行将会报错。如果长字符串必须分成多行，可以在每一行的尾部使用反斜杠。但是，输出的时候还是单行。注意，反斜杠的后面必须是换行符，而不能有其他字符（比如空格），否则会报错。连接运算符（+）可以连接多个单行字符串，将长字符串拆成多行书写，输出的时候也是单行。

如果想输出多行字符串，有一种利用多行注释的变通方法：

```js
(function () { /*
line 1
line 2
line 3
*/}).toString().split('\n').slice(1,-1).join('\n')
```


#### 转义 {#转义}

需要用反斜杠转义的特殊字符，主要有下面这些。

-   `\0` ：null（ `\u0000` ）
-   `\b` ：后退键（ `\u0008` ）
-   `\f` ：换页符（ `\u000C` ）
-   `\n` ：换行符（ `\u000A` ）
-   `\r` ：回车键（ `\u000D` ）
-   `\t` ：制表符（ `\u0009` ）
-   `\v` ：垂直制表符（ `\u000B` ）
-   `\'` ：单引号（ `\u0027` ）
-   `\"` ：双引号（ `\u0022` ）
-   `\\` ：反斜杠（ `\u005C` ）

反斜杠还有三种特殊用法。

（1） `\HHH`

反斜杠后面紧跟三个八进制数（ `000` 到 `377` ），代表一个字符。 `HHH` 对应该字符的 Unicode 码点，比如 `\251` 表示版权符号。显然，这种方法只能输出 256 种字符。

（2） `\xHH`

`\x` 后面紧跟两个十六进制数（ `00` 到 `FF` ），代表一个字符。 `HH` 对应该字符的 Unicode 码点，比如 `\xA9` 表示版权符号。这种方法也只能输出 256 种字符。

（3） `\uXXXX`

`\u` 后面紧跟四个十六进制数（ `0000` 到 `FFFF` ），代表一个字符。 `XXXX` 对应该字符的 Unicode 码点，比如 `\u00A9` 表示版权符号。

如果在非特殊字符前面使用反斜杠，则反斜杠会被省略。

如果字符串的正常内容之中，需要包含反斜杠，则反斜杠前面需要再加一个反斜杠，用来对自身转义。


#### 字符串与数组 {#字符串与数组}

字符串可以被视为字符数组，因此可以使用数组的方括号运算符，用来返回某个位置的字符（位置编号从 0 开始）。

如果方括号中的数字超过字符串的长度，或者方括号中根本不是数字，则返回 undefined。

但是，字符串与数组的相似性仅此而已。实际上，无法改变字符串之中的单个字符。


#### length 属性 {#length-属性}

同样无法改变


#### 字符集 {#字符集}

JS 使用 Unicode 字符集，JS 引擎内部，所有字符都用 Unicode 表示。

还能在 JS 中使用 Unicode 码点表示字符。

每个字符在 JS 内部都是以 16 位（即两个字节）的 UTF-16 格式存储。换句话说，JS 的单位字符长度固定为 16 位长度，即 2 个字节。

但是，UTF-16 有两种长度：对于码点在 `U+0000` 到 `U+FFFF` 之间的字符，长度为 16 位（即 2 个字节）；对于码点在 `U+10000` 到 `U+10FFFF` 之间的字符，长度为 32 位（即 4 个字节），而且前两个字节在 `0xD800` 到 `0xDBFF` 之间，后两个字节在 `0xDC00` 到 `0xDFFF` 之间。

JS 对 UTF-16 的支持并不完整。历史遗留问题，导致 JS 无法识别超出 2 字节的 Unicode 字符。这就导致：对于码点在 `U+10000` 到 `U+10FFFF` 之间的字符，JS 总是认为它们是两个字符（ `length` 属性为 2）。因此，在涉及到字符串长度问题时要小心，可能 JS 返回的字符串长度不是字符串的长度。


#### Base64 转码 {#base64-转码}

当文本包含一些不可打印的符号时，需要通过 Base64 转码，将它们转换成可打印字符，让其可打印。

另一个使用场景：以文本格式传递二进制数据。

Base64 是一种编码方法。可以将任意值转成 0~9、A~Z、a~z、 `+` 和 `/` 这 64 个字符组成的可打印字符。产生这种编码方法的主要目的不是为了加密，而是为了不出现特殊字符，简化程序的处理。

JS 原生提供两个 Base64 相关的方法。

-   `btoa()` ：任意值转为 Base64 编码
-   `atob()` ：Base64 编码转为原来的值

注意，这两种方法不支持非 ASCII 字符。

要将非 ASCII 码字符转为 Base64 编码，必须中间插入一个转码环节，在使用这个方法。

```js
function b64Encode(str) {
  return btoa(encodeURIComponent(str));
}
b64Encode('你好，世界')
function b64Decode(str) {
  return decodeURIComponent(atob(str));
}
b64Decode('JUU0JUJEJUEwJUU1JUE1JUJEJUVGJUJDJThDJUU0JUI4JTk2JUU3JTk1JThD')
```


### 对象 {#对象}

对象，是键值对的集合。

对象的所有键名都是字符串/Symbol。键名也称为属性。键值可以是任何数据类型，如果值为函数，可以把该属性称为方法。想到 Vue 的一些代码。

属性可以在任何时刻创建。


#### 对象的引用 {#对象的引用}

不同的变量名指向同一个对象，它们都是该对象的引用，指向同一个内存地址。

这种类型的引用仅限于对象。如果变量引用原始数据类型，附加的变量只是初始变量的拷贝。


#### 表达式还是语句？ {#表达式还是语句}

```js
{ foo:123 }
```

JS 引擎认为所有开头有大括号的语句都是代码块。如果想表示对象，需要这样：

```js
({ foo: 123})
```


#### 属性的操作 {#属性的操作}

读、写、删除

读： `.` / `[]`

方括号内部可使用表达式

数字会自动转为字符串，数字属性不能使用 `.` 获取属性值。

写：直接对属性赋新值

查看对象所有属性： `Object.keys` 。

删除：delete

删除返回 true 并不能确定被删除属性存在。

返回 false 说明该属性不可删除。

delete 只能删除对象的本身属性，不能删除继承属性。

属性是否存在？ `in`

属性遍历：for...in

对象属性的可遍历性。

with 语句会产生全局变量，最好不用。


### 函数 {#函数}


#### 函数声明 {#函数声明}

（1）function

（2）函数表达式

（3） `Function` 构造函数


#### 函数的重复声明 {#函数的重复声明}

如果同一个函数被多次声明，后面的声明就会覆盖前面的声明。

```js
function f() {
  console.log(1)
}
f() // 2

function f() {
  console.log(2)
}
f() // 2
```

函数名提升


#### 圆括号运算符、return 语句和递归 {#圆括号运算符-return-语句和递归}

函数调用自身即是递归（recursion）。


#### 第一等公民 {#第一等公民}

凡是能使用值的地方，都能使用函数。

```js
function add(x,y) {
  return x + y;
}
var op = add;

function a(op) {
  return op;
}
a(op)(1,1)
```

最后一行为什么这样写也可以？正常写法不应该是 `a(op(1,1))` 吗？


#### 函数名提升 {#函数名提升}

JavaScript 引擎将函数名视同变量名，所以采用 function 命令声明函数时，整个函数会像变量声明一样，被提升到代码头部。


#### 函数的属性和方法 {#函数的属性和方法}

（1）name

返回函数名/变量名

（2）length

返回传入参数个数

（3）toString()

返回函数源码字符串

对于那些原生的函数，toString()方法返回 `function (){[native code]}` 。

函数内部的注释也会返回。可以利用这一点实现多行字符串。

```js
var multiline = function (fn) {
  var arr = fn.toString().split('\n')
  return arr.slice(1, arr.length - 1).join('\n')
}

function f() {
  /*
  这是一个
  多行注释*/
}
multiline(f)
```


#### 函数作用域 {#函数作用域}

作用域（scope）指变量存在的范围。在 ES5 规范中，JS 只有两种作用域：全局作用域和函数作用域；ES6 引入块级作用域。

函数自身也是一个作用域。

函数执行时所在的作用域，是定义时的作用域，而不是调用时所在的作用域。

很容易犯错的一点是，如果函数 A 调用函数 B，却没考虑到函数 B 不会引用函数 A 的内部变量。

函数体内部声明的函数，作用域绑定函数体内部。


#### 参数 {#参数}

参数可省略。

参数传递方式：

-   按值传递（值是原始类型）
-   按址传递（值是复合类型）

同名参数

arguments 对象可以读取函数传入的参数。需要注意的是，虽然 arguments 很像数组，但它是一个对象。数组专有的方法（比如 slice 和 forEach），不能在 arguments 对象上直接使用。arguments 对象带有一个 callee 属性，返回它所对应的原函数。


#### 闭包 {#闭包}

```js
function f1() {
  var n = 999;
  function f2() {
    console.log(n);
  }
  return f2;
}

var result = f1();
result(); // 999
```

上面代码中，函数 f2 就在函数 f1 内部，这时 f1 内部的所有局部变量，对 f2 都是可见的。但是反过来就不行，f2 内部的局部变量，对 f1 就是不可见的。这就是 JavaScript 语言特有的"链式作用域"结构（chain scope），子对象会一级一级地向上寻找所有父对象的变量。所以，父对象的所有变量，对子对象都是可见的，反之则不成立。

闭包就是函数 f2，即能够读取其他函数内部变量的函数。

```js
function createIncrementor(start) {
  return function () {
    return start++;
  }
}

var inc = createIncrementor(4)
inc()
inc()
```

为什么闭包能够返回外层函数的内部变量？原因是闭包（上例的 inc）用到了外层变量（start），导致外层函数（createIncrementor）不能从内存释放。只要闭包没有被垃圾回收机制清除，外层函数提供的运行环境也不会被清除，它的内部变量就始终保存着当前值，供闭包读取。

闭包的最大用处有两个，一个是可以读取外层函数内部的变量，另一个就是让这些变量始终保持在内存中，即闭包可以使得它诞生环境一直存在。

闭包的另一个用处，是封装对象的私有属性和私有方法。

```js
function Person(name) {
  var _age;
  function setAge(n) {
    _age = n;
  }
  function getAge() {
    return _age;
  }
  return {
    name: name,
    getAge: getAge,
    setAge: setAge
  }
}

var p1 = Person('Jim')
p1.setAge(23)
p1.getAge()
p1
```

注意，外层函数每次运行，都会生成一个新的闭包，而这个闭包又会保留外层函数的内部变量，所以内存消耗很大。因此不能滥用闭包，否则会造成网页的性能问题。


#### 立即调用的函数表达式 {#立即调用的函数表达式}

Immediately-Invoked Function Expression

```js
var f = function () { return 1 }() // 或者这样写 (function f() {return 1}) 或者 (function f() {return 1}()) 或者 (function f() {return 1})()
f
```

通常情况下，只对匿名函数使用这种“立即执行的函数表达式”。它的目的有两个：一是不必为函数命名，避免了污染全局变量；二是 IIFE 内部形成了一个单独的作用域，可以封装一些外部无法读取的私有变量。

```js
// 写法1
var tmp = newData;
processData(tmp);
storeData(tmp)

// 写法2
(function () {
  var tmp = newData;
  processData(tmp);
  storeData(tmp);
}())
```

上面代码中，写法二比写法一更好，因为完全避免了污染全局变量。


#### eval {#eval}

eval 命令接受一个字符串作为参数，并将这个字符串当作语句执行。

如果参数非字符串，原样返回。

eval 没有自己的作用域，都在当前作用域内执行，因此可能会修改当前作用域的变量的值，造成安全问题。由于这个原因，eval 有安全风险。为了防止这种风险，JavaScript 规定，如果使用严格模式，eval 内部声明的变量，不会影响到外部作用域。不过，即使在严格模式下，eval 依然可以读写当前作用域的变量。

总之，eval 的本质是在当前作用域之中，注入代码。由于安全风险和不利于 JavaScript 引擎优化执行速度，一般不推荐使用。通常情况下，eval 最常见的场合是解析 JSON 数据的字符串，不过正确的做法应该是使用原生的 JSON.parse 方法。

eval 的别名调用

```js
var m = eval;
m('var x = 1')
x
```

为了保证 eval 的别名不影响代码优化，JavaScript 的标准规定，凡是使用别名执行 eval，eval 内部一律是全局作用域。

---
参考资料

1.  John Dalziel, [The race for speed part 4: The future for JavaScript](http://creativejs.com/2013/06/the-race-for-speed-part-4-the-future-for-javascript/) | [The race for speed part 2: How JavaScript compilers work](http://creativejs.com/2013/06/the-race-for-speed-part-2-how-javascript-compilers-work/)
2.  <http://kangax.github.io/compat-table/es6/> JS 标准兼容性表
3.  Dr. Axel Rauschmayer, [Basic JavaScript for the impatient programmer](https://2ality.com/2013/06/basic-javascript.html) | [Basic JavaScript for the impatient programmer](https://2ality.com/2013/06/basic-javascript.html) | [Improving the JavaScript typeof operator](https://2ality.com/2011/11/improving-typeof.html) | [Categorizing values in JavaScript](https://2ality.com/2013/01/categorizing-values.html) | [How numbers are encoded in JavaScript](https://2ality.com/2012/04/number-encoding.html) | [Object properties in JavaScript](https://2ality.com/2012/10/javascript-properties.html) | [JavaScript’s with statement and why it’s deprecated](https://2ality.com/2011/06/with-statement.html) | [Evaluating JavaScript code via eval() and new Function()](https://2ality.com/2014/01/eval.html) | [Arrays in JavaScript](https://2ality.com/2012/12/arrays.html) | [JavaScript: sparse arrays vs. dense arrays](https://2ality.com/2012/06/dense-arrays.html) | [What is {} + {} in JavaScript?](https://2ality.com/2012/01/object-plus-object.html) | [JavaScript quirk 1: implicit conversion of values](https://2ality.com/2013/04/quirk-implicit-conversion.html) | [A meta style guide for JavaScript](https://2ality.com/2013/07/meta-style-guide.html) | [Automatic semicolon insertion in JavaScript](https://2ality.com/2011/05/semicolon-insertion.html) | [What JavaScript would be like with significant newlines](https://2ality.com/2011/11/significant-newlines.html) | [The JavaScript console API](https://2ality.com/2013/10/console-api.html) | [Protecting objects in JavaScript](https://2ality.com/2013/08/protecting-objects.html) | [JavaScript: an overview of the regular expression API](https://2ality.com/2011/04/javascript-overview-of-regular.html) | [The flag /g of JavaScript’s regular expressions](https://2ality.com/2013/08/regexp-g.html) | [JavaScript’s JSON API](https://2ality.com/2011/08/json-api.html) | [JavaScript’s this: how it works, where it can trip you up](https://2ality.com/2014/05/this.html) | [JavaScript properties: inheritance and enumerability](https://2ality.com/2011/07/js-properties.html) | [JavaScript: Why the hatred for strict mode?](https://2ality.com/2011/10/strict-mode-hatred.html) | [JavaScript’s strict mode: a summary](https://2ality.com/2011/01/javascripts-strict-mode-summary.html) | [ECMAScript 6 promises (1/2): foundations](https://2ality.com/2014/09/es6-promises-foundations.html) | [Speaking JavaScript](http://speakingjs.com/es5/index.html)(ES5) | [Exploring JS: JavaScript books for programmers](https://exploringjs.com/)(ES6 and other versions): The Past, Present, and Future of JavaScript
4.  [Happy 18th Birthday JavaScript! A look at an unlikely past and bright future.](https://www.balena.io/blog/happy-18th-birthday-javascript/)
5.  Humphry, [JavaScript中Number的一些表示上/下限](https://segmentfault.com/a/1190000000407658)
6.  Mathias Bynens, [JavaScript’s internal character encoding: UCS-2 or UTF-16?](https://mathiasbynens.be/notes/javascript-encoding) | [JavaScript has a Unicode problem](https://mathiasbynens.be/notes/javascript-unicode)
7.  MDN Web Docs, [btoa()](https://developer.mozilla.org/en-US/docs/Web/API/btoa) | [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) | [Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators) | [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) | [Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) | [setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout) | [Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) | [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) | [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) | [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) | [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) | [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
8.  Lakshan Perera, [Revisiting JavaScript Objects](https://www.laktek.com/2012/12/29/revisiting-javascript-objects/)
9.  Angus Croll, [The Secret Life of JavaScript Primitives](https://javascriptweblog.wordpress.com/2010/09/27/the-secret-life-of-javascript-primitives/)
10. Ben Alman, [Immediately-Invoked Function Expression (IIFE)](https://benalman.com/news/2010/11/immediately-invoked-function-expression/)
11. Mark Daggett, [Functions Explained](https://web.archive.org/web/20160911170816/http://markdaggett.com/blog/2013/02/15/functions-explained)
12. Juriy Zaytsev, [Named function expressions demystified](https://kangax.github.io/nfe/) | [Global eval. What are the options?](http://perfectionkills.com/global-eval-what-are-the-options/) | [How ECMAScript 5 still does not allow to subclass array](http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/) | [Understanding delete](http://perfectionkills.com/understanding-delete/)
13. Marco Rogers polotek, [What is the arguments object?](https://web.archive.org/web/20160322233747/http://docs.nodejitsu.com:80/articles/javascript-conventions/what-is-the-arguments-object)
14. Felix Bohm, [What They Didn't Tell You About ES5's Array Extras](https://code.tutsplus.com/tutorials/what-they-didnt-tell-you-about-es5s-array-extras--net-28263)
15. Michal Budzynski, [JavaScript: The less known parts. Bitwise Operators.](https://michalbe.blogspot.com/2013/03/javascript-less-known-parts-bitwise.html) | [JavaScript: The less known parts. DOM Mutations.](https://michalbe.blogspot.com/2013/04/javascript-less-known-parts-dom.html)
16. Benjie Gillam, [Quantum JavaScript?](http://www.benjiegillam.com/2013/06/quantum-javascript/)
17. Jani Hartikainen, [JavaScript Errors and How to Fix Them](https://davidwalsh.name/fix-javascript-errors)
18. Eric Elliott, Programming JavaScript Applications, Chapter 2. JavaScript Style Guide, O'Reilly, 2014
19. Rod Vagg, [Semicolons, Objectively](https://web.archive.org/web/20170517132624/http://dailyjs.com/post/semicolons)
20. [Chrome Devtools](https://developer.chrome.com/docs/devtools/) | [Console Utilities API reference](https://developer.chrome.com/docs/devtools/console/utilities/)
21. Matt West, [Mastering The Developer Tools Console](https://blog.teamtreehouse.com/mastering-developer-tools-console)
22. [Firefox Devtools - Console API](https://developer.mozilla.org/en-US/docs/Web/API/console)
23. Marius Schulz, [Advanced JavaScript Debugging with console.table()](https://mariusschulz.com/blog/advanced-javascript-debugging-with-console-table)
24. Jon Bretman, [Type Checking in JavaScript](https://web.archive.org/web/20201112014755/https://badoo.com/techblog/blog/2013/11/01/type-checking-in-javascript/)
25. Cody Lindley, [Thinking About ECMAScript 5 Parts](https://web.archive.org/web/20150424141701/http://tech.pro:80/tutorial/1671/thinking-about-ecmascript-5-parts)
26. Bjorn Tipling, [Advanced objects in JavaScript](https://web.archive.org/web/20140828092110/http://bjorn.tipling.com/advanced-objects-in-javascript)
27. Javier Márquez, [Javascript properties are enumerable, writable and configurable](http://arqex.com/967/javascript-properties-enumerable-writable-configurable)
28. Sella Rafaeli, [Native JavaScript Data-Binding](https://www.sellarafaeli.com/blog/native_javascript_data_binding)
29. Lea Verou, [Copying object properties, the robust way](https://lea.verou.me/2015/08/copying-properties-the-robust-way/)
30. Nicolas Bevacqua, [Fun with JavaScript Native Array Functions](https://web.archive.org/web/20131130130119/http://flippinawesome.org/2013/11/25/fun-with-javascript-native-array-functions/)
31. Ariya Hidayat, [JavaScript String: substring, substr, slice](https://ariya.io/2014/02/javascript-string-substring-substr-slice)
32. Rakhitha Nimesh, [JavaScript Date Object: The Beginner’s Guide to JavaScript Date and Time](https://www.sitepoint.com/beginners-guide-to-javascript-date-and-time/)
33. [Date and time - javascript.info](https://javascript.info/date)
34. Sam Hughes, [Learn regular expressions in about 55 minutes](https://qntm.org/re_en)
35. Jim Cowart, [What You Might Not Know About JSON.stringify()](https://web.archive.org/web/20130201093823/http://freshbrewedcode.com/jimcowart/2013/01/29/what-you-might-not-know-about-json-stringify/)
36. Marco Rogers, [What is JSON?](https://web.archive.org/web/20110925123121/http://docs.nodejitsu.com/articles/javascript-conventions/what-is-json)
37. Jonathan Creamer, [Avoiding the "this" problem in JavaScript](https://web.archive.org/web/20130406213730/http://tech.pro/tutorial/1192/avoiding-the-this-problem-in-javascript)
38. Erik Kronberg, [Bind, Call and Apply in JavaScript](https://web.archive.org/web/20131113145406/https://variadic.me/posts/2013-10-22-bind-call-and-apply-in-javascript.html)
39. [JavaScript Modules: A Beginner’s Guide](https://www.freecodecamp.org/news/javascript-modules-a-beginner-s-guide-783f7d7a5fcc)
40. Douglas Crockford, [Strict Mode Is Coming To Town](https://web.archive.org/web/20101216151915/http://www.yuiblog.com/blog/2010/12/14/strict-mode-is-coming-to-town/)
41. Sebastian Porto, [Asynchronous JS: Callbacks, Listeners, Control Flow Libs and Promises](https://sporto.github.io/blog/2012/12/09/callbacks-listeners-promises/)
42. Rhys Brett-Bowen, [Promises/A+ - understanding the spec through implementation](https://modernjavascript.blogspot.com/2013/08/promisesa-understanding-by-doing.html)
43. Marc Harter, [Promise A+ Implementation](https://gist.github.com//wavded/5692344)
44. Matt Podwysocki, Amanda Silver, [Asynchronous Programming in JavaScript with “Promises”](https://web.archive.org/web/20110923162652/http://blogs.msdn.com/b/ie/archive/2011/09/11/asynchronous-programming-in-javascript-with-promises.aspx)
45. Bryan Klimt, [What’s so great about JavaScript Promises?](https://web.archive.org/web/20130203032915/http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/)
46. Jake Archibald, [JavaScript Promises: an introduction](https://web.dev/promises/)
47. Mikito Takada, [Control flow](http://book.mixu.net/node/ch7.html)
48. Craig Buckler, [How to Translate from DOM to SVG Coordinates and Back Again](https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/)
49. Paul Kinlan, [Detect DOM changes with Mutation Observers](https://developers.google.com/web/updates/2012/02/Detect-DOM-changes-with-Mutation-Observers)
50. Tiffany Brown, [Getting to Know Mutation Observers](https://dev.opera.com/articles/mutation-observers-tutorial/)
51. Jeff Griffiths, [DOM MutationObserver – reacting to DOM changes without killing browser performance.](https://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/)
52. Addy Osmani, [Detect, Undo And Redo DOM Changes With Mutation Observers](https://addyosmani.com/blog/mutation-observers/)
53. Ryan Morr, [Using Mutation Observers to Watch for Element Availability](http://ryanmorr.com/using-mutation-observers-to-watch-for-element-availability/)
54. Jake Archibald, [Deep dive into the murky waters of script loading](https://www.html5rocks.com/en/tutorials/speed/script-loading/)
55. Remy Sharp, [Throttling function calls](https://remysharp.com/2010/07/21/throttling-function-calls/)
56. Ayman Farhat, [An alternative to Javascript's evil setInterval](https://www.thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/)
57. Ilya Grigorik, [Script-injected "async scripts" considered harmful](https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/)
58. Daniel Imms, [async vs defer attributes](https://www.growingwiththeweb.com/2014/02/async-vs-defer-attributes.html)
59. Craig Buckler, [Load Non-blocking JavaScript with HTML5 Async and Defer](https://www.sitepoint.com/non-blocking-async-defer/)
60. Domenico De Felice, [How browsers work](https://domenicodefelice.blogspot.com/2015/08/how-browsers-work.html)
61. [Using the Same-Site Cookie Attribute to Prevent CSRF Attacks](https://www.netsparker.com/blog/web-security/same-site-cookie-attribute-prevent-cross-site-request-forgery/)
62. [SameSite cookies explained](https://web.dev/samesite-cookies-explained/)
63. [Tough Cookies](https://scotthelme.co.uk/tough-cookies/)
64. [Cross-Site Request Forgery is dead!](https://scotthelme.co.uk/csrf-is-dead/)
65. Jakub Jankiewicz, [Cross-Domain LocalStorage](https://jcubic.wordpress.com/2014/06/20/cross-domain-localstorage/)
66. David Baron, [setTimeout with a shorter delay](https://dbaron.org/log/20100309-faster-timeouts)
67. Monsur Hossain, [Cross-Origin Resource Sharing (CORS)](https://web.dev/cross-origin-resource-sharing/)
68. <https://frontendian.co/cors>
69. Grzegorz Mirek, [Do You Really Know CORS?](https://web.archive.org/web/20180929153256/http://performantcode.com/web/do-you-really-know-cors)
70. [Introducing the HTML5 storage APIs](https://web.archive.org/web/20111011045651/http://www.adobe.com/devnet/html5/articles/html5-storage-apis.html)
71. [Getting Started with LocalStorage](https://web.archive.org/web/20130105051751/http://codular.com/localstorage)
72. [Introducing the HTML5 Hard Disk Filler™ API](https://feross.org/fill-disk/)
73. [Inter-window messaging using localStorage](https://web.archive.org/web/20130311215851/http://bens.me.uk/2013/localstorage-inter-window-messaging)
74. [Why does Internet Explorer fire the window "storage" event on the window that stored the data?](https://stackoverflow.com/q/18265556)
75. [localStorage eventListener is not called](https://stackoverflow.com/q/5370784)
76. [Easy URL Manipulation with URLSearchParams](https://developers.google.com/web/updates/2016/01/urlsearchparams)
77. Thoriq Firdaus, [HTML5 Form Validation With the “pattern” Attribute](https://webdesign.tutsplus.com/tutorials/html5-form-validation-with-the-pattern-attribute--cms-25145)
78. Raymond Camden, [Working With IndexedDB](https://code.tutsplus.com/tutorials/working-with-indexeddb--net-34673) | [Working With IndexedDB - Part 2](https://code.tutsplus.com/tutorials/working-with-indexeddb-part-2--net-35355) | [Working With IndexedDB - Part 3](https://code.tutsplus.com/tutorials/working-with-indexeddb-part-3--net-36220)
79. Tiffany Brown, [An Introduction to IndexedDB](https://dev.opera.com/articles/introduction-to-indexeddb/)
80. David Fahlander, [Breaking the Borders of IndexedDB](https://hacks.mozilla.org/2014/06/breaking-the-borders-of-indexeddb/)
81. [HTML5 - IndexedDB](https://web.archive.org/web/20150716002214/http://www.tutorialspoint.com/html5/html5_indexeddb.htm)