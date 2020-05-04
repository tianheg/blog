---
title: 01python解释器
categories: ["技术"]
toc: true
date: 2020-03-23T21:31:05+08:00
tags: ["解释器", "Python"]
series: ["Python"]
---

#### CPython

由C语言开发，为python原装解释器

<!--more-->

#### IPython

跟CPython相比仅在交互方式上有所增强，其他方面与Cpython并无区别。CPython用`>>>`作为提示符，而IPython用`In [序号]:`作为提示符。

#### PyPy

PyPy是另一个Python解释器，它的目标是执行速度。PyPy采用JIT技术，对Python代码进行动态编译（注意不是解释），所以可以显著提高Python代码的执行速度。

#### Jython

Jython是运行在Java平台上的Python解释器，可以直接把Python代码编译成Java字节码执行。

#### IronPython

IronPython和Jython类似，只不过IronPython是运行在微软.Net平台上的Python解释器，可以直接把Python代码编译成.Net字节码。

#### 小结

Python的解释器众多，但使用最广泛的还是CPython。如果要和Java或.Net平台交互，最好的办法不是用Jython或IronPython，而是通过网络调用来交互，确保各程序之间的独立性。