---
title: MXLinux 安装中文输入法
date: 2020-05-17T16:03:04+08:00
categories: ["技术"]
tech: ["MXLinux"]
slug: install Chinese input method on MXLinux
keywords: ["MXLinux","input method"]
description: "记录在 MXLinux 上安装中文输入法的过程"
---

## 安装中文输入法

添加中文支持：

```
sudo apt-get install locales
```

配置 locales 软件包：

```
sudo dpkg-reconfigure locales
```

就会出现一个图形界面，在界面的区域设置中选中以下几项：

```
zh_CN GB2312
zh_CN.GB18030 GB18030
zh_CN.GBK GBK
zh_CN.UTF-8 UTF-8
```

如何你还需要英文界面，还需要勾选：

```
en_US.UTF-8 UTF-8
```

接下来的就是选择输入法了，我一开始安装的是 Fcitx，无法正常输入中文，弃用。后来选择了 IBus ，直接 MXLinux 的 MX Package Installer 里找 Language 项下的 Chinese_Input，直接下载就行。

---

参考链接：

1. [Debian10 更换软件源 & 配置中文环境 & 安装中文输入法](https://zhuanlan.zhihu.com/p/106775707)
2. [Chinese simplified input](https://mxlinux.org/wiki/other/chinese-simplified-input/)