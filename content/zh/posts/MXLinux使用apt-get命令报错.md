---
title: MXLinux 使用 apt-get 命令报错
date: 2020-05-12T23:36:09+08:00
categories: ["技术"]
tech: ["MXLinux"]
slug: MXLinux error about apt
keywords: ["apt","MXLinux"]
description: "记录解决使用 apt-get 命令报错的问题"
---

```
E: Could not get lock /var/lib/dpkg/lock - open (11: Resource temporarily unavailable)
E: Unable to lock the administration directory (/var/lib/dpkg/), is another process using it?
```

以上是报错信息，产生报错信息的命令：

```bash
sudo apt-get install intltool
```

解决过程命令：

```bash
apt-get install intltool
E: Could not get lock /var/lib/dpkg/lock - open (11: Resource temporarily unavailable)
E: Unable to lock the administration directory (/var/lib/dpkg/), is another process using it?
sudo apt-get install intltool
E: Could not get lock /var/lib/dpkg/lock - open (11: Resource temporarily unavailable)
E: Unable to lock the administration directory (/var/lib/dpkg/), is another process using it?
remarkable
bash: remarkable: command not found
ps -A | grep apt
 3583 ?        00:00:00 apt-notifier <defunct>
sudo kill -9 3583
sudo rm /var/lib/dpkg/lock
sudo dpkg --configure -a
sudo rm /var/lib/apt/lists/lock
sudo rm /var/cache/apt/archives/lock
sudo apt update
Hit:1 http://dl.google.com/linux/chrome/deb stable InRelease                                       
Hit:2 http://deb.debian.org/debian buster-updates InRelease                                        
Hit:3 http://deb.debian.org/debian buster InRelease                                                
Hit:4 http://deb.debian.org/debian-security buster/updates InRelease                               
Hit:5 https://mirrors.tuna.tsinghua.edu.cn/mxlinux/mx/repo buster InRelease                        
Hit:6 https://deb.nodesource.com/node_12.x buster InRelease
Reading package lists... Done                       
Building dependency tree       
Reading state information... Done
All packages are up to date.
sudo rm /var/lib/dpkg/lock
```

使用 apt-get 命令的时候,遇到这种错误咋办?

E: Could not get lock /var/lib/dpkg/lock - open (11: Resource temporarily unavailable) 
E: Unable to lock the administration directory (/var/lib/dpkg/), is another process using it? 

## 找到并且杀掉所有的apt-get 和apt进程

运行下面的命令来生成所有含有 apt 的进程列表，你可以使用ps和grep命令并用管道组合来得到含有apt或者apt-get的进程。

```
ps -A | grep apt
```

找出所有的 apt 以及 apt-get 进程

```
$ sudo kill -9 processnumber
$ #或者
$ sudo kill -SIGKILL processnumber
```

比如，下面命令中的9是SIGKILL的信号数，它会杀掉第一个 apt 进程
```
$ sudo kill -9 进程ID
$ #或者
$ sudo kill -SIGKILL 进程ID
```

## 删除锁定文件

锁定的文件会阻止 Linux 系统中某些文件或者数据的访问，这个概念也存在于 Windows 或者其他的操作系统中。

一旦你运行了 apt-get 或者 apt 命令，锁定文件将会创建于 /var/lib/apt/lists/、/var/lib/dpkg/、/var/cache/apt/archives/ 中。

这有助于运行中的 apt-get 或者 apt 进程能够避免被其它需要使用相同文件的用户或者系统进程所打断。当该进程执行完毕后，锁定文件将会删除。

当你没有看到 apt-get 或者 apt 进程的情况下在上面两个不同的文件夹中看到了锁定文件，这是因为进程由于某个原因被杀掉了，因此你需要删除锁定文件来避免该错误。

首先运行下面的命令来移除 /var/lib/dpkg/ 文件夹下的锁定文件：

```bash
$ sudo rm /var/lib/dpkg/lock
```

之后像下面这样强制重新配置软件包：

```bash
$ sudo dpkg --configure -a
```

也可以删除 /var/lib/apt/lists/ 以及缓存文件夹下的锁定文件：

```
$ sudo rm /var/lib/apt/lists/lock
$ sudo rm /var/cache/apt/archives/lock
```

接下来，更新你的软件包源列表：

```
$ sudo apt update
$ #或者
$ sudo apt-get update
```

总结一下，对于 Ubuntu（以及它的衍生版）用户在使用 apt-get 或者 apt 也叫 aptitude 命令时遇到的问题，我们已经用两种方法来解决了。

---

参考链接：[Ubuntu用apt-get安装报错](https://blog.csdn.net/weixin_41010198/article/details/87347257)
