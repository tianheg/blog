---
title: 解决 PyCharm 无法打开 Terminal 问题
date: 2020-04-12T11:12:06+08:00
tags: ["Python"]
---

#### 问题描述

PyCharm 打开命令行失败，点击 Terminal 显示如下内容：

```no
Cannot open Local Terminal
Failed to start [cmd.exe] in E:\PyCharmProject

Error running process: CreateProcess failed. Code 267


See your idea.log (Help | Show Log in Explorer) for the details.
```

系统配置：
系统：Win10

解决过程：
1.重新安装 PyCharm，发现问题仍然存在。
2.新建项目 test 。发现能够正常打开 Terminal ，我自己推测，大概是之前的那个项目 A ，它的 python 虚拟环境删除重装了很多次，添加环境，不行，删除，继续添加。
