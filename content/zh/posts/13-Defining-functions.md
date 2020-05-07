---
title: 13定义函数
toc: true
date: 2020-04-08T20:13:45+08:00
categories: ["技术"]
tags: ["空函数", "参数"]
series: ["Python"]
---

pass  返回多个值

<!--more-->

在Python中，定义一个函数要使用def语句，依次写出函数名、括号、括号中的参数和冒号:，然后，在缩进块中编写函数体，函数的返回值用return语句返回。

函数内部通过条件判断和循环可以实现非常复杂的逻辑。

如果没有return语句，函数执行完毕后也会返回结果，只是结果为None。return None可以简写为return。

from test import my_abs

#### 空函数

pass——定义空函数

pass可以用作占位符

#### 参数检查

TypeError: my_abs() takes 1 positional argument but 2 were given

当传入了不恰当的参数时，内置函数abs会检查出参数错误，而我们定义的my_abs没有参数检查，会导致if语句出错，出错信息和abs不一样。所以，这个函数定义不够完善。

```python
def my_abs(x):
    if not isinstance(x, (int, float)):
        raise TypeError('bad operand type')
    if x >= 0:
        return x
    else:
        return -x
```

#### 返回多个值

```python
import math

def move(x, y, step, angle=0):
    nx = x + step * math.cos(angle)
    ny = y - step * math.sin(angle)
    return nx, ny
```

所以，Python的函数返回多值其实就是返回一个tuple，但写起来更方便。

**参考资料**

https://www.liaoxuefeng.com/wiki/1016959663602400/1017106984190464