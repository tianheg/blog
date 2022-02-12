+++
title = "JavaScript 工厂函数"
date = 2021-11-26T00:00:00+08:00
lastmod = 2022-02-12T21:25:03+08:00
tags = ["JavaScript", "技术"]
draft = false
+++

<https://www.javascripttutorial.net/javascript-factory-functions/>

工厂函数能够返回新的对象。创建一个名为 `xiaoming` 的人物对象：

```js
let xiaoming = {
    firstName: "xiaoming",
    lastName: "Li",
    getFullName() {
        return this.lastName + ' ' + this.firstName;
    }
};
console.log(xiaoming.getFullName());
```

Output:

```sh
Li xiaoming
```

`xiaoming` 对象有两个属性 `firstName` 和 `lastName` ，和一个用于返回全名的方法 `getFullName()` 。

假设你想新建一个类似对象 `xiaohua` ，可以直接替换以上代码的关键字。如果你想创建更多人物，直接复制就好。

为了避免重复复制相同代码，可以创建一个创建 `person` 对象的函数：

```js
function createPerson(firstName, lastName) {
  return {
    firstName: firstName,
    lastName: lastName,
    getFullName() {
      return lastName + ' ' + firstName;
    }
  }
}
```

能够创建对象的函数，就是工厂函数。 `createPerson()` 是一个工厂函数，因为它返回了新的 `person` 对象。

现在使用 `createPerson()` 工厂函数创建两个对象 `xiaoming` 和 `xiaohua` ：

```js
let xiaoming = createPerson("xiaoming", "Li"),
    xiaohua = createPerson("xiaohua", "Li");
console.log(xiaoming.getFullName());
console.log(xiaohua.getFullName());
```

对象的创建是在内存中开辟出一块空间，如果你有很多个对象，就会占用大量的内存空间。具体到 `person` 对象，它有一个重复的 `getFullName()` 方法。

为了避免在内存中重复相同的 `getFullName()` 函数，可以从 `person` 对象中移除它，另创建一个新的对象表达它：

```js
function createPerson(firstName, lastName) {
  return {
    firstName: firstName,
    lastName: lastName,
 }
}
```

```js
const behavior = {
    getFullName() {
      return this.lastName + ' ' + this.firstName;
    }
}
```

修改后的全部代码：

```js
function createPerson(firstName, lastName) {
  return {
    firstName: firstName,
    lastName: lastName
  }
}

const behavior = {
  getFullName() {
    return this.lastName + ' ' + this.firstName;
  }
}

let xiaoming = createPerson("xiaoming", "Li"),
    xiaohua = createPerson("xiaohua", "Li");

xiaoming.getFullName = behavior.getFullName;
xiaohua.getFullName = behavior.getFullName;

console.log(xiaoming.getFullName());
console.log(xiaohua.getFullName());
```

但是这样做并不利于添加更多方法，于是就有了 `Object.create()` 方法。


## `Object.create()` 方法 {#object-dot-create-方法}

`Object.create()` 方法创建新的对象，将已存在的对象作为新对象的原型（prototype）：

```js
Object.create(proto, [propertiesObject])
```

加入 `Object.create()` 以后的代码：

```js
const behavior = {
  getFullName() {
    return this.lastName + ' ' + this.firstName;
  }
}

function createPerson(firstName, lastName) {
  let person = Object.create(behavior);
  person.firstName = firstName;
  person.lastName = lastName;
  return person;
}


let xiaoming = createPerson("xiaoming", "Li"),
    xiaohua = createPerson("xiaohua", "Li");

console.log(xiaoming.getFullName());
console.log(xiaohua.getFullName());
```

不是很理解这段代码。

但是在实践中，很少见到「工厂函数」，更多见的是「函数构造函数（function constructors）」或「类」。