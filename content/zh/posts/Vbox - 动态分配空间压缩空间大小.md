---
title: VBox - 解决动态分配空间占用物理内存过大问题
date: 2020-05-10T18:16:07+08:00
tags: []
categories: ["技术"]
series: ["VBox"]
slug: VBox dynamically allocating space
keywords: ["VBox"]
description: ""
---

在 Vbox 的安装目录，打开 command prompt ，输入：

```
VBoxManage.exe modifyhd "F:\VirtualBox VMs\Windows10\Windows10.vdi" --compact
```

[如何清理Virtualbox虚拟机VDI镜像文件的空间大小](https://blog.csdn.net/LEON1741/article/details/81627176)