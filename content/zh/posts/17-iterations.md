---
title: 17迭代
toc: false
date: 2020-04-11T21:58:40+08:00
categories: ["技术"]
tags: ["学习"]
series: ["Python"]
---

1. 如果给定一个 list 或 tuple ，我们可以通过 `for` 循环来遍历这个 list 或 tuple ，这种遍历我们称为迭代（ Iteration ）。

<!--more-->

2. 在 Python 中，迭代是通过 `for ... in` 来完成的。

3. Python 的 `for` 循环不仅可以用在 list 或 tuple 上，还可以作用在其他可迭代对象上。

4. list 这种数据类型虽然有下标，但是很多其他数据类型是没有下标的，但是，只要是迭代对象，无论有无下标，都可以迭代，比如 dict 就可以迭代：

   ```
   >>> d = {'a':1, 'b':2, 'c':3}
   >>> for key in d:
   ...		print(key)
   ...
   a
   b
   c
   ```

5. 默认情况下， dict 迭代的是 key 。如果要迭代 value ，可以用 `for value in d.values()` ，如果要同时迭代 key 和 value ，可以用 `for k,v in d.items()` 。

6. 由于字符串也是可迭代对象，因此，也可以作用于 `for` 循环：

   ```
   >>> for ch in 'ABC':
   ...     print(ch) 
   ... 
   A
   B
   C
   ```

   所以，当我们使用 `for` 循环时，只要作用于一个可迭代对象， `for` 循环就可以正常运行，而我们不太关心该对象究竟是 list 还是其他数据类型。

7. 如何判断一个对象是可迭代对象呢？方法是通过 collections 模块的 Iterable 类型判断：

   ```
   E:\Github\blog>python36
   Python 3.6.5 (v3.6.5:f59c0932b4, Mar 28 2018, 17:00:18) [MSC v.1900 64 bit (AMD64)] on win32
   Type "help", "copyright", "credits" or "license" for more information.
   >>> from collections import Iterable
   >>> isinstance('abc', Iterable) 
   True
   >>> isinstance([1,2,3], Iterable) 
   True
   >>> isinstance(123, Iterable)     
   False
   ```

8. 如果要对 list 实现类似 Java 那样的下标循环怎么办？ Python 内置的 `enumerate` 函数可以把一个 list 变成索引-元素对，这样就可以在 `for` 循环中同时迭代索引 和元素本身：

   ```
   >>> for i, value in enumerate(['A', 'B', 'C']):
   ...     print(i, value) 
   ... 
   0 A
   1 B
   2 C
   ```

   上面的 `for` 循环里，同时引用了两个变量，在 Python 里是很常见的，比如下面的代码：

   ```
   >>> for x,y in [(1,1),(2,4),(3,9)]: 
   ...     print(x,y) 
   ... 
   1 1
   2 4
   3 9
   ```



**参考资料**

https://www.liaoxuefeng.com/wiki/1016959663602400/1017316949097888