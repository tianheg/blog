---
title: 02第一个python程序
categories: ["技术"]
toc: true
date: 2020-03-24T22:19:03+08:00
tags: ["命令行", "交互"]
series: ["Python"]
---

#### 复习

命令行模式：

直接通过Windows开始菜单里的“命令提示符”打开的页面，就被称为命令行模式。

<!--more-->

Python交互模式：

在命令行模式下敲命令`python`，就会看到一串文本输出，然后就进入到Python‘交互模式，它的提示符是`>>>`。

在Python交互模式下输入`exit()`并回车，就退出了Python交互模式，并回到命令行模式：

```
Microsoft Windows [Version 10.0.0]
(c) 2019 Microsoft Corporation. All rights reserved.

C:\>python
Python 3.8.1 (tags/v3.8.1:1b293b6, Dec 18 2019, 23:11:46) [MSC v.1916 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>exit()
C:\>_
```

也可以直接通过开始菜单选择`Python (command line)`菜单项，**直接进入**Python交互模式，但输入`exit()`后窗口会直接关闭，不会回到命令行模式。

**注意**：

在写代码之前，请**千万不要**用“复制粘贴”把代码从页面粘贴到你的电脑上。写程序也讲究一个感觉，你需要一个字母一个字母的把代码自己敲进去，在敲代码的过程中，初学者经常会敲错代码：拼写不对，大小写不对，混用中英文标点，混用空格键和Tab键，所以，，你需要仔细地检查、对照，才能以最快的速度掌握如何写程序。

#### 简单Python程序

Python可以直接计算数字，例如：

```python
>>> 100+200
300
```

Python可以用`print()`函数打印指定的文字，要将希望打印的文字用单引号或双引号括起来，但不能混用单引号和双引号，例如：

```python
>>> print('hello world')
hello world
```

用单引号括起来的文本在程序中叫字符串，也可以使用双引号。

重点区分**命令行模式和Python交互模式**

在命令行模式下，可以执行`python`进入Python交互式环境，也可以执行`python hello.py`运行一个`.py`文件。

执行一个`.py`文件**只能**在命令行模式下执行。如果敲一个命令`python hello.py`，看到如下错误：

```
C:\>python hello.py
python: can't open file 'hello.py': [Errno 2] No such file or directory
```

错误提示`No such file or directory`说明这个`hello.py`在当前目录下**找不到**，必须把当前目录切换到`hello.py`所在的目录下，才能正常执行：

```
C:\> cd work
C:\work\> python hello.py
hello world
```

此外，在命令行模式运行`.py`文件和在Python交互式环境下直接运行Python代码有所不同。*Python交互式环境会把每一行Python代码的结果自动打印出来，但是，直接运行Python代码却不会。*

例如，在Python交互式环境下，输入：

```
>>> 100+200+300
600
```

直接可以看到结果`600`。

但是，写一个`calc.py`的文件，内容如下：

```
100+200+300
```

然后再命令行模式下执行：

```
C:\work\> python calc.py
```

发现什么输出都没有。

这是正常的。想要输出结果，必须自己用`print()`打印出来。把 `calc.py`改造一下：

```python
print(100+200+300)
```

再执行，就可以看到结果：

```
C:\work\> python calc.py
600
```

最后，Python交互模式的代码是输入一行，执行一行，而命令行模式下直接运行`.py`文件是一次性执行该文件的所有代码。可见，Python交互模式主要是为了调试Python代码用的，也便于初学者学习，它**不是**正式运行Python代码的环境！

#### 小结

区别命令行模式和Python交互模式；

在`.py`所在目录下，打开命令提示符，输入`python XXX.py`执行`.py`文件。