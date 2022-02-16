+++
title = "Vue1 应用和组件实例"
date = 2021-12-19T00:00:00+08:00
lastmod = 2022-02-16T09:42:20+08:00
tags = ["技术", "Vue3"]
draft = false
+++

<https://vuejs.org/guide/essentials/application.html>


## 创建一个应用实例 {#创建一个应用实例}

每一个 Vue 应用的开始，都是通过 `createApp` 函数，创建一个新的应用实例：

```javascript
const app = Vue.createApp({
  /* options */
})
```

该应用实例被用于注册「全局变量」，然后可以被应用内部的组件使用。一个例子：

```javascript
const app = Vue.createApp({})
app.component('SearchInput', SearchInputComponent)
app.directive('focus', FocusDirective)
app.use(LocalePlugin)
```

大部分通过应用示例暴露的方法返回相同的示例，允许直接链接：

```javascript
Vue.createApp({})
  .component('SearchInput', SearchInputComponent)
  .directive('focus', FocusDirective)
  .use(LocalePlugin)
```

可以在 [API reference](https://vuejs.org/api/application.html) 找到全部的应用 API。


## 根组件 {#根组件}

传递给 `createApp` 的选项被用于配置 **根组件** 。当我们安装应用程序时，该组件开始渲染。

应用需要被安装进入一个 DOM 元素中。例如，如果我们想把 Vue 应用安装进 `<div id="app"></div>` ，我们应该传入 `#app` ：

```javascript
const RootComponent = {
  /* options */
}
const app = Vue.createApp(RootComponent)
const vm = app.mount('#app')
```

与大多数应用方法不同， `mount` 不返回应用，它返回根组件实例。

尽管 Vue 与 [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel) 模式没有严格相关，但 Vue 的设计在一定程度上受它的启发。

作为惯例，我们经常使用变量 vm (ViewModel 的缩写)来引用组件实例。

到这里我们见到的都是单组件，大多数真实应用程序被组织为嵌套的、可以重复使用的组件树。例如，一个 Todo 应用的组件树可能是这样：

```text
Root Component
|-- TodoList
    |-- TodoItem
    |   |-- DeleteTodoButton
    |   └─  EditTodoButton
    └─  TodoListFooter
        |-- ClearTodosButton
        └─  TodoListStatistics
```

每一个组件都有自己的组件实例， `vm` 。对于某些组件来说，例如 `TodoItem` ，可能会同时呈现多个渲染实例。在该应用的所有组件实例会共享应用实例。

[组件系统](https://v3.vuejs.org/guide/component-basics.html)稍后可见。现在只需要知道，根组件和其他组件并无不同。配置选项与相应组件实例的行为相同。


## 组件实例属性 {#组件实例属性}

`data` 中定义的属性会通过组件实例公开：

```javascript
const app = Vue.createApp({
  data() {
    return { count: 4 }
  }
})

const vm = app.mount('#app')
console.log(vm.count)
```

还有其他可以添加的使用者定义选项，像 `methods` ， `props` ， `computed` ， `inject` ， `setup` 。组件实例的所有属性，无论如何定义，对组件的模板都是可见。Vue 还会通过组件实例公开一些内建属性，像 `$attrs` 和 `$emit` 。这些属性都有一个 `$` 前缀，以避免和使用者定义的属性名相混淆。


## 生命周期钩子 {#生命周期钩子}

每一个组件实例在创建时会经历一系列的初始化步骤。比如，这需要设置数据观测、编译模板、将实例安装至 DOM，当数据变化时更新 DOM。自始至终，它也运行着被称作 lifecycle hooks 的函数，让使用者能够在特定阶段加入他们的代码。

例如，[created](https://v3.vuejs.org/api/options-lifecycle-hooks.html#created) 钩子用于在实例创建以后运行代码。

```javascript
Vue.createApp({
  data() {
    return { count: 1 }
  },
  created() {
    // `this` points to the vm instance
    console.log('count is: ' + this.count)
  }
})
```

还有更多钩子可以在生命循环的不同阶段使用，比如 mounted，updated，unmounted。调用所有生命周期钩子时，它们的 this 上下文指向调用它的当前活动实例。

<span style="background-color: #FFFF00;">注意</span>：

不要在选项属性或回调中使用箭头函数。例如， `created: () => console.log(this.a)` 或 `vm.$watch('a', newValue => this.myMethod())` 。因为箭头函数没有 `this` ， `this` 将作为任何其他变量处理，并通过父作用域进行词法查找，直到找到，经常产生错误，如 `Uncaught TypeError: Cannot read property of undefined` 或 `Uncaught TypeError: this.myMethod is not a function` 。


## 生命周期图 {#生命周期图}

下面是一张生命周期实例图。

![](https://images.yidajiabei.xyz/vue3-lifecycle.png "")