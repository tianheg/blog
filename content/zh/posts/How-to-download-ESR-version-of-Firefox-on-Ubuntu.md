---
title: 如何在Ubuntu上下载Firefox的ESR版本
date: 2020-02-27T22:17:09+08:00
categories: ["技术"]
series: []
slug: download esr firefox on ubuntu
keywords: []
description: ""
---

Ubuntu是Linux操作系统的桌面类系统的一个发行版，因为网站后台是Linux操作系统，所以想着在虚拟机上装个Ubuntu系统学习一下。看了[编程随想](https://program-think.blogspot.com/2017/03/Why-Linux-Is-More-Secure-Than-Windows-and-macOS.html)有关于浏览器的选择问题，Ta 推荐Firefox。原因有以下几点：

1. Firefox是开源软件，是由非营利组织的专门维护，这样就保证了Firefox的开发团队不会因为商业利益而拼了老命收集用户的隐私数据。与此截然相反的就是Google，因为他们是商业公司，商业公司必然要盈利，所以Google会为了商业利益而收集用户隐私进而投放更为精准的广告。

2. 因为Firefox是开源软件，任何人都可以阅读Firefox的源代码，也就是说Firefox这个软件是完全公开的，任何人只要你有能力，都能参与到Firefox的开发中。当然这样能够带来一个好处就是：发现bug的速度很快。因为只要有人发现软件有bug，就可以把它提交，促进软件的稳定使用。它不像闭源软件，有没有bug只有自己内部的开发人员才知道并进行修改，大部分用户就算发现了bug也不能进行修改，因为不知到软件的源代码。

3. 如果一个软件是自由软件，那么它必须为用户提供以下四项基本自由：

   0.无论用户出于何种目的，必须可以按照用户意愿，自由地运行该软件。

   1.用户可以自由地学习并修改该软件，以此来帮助用户完成自己的运算。作为前提，用户必须可以访问到该软件的源代码。

   2.用户可以自由地分发软件的拷贝，这样就可以助人。

   3.用户可以自由地分发该软件修改后的拷贝。借此，用户可以把改进后的软件分享给整个社区令他人也从中受益。作为前提，用户必须可以访问到该软件的源代码。

4. 自由软件的范围大于开源软件，所以3中所说，开源软件全部适用。

在Firefox的诸多版本中（有Beta、Nightly、Develop Edition、Extended Support Release），随想推荐了Firefox的ESR版本，这一版本具有极强的稳定性还有很强的定制功能。因此，我昨天在自己的笔记本上安装了Firefox的ESR版本。目前看来和普通的Firefox没有什么区别，等我的进一步探索吧。

因为要学习Linux，所以装Ubuntu，想着顺便把Ubuntu里自带的Firefox换成它的ESR版本吧。于是就开始操作上网找教程，终于在这里找到了 https://www.linuxuprising.com/2018/11/how-to-install-firefox-esr-in-ubuntu-or.html 。下面我就简述一下操作过程。

首先，把旧的Firefox卸载，在Terminal里输入`sudo apt remove firefox`.

然后，分别输入以下三行代码：

```
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt install firefox-esr
```

------

OK,一个Firefox的ESR版本就安装好了。