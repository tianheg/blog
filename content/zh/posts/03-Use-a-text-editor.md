---
title: 03使用文本编辑器
categories: ["技术"]
toc: true
date: 2020-03-25T23:24:44+08:00
tags: ["VSCode","编辑器"]
series: ["Python"]
---

#### Visual Studio Code

这是微软出的另一款编辑器，不是大块头Visual Studio。它有很多优点：轻量级，插件丰富，支持各种语言，多平台。

<!--more-->

另外先提个醒：**不要使用Word和Windows自带的记事本**。Word保存的不是纯文本文件，记事本则会在文本开始的地方加几个特殊字符（UTF-8 BOM），结果会导致程序运行出错。

安装好VS Code后，打开新建一个`hello.py`文件，输入

```python
print("hello world")
```

注意`print`前不要有空格，否则会报错。然后在当前目录下的命令提示符中执行`python hello.py`，就会输出`hello world`。例如：

```
C:\>python hello.py
hello world
```

文件名只能是：英文字母、数字和下划线的组合。

#### 直接运行py文件

如果我们想要像Windows中的exe文件那样直接运行py文件，只能在Mac或Linux中进行，方法是在`.py`文件的第一行加上一个特殊的注释：

```python
#！/usr/bin/env python3
print('hello world')
```

然后，通过命令给`hello.py`以执行权限：

```
$ chmod a+x hello.py
```

就可以直接运行`hello.py`了，比如在Mac下运行：

```bash
xxxx:~ xxx$ ./hello.py
hello world
xxxx:~ xxx$
```

#### 小结

用文本编辑器写Python程序，然后保存为后缀为`.py`的文件，就可以用Python直接运行这个程序了。

Python的交互模式和直接运行`.py`文件有什么区别呢？

直接输入`python`进入交互模式，相当于启动了Python解释器，但是等待你一行一行地输入源代码，每输入一行就执行一行。

直接运行`.py`文件相当于启动了Python解释器，然后一次性把`.py`文件的源代码给执行了，你是没有机会以交互的方式输入源代码的。

用Python开发程序，完全可以一边在文本编辑器里写代码，一边开一个交互式命令窗口，在写代码的过程中，把部分代码粘到命令行去验证，事半功倍！