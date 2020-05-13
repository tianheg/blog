---
title: MXLinux 安装 Google Chrome
date: 2020-05-11T20:26:53+08:00
categories: ["技术"]
series: ["MXLinux"]
slug: install google chrome on MXLinux
keywords: ["Chrome"]
description: "记录在MXLinux上安装 Google Chrome"
---

MXLinux 属于 Debian 大类，所以在 MXLinux 上安装 GoogleChrome 亦即在 Debian 上安装。在搜索资料时，直接搜索 Debian 相关的即可。

### 先决条件：

需要以具有 sudo 访问权限的用户登录才能在 Debian 系统上安装包。

### 系统环境：

Debian version: 10

MXLinux version: MX-19.1_x64

### 下载 Google Chrome

通过 `Ctrl+Alt+T` 快捷键或者右键鼠标打开终端，运行下列命令：

```bash
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
```

### 安装 Google Chrome

```bash
$ sudo apt install ./google-chrome-stable_current_amd64.deb
```

你会被要求输入你的用户密码。上面的指令会安装 Chrome 和所有依赖。

### 使用 Google Chrome

现在你已经在 MXlinux 系统上安装了 Google Chrome，你可以从命令行输入 `google-chrome` 或者点击 Google Chrome 图标(`Activities -> Google Chrome`)来启动它。

第一次启动 Google Chrome 时，会看到窗口，询问是否希望将 Google Chrome 作为默认浏览器，并向谷歌发送使用统计数据和崩溃报告。

### 更新 Google Chrome

在安装过程中，官方的谷歌存储库将被添加到您的系统中。您可以使用 cat 命令来验证文件内容：

```bash
$ cat /etc/apt/sources.list.d/google-chrome.list
```

```
Output
### THIS FILE IS AUTOMATICALLY CONFIGURED ###
# You may comment out this entry, but any other modifications may be lost.
deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main
```

当新版本发布时，您可以通过桌面标准软件更新工具或在终端上运行以下命令来更新谷歌Chrome包：

```
$ sudo apt update
$ sudo apt upgrade
```

结束过程。

---

参考链接：[https://linuxize.com/post/how-to-install-google-chrome-web-browser-on-debian-9/](https://linuxize.com/post/how-to-install-google-chrome-web-browser-on-debian-9/)