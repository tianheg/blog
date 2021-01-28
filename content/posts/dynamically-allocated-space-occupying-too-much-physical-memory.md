---
title: "动态分配空间占用物理内存过大"
date: 2020-05-10T18:16:07+08:00
description: "记录解决 VBox 动态分配空间占用物理内存过大问题"
tags: ["VBox"]
keywords: ["VBox"]
---

在 VBox 的安装目录，打开 command prompt ，输入：

```bash
VBoxManage.exe modifyhd "F:\VirtualBox VMs\Windows10\Windows10.vdi" --compact
```

---

**参考资料**：

1. [如何清理 Virtualbox 虚拟机 VDI 镜像文件的空间大小](https://blog.csdn.net/LEON1741/article/details/81627176)
