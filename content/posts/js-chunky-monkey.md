---
title: 'Chunky Monkey'
date: 2022-11-06T14:09:00+08:00
tags: ['技术', Algorithm]
---

1. [Basic Algorithm Scripting: Chunky Monkey | freeCodeCamp.org](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-algorithm-scripting/chunky-monkey)
2. [freeCodeCamp Challenge Guide: Chunky Monkey - Guide - The freeCodeCamp Forum](https://forum.freecodecamp.org/t/freecodecamp-challenge-guide-chunky-monkey/16005)

第一版：

```javascript
function chunkArrayInGroups(arr, size) {
  let newArr = []
  let subArr = []
  if (size >= arr.length) {
    return (newArr = arr)
  } else {
    arr.forEach(function (elem) {
      console.log(elem)
      subArr.push(elem)
      if (subArr.length === size) {
        newArr.push(subArr)
      }
    })
    return newArr
  }
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 5))
```

其他实现：

```javascript
function chunkArrayInGroups(arr, size) {
  let newArr = []
  let subArr = []

  for (let a = 0; a < arr.length; a++) {
    if (a % size !== size - 1) subArr.push(arr[a])
    else {
      subArr.push(arr[a])
      newArr.push(subArr)
      subArr = []
    }
  }

  if (subArr.length !== 0) newArr.push(subArr)
  return newArr
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 4))
```

```javascript
function chunkArrayInGroups(arr, size) {
  let newArr = []

  for (let a = 0; a < arr.length; a += size) {
    newArr.push(arr.slice(a, a + size))
  }
  return newArr
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 4))
```

```javascript
function chunkArrayInGroups(arr, size) {
  let newArr = []
  let i = 0

  while (i < arr.length) {
    newArr.push(arr.slice(i, i + size))
    i += size
  }
  return newArr
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 4))
```

这段代码不太理解

```javascript
function chunkArrayInGroups(arr, size) {
  let newArr = []
  while (arr.length > 0) {
    newArr.push(arr.splice(0, size))
  }
  return newArr
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 3))
```

这段代码竟然用到了递归

```javascript
function chunkArrayInGroups(arr, size) {
  if (arr.length <= size) return [arr]
  else {
    return [arr.slice(0, size)].concat(
      chunkArrayInGroups(arr.slice(size), size),
    )
  }
}

console.log(chunkArrayInGroups([0, 1, 2, 3, 4, 5, 6, 7, 8], 3))
```
