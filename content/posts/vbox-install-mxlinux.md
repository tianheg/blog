---
title: "VBox 安装 MXLinux"
description: "VBox 安装 MXLinux"
date: 2020-05-11T16:08:21+08:00
tags: ["VBox", "MXLinux"]
keywords: ["VBox", "MXLinux"]
---

这是 [官网](https://mxlinux.org/)，可以从 [这里](https://mxlinux.org/wiki/system/iso-download-mirrors/) 下载到 iso 镜像。接下来就可以在 Vbox 进行安装。

安装信息：

- 主机版本：Win10 64bit
- VBox 版本：6.1.6
- MXLinux 版本：MX-19.1_x64

## 新建虚拟机

Name 任意，我的命名：`MXLinux`。文件夹选一个集中存放虚拟机的文件夹，最好是单独一个分区。Type 选择 `Linux`，Version 选择 `Debian (64-bit)`，Memory size 根据主机内存选择，不要超过主机内存的 1/2 ，然后选择“Create a virtual hard disk now”，最后点击 `Create`。

对于 MXLinux 来说，File size 最小为 12g 。我给它分配 30g，够用了。“Hard disk file type”默认 `VDI` 格式，“Storage on physical hard disk”选择“Dynamically allocated”，这种分配方式的好处是，你可使用的量是变化的。如果设置固定占用硬盘大小，内存不可变，如果不能充分利用还会浪费硬盘资源。

## 安装 iso 文件

将下载完成的 MX-19.1_x64.iso 文件安装在新建的虚拟机中：点击该虚拟机的“Settings”，选择“Storage”，选择“Controller: IDE”下的 `Empty`，在右侧光盘图标的右下方有小脚标，点击后，找到下载好的 iso 文件，双击安装，最后点击 “OK”。

## 进入安装过程

点击“Start”打开虚拟机，一路回车即打开默认设置的 MXLinux 。在桌面有 `Installer` 文件，双击执行安装程序。

### 设置键盘布局

根据需要自行设置

### 虚拟硬盘分区

我选择的是 “Auto-install using entire disk”。如果你选择“Custom install on existing partitions”，要注意：MX 在选择分区时域别的发行版不同，直接列出了 root、home、swap、boot，我们要把 root 挂载到一个分区里。[^1]

### 选择安装引导

勾选 “Install GRUB for Linux and Windows”，“Location to install on”选择 MBR，“System boot disk”选择 sda。

### 设置计算机名

确定计算机命名，填好域名和工作组，后面两个不清楚作用，所以是任意设置。

### 设置中国时区

时区要设置成“Asia Shanghai”，格式根据自己喜好。

### 创建用户名密码

这个用户有两种：默认用户和管理员（root）用户。分别设置密码。

### 安装完成重启

安装结束后，点击“Finish”重启。

## 为 MXLinux 安装 VBox 增强功能

主要就是在安装系统之后，点击 `Devices` --> `Insert Guest Additions CD image...`，MXLinux 会弹出一个文件夹，在文件夹下打开终端，输入 `sudo ./VBoxLinuxAdditions.run`。系统会自动运行该脚本，执行安装。

在安装过程中，会抛出异常。如果你不是第一次在 VBox 上安装系统，那么在主机 VBox 的安装目录中一定有 VBoxGuestAdditions.iso 文件。它安装过程的异常会询问你：是直接使用现存的，还是重新安装继续接下来的步骤。我直接继续了，安装后重启，重新打开后发现不是充满整个窗口。又从窗口菜单处的 View 处点击 Full-screen Mode，发现可以全屏，取消全屏，界面能够完全填充窗口。

[^1]: [世界排名第一的 Linux 系统：MX Linux 安装图解](https://cloud.tencent.com/developer/news/472702)
