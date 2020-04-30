---
title: 《Python 简明教程》读书笔记系列一 —— 基本语法
toc: true
date: 2020-04-20T22:25:20+08:00
categories: ["技术"]
tags: ["basic", "Python"]
---

#### 注释

*注释* 是 `#` 符号右侧的任何文本，主要用作程序读者的注释。

<!--more-->

在程序中要使用尽可能多的有用注释：

* 解释假设（或者前提 / 条件）
* 解释重要的决定
* 解释重要的细节
* 解释你想要解决的问题
* 解释你在程序中试图克服的问题，等等。

> 代码告诉你方式，注释告诉你原因

#### 文字常量

一个文字常量是一个数字，或者是一个字符串。

它被称为文字，因为它是 *文字* 的 —— 你使用的是它的字面上的值。数字 `2` 就代表它自己，而不代表其它 —— 它是一个 *常量* ，因为它的值不能改变。因此，所有这些都被称为文字常量。

#### 数字

数字主要有两种类型 —— 整数和浮点型。整数不用过多介绍，直接介绍浮点数。

浮点数 （floating point numbers，或者简称为 *floats* ） 的例子有 `1.23` `34.3E-6` 。其中， `E` 表示 10 的幂。在这种情况下， `34.3E-6` 就等于 `34.3 * 10^-6` 。

#### 字符串

字符串本质上就是一堆单词。因为在 Python 程序中字符串无处不在，所以字符串的表示就很重要。其中，要重点记住的就是 “引号” 的使用。

* 单引号 `' '`
* 双引号 `" "`
* 三引号 `''' '''` `""" """`

单双引号均可以指定字符串，三引号则可以指定多行字符串。例如：

```python
'''Hello, my name is yidajiabei.
I'm glad that you can read my blog.
Thank you very much.'''
```

#### 字符串是不可改变的

这意味着字符串一旦被创建，就固定下来，无法再改变。

#### format 方法

我们还可以从其他信息中构造字符串。在这点上， `format()` 方法能帮助我们。

将下面几行内容保存为 `str_format.py` 文件：

```python
age = 20
name = 'yidajiabei'

print('{0} was {1} years old when I start learning to program.'.format(name, age))
print('Why is {0} playing with Python?'.format(name))
```

输出

```bash
$ python str_format.py
yidajiabei was 20 years old when I start learning to program.
Why is yidajiabei playing with Python?
```

要注意， `{}` 中的数字可以去掉。

在 `format` 方法中，Python 所做的事是将每个参数值替换到指定的位置。可以有更加详细的规范，例如：
```python
# 取十进制小数点后的精度为 3 ，得到的浮点数为 '0.333'
print('{0:.3f}'.format(1.0/3))
# 填充下划线 (_)，文本居中
# 将 '_hello_' 的宽度扩充为 11
print('{0:.^11}'.format('hello'))
# 用基于关键字的方法打印显示 'yidajiabei is learning to program'
print('{name} is {thing}'.format(name='yidajiabei', book='learning to program'))
```

输出

```bash
0.333
_hello_
yidajiabei is learning to program
```

要注意 `print` 总是以一个不可见的 【新的一行】 字符（`\n`） 作为结尾，因此对 `print` 的重复调用将在每个单独的行上打印输出。为了防止这个换行符被打印输出，你可以指定它以一个空（即，什么都没有）作为 `end`：
```python
print('a', end='')
print('b', end='')
```

输出为：
```
ab
```

或者你可以用空格作为 `end` ：
```python
print('a', end=' ')
print('b', end=' ')
print('c')
```

输出为：
```
a b c
```

#### 转义序列

主要使用符号：
* `\'` ——当在字符串中需要使用 `'` 时，它会发挥作用，见例子1
* `\"` ——当在字符串中需要使用 `"` 时，它会发挥作用，见例子2
* `\\` ——它在字符串中，表示反斜杠 `\` 本身，见例子3
* `\n` ——当字符串中的句子，需要换行时，它会发挥作用，见例子4
* `\t` ——制表符，功能：对齐表格的各列和 *制造空格* （ **这样表述可能是错误的，暂时还没有更清楚的表达** ），见例子5

例子1：
```python
print('What\'s your name?')
# 还有另一种书写方式——使用 ""
print("What's your name?")
```
输出为：
```no
What's your name?
What's your name?
```

例子2：
```python
print("Someone said \"Hello!\". And he replied,\"Hi!\"")
```
输出为：
```no
Someone said "Hello!". And he replied,"Hi!"
```

例子3：
```python
print('test\\test')
```
输出为：
```no
test\test
```

例子4：
```python
print('你好\n明天')
```
输出为：
```no
你好
明天
```

例子5：
```python
print("学号\t姓名\t语文")
print("201901\txiaomign\t100")
print("201902\txiaofang\t99")
print("201903\txiaodaff\t97")

# 我查到的一篇讲 Python 制表符 \t 的文章，说到 \t 的另外一个作用是 制造空格。因为在一些情况下，多个空格的重复输出会被抵消。
print("I'm Bob,what is your name?")
print("I'm Bob,    what is your name?") # , 与 what 之间有 4 个空格
print("I'm Bob,\twhat is your name?")   # 用了 \t 
# 如下图所示，第 2 个句子的空格并未消除，我很好奇产生这种输出的原因
```
输出为：
```no
学号	姓名	语文
201901	xiaomign	100
201902	xiaofang	99
201903	xiaodaff	97
I'm Bob,what is your name?
I'm Bob,    what is your name?
I'm Bob,	what is your name?
```

#### 原始字符串

如果你需要指定一些没有特殊处理（转义序列等）的字符串，那么你需要指定一个 *原始字符串* ，指定方法是在字符串前加上 `r` 或者 `R` 。例如：
```python
r"nihaomingtian \n"
```

#### 变量

注意变量的命名。变量可以使用标识符进行命名，在命名标识符时，有一些要遵循的规则：
* 标识符的第一个字符必须是字母
* 标识符的其余部分可由字母、数字或下划线组成
* 标识符的名称区分大小写，亦即 `Nihao` 和 `nihao` 是不同的

#### 对象

在 Python 中，一切皆对象。

#### 逻辑行和物理行

逻辑行是电脑执行程序时识别的；而物理行则是人眼所见的行。

#### 缩进

Python 以缩进区分执行顺序，不像 C 语言用括号标识。所以，如果 Python 程序的缩进发生错误，则程序很有可能不能正常运行。

Python 以 4 个空格进行缩进，这是公认的标准。

---
第一次阅读到此结束，以后还会有第二次更新，反馈。
文章参考：社区翻译资料《Python 简明教程》
链接在这里：[Python 简明教程](https://learnku.com/docs/byte-of-python/2018)