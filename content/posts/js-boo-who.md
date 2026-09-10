---
title: 'Boo who'
date: 2022-11-05T21:41:00+08:00
tags: ['技术', Algorithm]
---

1. [Basic Algorithm Scripting: Boo who | freeCodeCamp.org](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/boo-who)
2. [Boolean - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
3. [freeCodeCamp Challenge Guide: Boo who - Guide - The freeCodeCamp Forum](https://forum.freecodecamp.org/t/freecodecamp-challenge-guide-boo-who/16000)

## 我写的

```javascript
function booWho(bool) {
  if (bool === false || bool === true) {
    return true
  } else {
    return false
  }
}

console.log(booWho(1))
```

还可以这样写：

```javascript
function booWho(bool) {
  return typeof bool === 'boolean'
}

console.log(booWho(1))
```
