---
title: 09条件判断
toc: false
date: 2020-04-01T21:06:07+08:00
categories: ["技术"]
tags: ["条件判断", "Python"]
series: ["Python"]
---

```python
age = 3
if age >= 18:
    print('adult')
elif age >= 6:
    print('teenager')
else:
    print('kid')
```

---

```python
if x:
    print('True')
```

---

`input()`返回的数据类型是`str`，`str`不能直接和整数比较，必须先把`str`转换成整数。Python提供了`int()`函数来完成这件事情：

```python
s = input('birth: ')
birth = int(s)
if birth < 2000:
    print('00前')
else:
    print('00后')
```

---

`int()`函数发现一个字符串并不是合法的数字时就会报错，程序就退出了

<!--more-->

**参考资料**

https://www.liaoxuefeng.com/wiki/1016959663602400/1017099478626848