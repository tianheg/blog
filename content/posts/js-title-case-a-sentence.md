---
title: 'Title Case a Sentence'
date: 2022-11-05T21:36:00+08:00
tags: ['技术', Algorithm]
---

[Basic Algorithm Scripting: Title Case a Sentence | freeCodeCamp.org](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/title-case-a-sentence)

## 我的，没有完成要求

```javascript
function titleCase(str) {
  let newStrArr = []
  for (let i = 0; i < str.split(' ').length; i++) {
    newStrArr.push(
      str.split(' ')[i][0].toUpperCase() +
        str.split(' ')[i].slice(1).toLowerCase(),
    )
  }
  return newStrArr.join(' ')
}

console.log(titleCase("I'm a little tea pot"))
```

加了 `.toLowerCase()` 可以了。

这样写有些繁琐。

## for...in

```javascript
function titleCase(str) {
  const newTitle = str.split(' ')
  const updatedTitle = []
  for (let st in newTitle) {
    updatedTitle[st] =
      newTitle[st][0].toUpperCase() + newTitle[st].slice(1).toLowerCase()
  }
  return updatedTitle.join(' ')
}
```

## map()

```javascript
  function titleCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map((val) => val.replace(val.charAt(0), val.charAt(0).toUpperCase()))
      .join(' ')
  }

  titleCase("I'm a little tea pot")
```

## 正则表达式

```javascript
function titleCase(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, (L) => L.toUpperCase())
}
```
