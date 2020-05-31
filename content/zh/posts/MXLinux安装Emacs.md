---
title: MXLinux 安装 Emacs
date: 2020-05-13T13:38:01+08:00
categories: ["技术"]
tech: ["MXLinux","Emacs"]
slug: install emacs on mxlinux
keywords: ["Emacs","MXLinux"]
description: "记录在 MXLinux 上安装 Emacs 的过程"
---

## 安装步骤

### 下载 emacs-26.3.tar.gz 到 /home/

```
wget http://mirrors.ustc.edu.cn/gnu/emacs/emacs-26.3.tar.gz
```

### 解压缩

```
tar -zxvf emacs-26.3.tar.gz
```

### 进入解压目录

```
cd /home/emacs-26.3
```

### 配置

```
./configure --prefix=/opt/emacs
```

### 编译及安装

```
make && make install
```

### 设置环境变量

```
vim /etc/profile
export PATH=$PATH:/opt/emacs/bin
:wq # 保存退出
```

### 加载环境变量

```
source /etc/profile
```

### 测试

```
which emacs
/usr/local/bin/emacs
```

显示安装路径

### 使用 Emacs

```
emacs
```

在终端输入 `emacs` 后，会自动弹出软件窗口。

## 问题

在上述步骤进行至 **配置** 阶段时，我的 MXLinux 终端报错，主要信息是缺少 `x` 环境，以下代码是类似的错误信息，我的错误信息当时没有保存：

```
checking for long file names... yes
checking for X... no
checking for X... true
configure: error: You seem to be running X, but no X development libraries
were found.  You should install the relevant development files for X
and for the toolkit you want, such as Gtk+, Lesstif or Motif.  Also make
sure you have development files for image handling, i.e.
tiff, gif, jpeg, png and xpm.
If you are sure you want Emacs compiled without X window support, pass
  --without-x
to configure.
```

于是，我按照 [这里](https://askubuntu.com/questions/213873/what-libraries-do-i-need-to-install-if-i-want-to-compile-emacs) 的第一个回答的提示执行了下述命令：

```
sudo apt-get install build-essential texinfo libx11-dev libxpm-dev libjpeg-dev libpng-dev libgif-dev libtiff-dev libgtk-3-dev libncurses-dev libgnutls28-dev
```

它很有可能是有用处的，执行完这个命令后，我再一次配置：`./configure --prefix=/opt/emacs` ，发现可以继续进行了。

---

参考链接：

1. [Emacs for Linux安装指南](https://blog.csdn.net/youngdze/article/details/15751299)
2. [What libraries do I need to install if I want to compile Emacs?](https://askubuntu.com/questions/213873/what-libraries-do-i-need-to-install-if-i-want-to-compile-emacs)
3. [CentOS 7.6下源码安装Emacs 26.3](https://www.linuxidc.com/Linux/2019-09/160451.htm)