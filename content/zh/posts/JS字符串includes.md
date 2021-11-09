+++
date = '2021-11-09T09:54:54+08:00'
title = 'JS 字符串 `includes()`'
tags = ['JavaScript']
slug = 'js-string-includes'
+++

`includes()` 方法能够在字符串中查找特定字符，而且它是大小写敏感的。

## 基本语法[^1]

```js
str.includes(searchString, optionalPosition)
```

`searchString` 是要查找的字符；`optionalPosition` 是可选的，当它被赋为整数值 n 时，即从 n+1 位开始查找（空格也计入在内）。而且，`includes` 大小写敏感。

## 例子[^2]

```js
"I love you".includes("love"); // true
"I LOVE you".includes("love"); // false
```

```js
const str = "I love you.";

console.log(str.includes("love")); // true
console.log(str.includes("love", 1)); // true
console.log(str.includes("love", 2)); // true
console.log(str.includes("love", 3)); // false
console.log(str.includes("love", 2.1)); // true
console.log(str.includes("love", 3.1)); // false
```

为什么当 `optionalPosition` 为浮点数 2.1 的时候依然返回 true？

| Str    | Index |
| ---    |   --- |
| "I"    |     0 |
| " "    |     1 |
| "love" |     2 |
| " "    |     3 |
| "you"  |     4 |
| "."    |   5   |

如上表所示，`"love"` 字符串的索引为 2。

[^1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
[^2]: https://www.freecodecamp.org/news/javascript-string-contains-how-to-use-js-includes/