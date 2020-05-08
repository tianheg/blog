---
title: 08使用list和tuple
toc: true
date: 2020-03-31T20:31:29+08:00
categories: ["技术"]
tags: [""]
series: ["Python"]
---

#### list

Python内置的一种数据类型是列表：list。list是一种有序的集合，可以随时添加和删除其中的元素。

比如，列出班里所有同学的名字，就可以用一个list表示：

```
>>> classmates = ['A','B','C']
>>> classmates
['A','B','C']
```

变量`classmates`就是一个list。`len()`——获得list元素的个数：

```
>>> len(classmates)
3
```

用索引来访问list中每一个位置的元素，记得索引是从`0`开始的：

```
>>> classmates[0]
'A'
>>> classmates[1]
'B'
>>> classmates[2]
'C'
>>> classmates[3]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: list index out of range
```

当索引超出了范围时，Python会报一个`IndexError`错误，所以，要确保索引不要越界，记得最后一个元素的索引是`len(classmates) - 1`。

如果要取最后一个元素，除了计算索引位置外，还可以用`-1`做索引，直接获取最后一个元素：

```
>>> classmates[-1]
'C'
```

以此类推，可以获取倒数第2个、倒数第3个：

```
>>> classmates[-2]
'B'
>>> classmates[-3]
'A'
>>> classmates[-4]
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
IndexError: list index out of range
```

当然，倒数第4个就越界了。

list是一个可变的有序表，所以，可以往list中追加元素到末尾：

```
>>> classmates.append('D')
>>> classmates
['A','B','C'.'D']
```

也可以把元素插入到指定的位置，比如索引号为`1`的位置：

```
>>> classmates.insert(1,'E')
>>> classmates
['A','E','B','C','D']
```

要删除list末尾的元素，用`pop()`方法：

```
>>> classmates.pop()
'D'
>>> classmates
['A','E','B','C']
```

要删除指定位置的元素，用`pop(i)`方法，其中i是索引位置，要注意！**`i`是从`0`开始计数的**：

```
>>> classmates.pop(1)
'E'
>>> classmates
['A','B','C']
```

要把某个元素替换成别的元素，可以直接赋值给对应的索引位置：

```
>>> classmates[0] = 'D'
>>> classmates
['D','B'.'C']
```

list里面的元素的数据类型也可以不同，比如：

```
>>> L = ['Apple', 123, True]
```

list元素也可以是一个list，比如：

```
>>> s = ['python','java',['asp','php'],'scheme']
>>> len(s)
4
```

要注意`s`只有4个元素，其中`s[2]`又是一个list，如果拆开写就更容易理解了：

```
>>> p = ['asp','php']
>>> s = ['python','java',p,'scheme']
```

要拿到`'php'`可以写`p[1]`或者`s[2][1]`，因此`s`可以看成是一个二维数组，类似的还有三维、四维……数组，不过很少用到。

如果一个list中一个元素也没有，就是一个空的list，它的长度为0：

```
>>> L = []
>>> len(L)
0
```



#### tuple

另一种有序列表叫元组：tuple。tuple与list类似，但是tuple一旦初始化不可更改，比如同样是列出同学的名字：

```
>>> classmates = ('a','b','c')
```

现在，classmates这个tuple不能变了，它也没有append()，insert()这样的方法。其他获取元素的方法和list是一样的。

不可变的tuple有什么意义？因为tuple不可变，所以代码更安全。如果能用tuple，就绝对不要用list。

tuple的陷阱：当你定义一个tuple时，在定义的时候，tuple的元素就必须被确定下来，比如：

```
>>> t = (1,2)
>>> t
(1, 2)
```

如果要定义一个空的tuple，可以写成`()`：

```
>>> t = ()
>>> t
()
```

但是，要定义一个只有1个元素的tuple，如果你这么定义：

```
>>> t = (1)
>>> t
1
```

定义的不是tuple，是`1`这个数！这是因为括号`()`既可以表示tuple，又可以表示数学公式中的小括号，这就产生了歧义，因此，Python规定，这种情况下，按小括号进行计算。这时的计算结果自然是`1`。

所以，只有1个元素的tuple定义时必须加一个逗号`,`，来消除歧义：

```
>>> t = (1,)
>>> t
(1,)
```

Python在显示只有1个元素的tuple时，也会加一个逗号`,`，以免你误解成数学计算意义上的括号。

最后来看一个“可变的”tuple：

```
>>> t = ('a','b',['A','B'])
>>> t[2][0] = 'X'
>>> t[2][1] = 'Y'
>>> t
('a','b',['X','Y'])
```

这个tuple定义的时候有3个元素，分别是`'a'`，`'b'`和一个list。不是说tuple一旦定义后就不可变了吗？怎么后来又变了？

别急，我们先看看定义的时候tuple包含的3个元素：

![tuple包含的3个元素](https://raw.githubusercontent.com/Gaotianhe/images/master/hexoblog/20200331/0.jpeg)

当我们把list的元素`'A'`和`'B'`修改为`'X'`和`'Y'`后，tuple变为：

![我们把list的元素`'A'`和`'B'`修改为`'X'`和`'Y'`后，tuple变为](https://raw.githubusercontent.com/Gaotianhe/images/master/hexoblog/20200331/1.jpeg)

tuple所谓的 “ 不变 ” 是说，tuple的每个元素，它的指向永远不变。

**参考资料**

使用list和tuple-廖雪峰的官方网站：https://www.liaoxuefeng.com/wiki/1016959663602400/1017092876846880