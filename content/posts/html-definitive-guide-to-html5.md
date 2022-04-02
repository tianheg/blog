+++
title = "HTML5 权威指南"
date = 2021-12-08T00:00:00+08:00
lastmod = 2022-02-24T19:35:16+08:00
tags = ["技术", "阅读", "HTML"]
draft = false
+++

## 这本书的结构 {#这本书的结构}

- Part I: HTML，CSS，JS 基本知识
- Part II: HTML5 elements
- Part III: Cascading Style Sheets
- Part IV: Document Object Model
- Part V: advanced HTML5 features, such as Ajax, multimedia, canvas

这本书没有涉及 Scalable Vector Graphics(SVG)——另一个 HTML5 相关的技术。可阅读由 Kurt Cagle 写的 _SVG Programming_ 。

## Part I: Getting Started {#part-i-getting-started}

这一部分介绍的内容，是为了让我们能够顺利阅读这本书。

### HTML {#html}

一、什么是 HTML5？

它不仅指 HTML5 的最新版本，还包含它带来的所有现代科技。

二、它带来了什么改变？

- 原生支持多媒体

  - 支持可编程内容 canvas

- 支持语义化

三、如何标记内容？

使用 HTML 元素

四、如何提高浏览器处理 HTML 元素的能力？

将一个或多个属性应用到元素上。

五、如何声明文档中包含 HTML？

使用 `DOCTYPE` 和 `html` 元素。

六、怎样描述一个 HTML 文档？

使用 `head` 标签包裹的一个或多个元数据标签。

七、如何对 HTML 文档添加内容？

使用 `body` ，在其中包含文本和其他 HTML 元素。

八、如何通过快捷键选择元素？

使用 `accesskey` 全局属性

九、如何区分元素，以便应用一致的样式，或者用编程的方式定位元素？

使用 `class` 全局属性。

十、怎样能允许用户编辑元素的内容？

使用 `contenteditable` 全局属性。

十一、如何为元素添加一个上下文菜单？

使用 `contextmenu` 全局属性。

十二、如何指定一个元素的布局方向？

使用 `dir` 全局属性。

十三、怎样能让一个元素可拖拽？

使用 `draggable` 全局属性。

十四、如何指定一个元素可以作为一个目标，在其上可以放置其他元素？

使用 `dropzone` 全局属性。

十五、如何指出元素和它的内容并不相关？

使用 `hidden` 全局属性。

十六、如何给一个元素一个唯一的标识符（以便能够单独应用样式，或用编程的方式选择）？

使用 `id` 全局属性。

十七、如何指定一个元素的内容所使用的语言？

使用 `lang` 全局属性。

十八、如何标记应该进行错误检查的元素内容？

使用 `spellcheck` 全局属性。

十九、如何直接对元素应用样式？

使用 `style` 全局属性。

二十、如何指定 Tab 键的移位顺序？

使用 `tabindex` 全局属性。

二十一、如何提供有关元素的额外信息？

使用 `title` 全局属性。

二十二、为什么要分出 `class` 和 =id=？

二十三、=Empty Elements= 与 `Void Elements` 的区别是什么？

前者的例子， `<p></p>` ；后者的， `<hr>` 。它们都表达同样的中文意思：空元素。还有一种 Self-Closing Tags。

二十四、为什么写全元素的开始和结束标签很有必要？

因为这样可以帮助未来的自己或别人能够更容易理解文档所表达的内容。

二十五、为什么要注意单双引号的问题？

因为如何碰到单双引号同时使用时会出现麻烦，所以要特别关注。使用引号时，要统一，如果要同时使用，要确保成对出现： `"''"=/`'""'= 。

二十六、为什么会有布尔属性存在？

`disabled`

二十七、为什么我们还需要这种带有 `data-` 前缀的自定义属性？

因为人的需求太过丰富。这些属性的官方名称是 _author defined attributes_ 。它在 HTML4 中被引入。

二十八、什么是 `User-Agent` ？

它是 HTTP 请求头，是一个特征字符串，能够让服务器和网络节点识别应用、操作系统、生产厂商和正在请求的 User Agent 版本。

它是一种特殊的软件代理，能够模拟用户的真实行为。它是浏览器解析 HTML 的软件部分的统称。

二十九、为什么要使用 HTML 实体？

有些符号（比如 `<` ）容易和 HTML 标签的表达相混淆。

### CSS {#css}

三十、如何定义一个样式？

使用「属性：值」声明式。

三十一、如何为多个元素添加样式、如何为多个 HTML 文档添加样式？

前者使用选择器、后者使用样式文件。

三十二、如何决定哪些样式能应用于给定元素？

使用级联顺序应用于样式来源，并计算哪些样式会被抵消。

级联顺序优先级：

1.  行内样式（由 `style` 全局属性定义）
2.  嵌入式样式（由 `style` 标签定义）
3.  外来样式文件
4.  用户样式
5.  浏览器样式

三十三、怎样覆盖正常的级联样式？

使用 `!important` 。

三十四、如何使用父元素的样式？

应用属性继承。

三十五、如何用另一个属性来指定一个属性的值？

使用一个相对测量单位。

三十六、如何动态计算属性值？

使用 `calc` 函数。这个函数在 CSS3 中被确定。

三十七、怎样理解 `Tie-Breaking with Specificity and Order Assessments` ？

是一种计算如何应用样式的说法。与以下三点有关：

1.  样式选择器中样式 id 的数目
2.  选择器中其他属性和伪类的数目
3.  选择器中元素名和伪元素的数目

三十八、如何在当前样式中导入其他样式文件？

```css
@charset "UTF-8";
@import 'other.css';
```

在 CSS 样式表中可以出现在、@import 语句之前的只有、@charset 语句。后者用于声明样式表使用的字符编码。

三十九、哪些元素的样式能继承、哪些不能继承？

部分元素可以继承父元素的样式。与元素外观（文字颜色、字体等）相关的样式会被继承；与页面布局相关的元素的样式不会被继承。在样式中使用 inherit 可以强制继承。

四十、有哪些常用的颜色？

![](https://images.yidajiabei.xyz/css-color.jpeg)

更多 CSS color 相关标准，见[这里](https://www.w3.org/TR/css-color-3/)。

四十一、如何表示颜色

- 颜色名
- 十六进制、十进制
- 函数

![](https://images.yidajiabei.xyz/css-color-function.jpeg)

四十二、如何表达 CSS 中的长度？

width, font-size

1）绝对长度

绝对单位（现实世界中的度量单位）

![](https://images.yidajiabei.xyz/css-absolute-unit.jpeg)

一条样式可以混合使用绝对单位和相对单位。

2）相对长度

相对单位的测量需要依托其它类型的单位。

主流浏览器支持的一些 CSS 相对单位

![](https://images.yidajiabei.xyz/css-relative-unit.jpeg)

**像素单位的问题** ：像素这个术语一般是指显示设备上可寻址的最小单元——图像的基本元素。CSS 却是另辟蹊径，其像素定义如下：参考像素是距读者一臂之遥的像素密度为 96dpi 的设备上一个像素的视角（visualangle）。CSS 中的 px [标准定义](https://drafts.csswg.org/css-values-3/#px)。

主流忽略了 CSS 中 px 的定义，统一将 1 像素视为 1 英寸的 1/96。

CSS 像素原本是相对单位，但在使用过程中被视为绝对单位，所以在应用时没有相对单位灵活。

缺乏浏览器支持的 CSS 相对度量单位

![](https://images.yidajiabei.xyz/css-other-unit.jpeg)

① 这个单位已被重命名为 vmin，同时还增加了另一个单位 vmax。这两个单位分别等于 vw 和 vh 中较小和较大的那个。

使用 em、rem 等相对单位成为更加常见的用法。

其他 CSS 单位

3）角度

![](https://images.yidajiabei.xyz/css-angle-units.png)

4）时间

秒、毫秒

1s = 1000ms

四十三、如何测试 CSS 特性的支持程度？

- <https://caniuse.com/> 查看 HTML5 和 CSS3 的支持情况
- <https://modernizr.com/> 动态测试特性

四十四、有哪些好用的 CSS 工具？

- 浏览器样式在 DevTools 可见
- <https://selectorgadget.com/> 生成 CSS 选择器
- Less 改进 CSS
- 使用 CSS 框架

### JS {#js}

四十五、如何在文档中定义一个行内脚本？

使用 `script` 标签。

四十六、如何立刻执行一个语句？

直接在 `script` 中定义一个语句。

四十六、如何定义一个 JavaScript 函数？

使用函数关键字： `function keyword() {}` 。

四十七、怎样定义主变量？

使用 var 关键字：=var myVariable=。

四十八、如何创建一个对象？

使用 `new Object()` 或对象字面语法。

四十九、如何给对象创建方法？

创建一个新的属性，并将它赋给一个函数。

五十、如何得到或设置来自对象的属性？

使用点式或数组索引样式标记。

五十一、如何枚举一个对象中的属性？

使用 `for...in` 语句

五十二、如何为对象添加属性和方法？

给你需要的属性名赋值。

五十三、怎样删除对象的属性？

使用 `delete` 关键字

五十四、怎样决定为一个对象定义一个属性？

使用 `in` 表达式

五十五、如何在忽略数据类型的情况下，确定两个变量是否有相同值？

使用相等运算符 `==`

五十六、怎样判断两个变量具有相同的值和类型？

使用严格相等运算符 `===`

五十七、如何直接进行类型转换？

使用 `Number` 或 `String` 函数。

五十八、怎样创建一个数组？

使用 `new Array()` 或 the array literal syntax

五十九、怎样读取或修改一个数组的内容？

使用索引标记法，选定数组中的某个位置，获取该位置上的值或赋予新值。

六十、怎样枚举数组中的内容？

使用 `for` 循环。

六十一、怎样处理错误？

使用 `try...catch` 语句。

六十二、 `null` 和 `undefined` 的区别？

[undefined 与 null 的区别 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2014/03/undefined-vs-null.html)

Coerce a value to the boolean type, or use the equality operator ( `==` ) to treat null and undefined as being the same and the identity operator (`=`) to treat them as different values.

null 表示没有对象，此处不应该有值；典型用法：

1.  作为函数的参数，表示该函数的参数不是对象
2.  作为对象原型链的终点

undefined 表示缺少值，就是此处应该有值，但是还未定义；典型用法：

1.  变量被声明，但还没有赋值时，就等于 undefined
2.  调用函数时，应该提供的参数未提供，该参数等于 undefined
3.  对象没有赋值的属性，该属性的值为 undefined
4.  函数没有返回值时，默认返回 undefined

六十三、什么是 primitive types？

它指原生数据类型。JS 有 7 种：String、Number、BigInt、Boolean、Undefined、Symbol、Null。

六十四、String 有哪些用法？

字符串被用来表示一系列字符。相关用法：

- str.length
- new String("Something")
- 'cat'.charAt(1) // 'cat'[1]
- ...

六十五、Number 有哪些方法？

- Number()
- [从此处往下](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#constructor)

六十六、BigInt？

见[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

六十七、Boolean？

true/false

六十八、怎样使用对象？

1）创建对象

- new Object()
- 使用对象字面量：

<!--listend-->

```js
let myData = {
  name: 'Amy',
  weather: 'Sunny',
}
```

- 将函数作为方法：

<!--listend-->

```js
let myData = {
  name: 'A',
  addr: 'B',
  print: function () {},
}
myData.print()
```

2）处理对象

读取/修改属性值：

```js
let myData = {
  name: 'A',
  addr: 'B',
}
myData.name = 'c'
myData['addr'] = 'd'
```

枚举对象属性：

```js
let myData = {
  name: 'A',
  addr: 'B',
}

for (let prop in myData) {
  return 'Name: ' + prop + ' Value: ' + myData[prop]
}
```

添加/删除属性和方法：

```js
let myData = {
  name: 'A',
  addr: 'B',
}
myData.dayOfWeek = 'Monday'
myData.sayHello = function () {}

delete myData.name
delete myData['addr']
delete myData.sayHello
```

判断某属性是否存在（使用 =in=）：

```js
let myData = {
  name: 'A',
  addr: 'B',
}
console.log('name' in myData) // true
console.log('weather' in myData) // false
```

六十九、怎样为 JS 运算符分类（或者说排序）？

- ++,-- 根据放在变量前后不同，加或减
- +，-，\*，/，%
- &lt;,&lt;=,&gt;,&gt;=
- `==`,!= Equality and inequality tests
- `===`,!== Identity and nonidentity tests
- &amp;&amp;,||
- = 赋值
- - 字符串连接
- x ? y : z 三元操作符

七十、JS 的对象如何比较大小？

通过引用（JavaScript primitives (the built-in types, such as strings and numbers) are compared by value, but JavaScript objects are compared by reference.）

七十一、为什么需要显式类型转换？

这样可以避免意外结果。 `5 + "5"` 的结果是 `55` 。而不是预期数字 `10` 。这是因为 + 可以将数字 5 转为字符串 `"5"` 。

七十二、怎么把数字转化为字符串？

toString(),toString(2),toString(8),toString(16),toFixed(n),toExponential(n),toPrecision(n)

七十三、怎么把字符串转化为数字？

- `Number(<str>)`
- `parseInt(<str>)`
- `parseFloat(<str>)`

七十四、怎么创建数组，并添加内容，读取/修改内容，迭代数组？

- `let myArray = new Array()`
- `let myArray = [100, "100"]`
- `myArray[0]` `myArray[0] = 123`
- `for (let i = 0; i < myArray.length; i++)`

七十五、怎么用内建的数组方法？

有哪些内建方法：concat、join、pop、push、reverse、shift、slice、sort、unshift。

七十六、怎么处理错误？

使用语句： `try...catch` ：

```js
try {
  let aArray
  for (let i = 0; i < aArray.length; i++) {
    //   console.log(aArray[i])
  }
} catch (e) {
  console.log(e)
}
```

错误的对象：message、name、number

可以用 finally 从句输出正常执行的内容。
