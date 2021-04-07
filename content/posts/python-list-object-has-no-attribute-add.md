---
title: "【Python】list 对象没有 add 属性"
description: "【Python】list 对象没有 add 属性"
date: 2020-05-18T14:29:41+08:00
tags: ["Python"]
keywords: ["Python"]
---

为以下输入时，报错：

```bash
>>> A = (['a', 'b', 'c', 'd'])
>>> 'a' in A
True
>>> 'e' in A
False
>>> ABC = A.copy()
>>> ABC.add('e')
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'list' object has no attribute 'add'
# no exit() 仍然报属性错误
>>> abc = A.copy()
>>> abc.add('e')
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'list' object has no attribute 'add'
>>>
```

报错输出为：`list` 对象没有 `add` 属性

为以下输入时，正常：

```bash
>>> abc = set(['a', 'b', 'c', 'd'])
>>> 'a' in abc
True
>>> 'e' in abc
False
>>> abcd = abc.copy()
>>> abcd.add('e')
>>> abcd.issuperset(abc)
True
>>> abc.remove('c')
>>> abc & abcd #  或者是 abc.intersection(abcd)
{'d', 'a', 'b'}
>>>
```

有大小写字母的问题，并且还有其他的隐式问题。

待解决
