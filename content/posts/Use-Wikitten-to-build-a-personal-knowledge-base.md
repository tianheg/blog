---
title: 使用 Wikitten 建立个人知识库
date: 2020-04-02T21:47:53+08:00
tags: ["编程"]
slug: build a knowledgebase with Wikitten
---

我是在逛 V2EX( https://www.v2ex.com/ ) 的时候，看到有人询问有关如何找一个合适的个人知识库管理程序。我一时好奇，再加上自己也有类似的需求，就决定自己试验一下。自己手头有阿里云的 1 台轻量应用服务器和 1 台 ECS 云服务器，前一个是我掏钱买的，后一个是因为疫情的原因，阿里云赠送学生的。不过它需要自己去抢，抢到服务器的那天把我给高兴坏了。而且，我还告诉玩得好的同学，如果他们感兴趣的话就会去抢了。

折腾这种东西确实费时费精力，中午 1 点吃完饭，直到晚上 9 点多才初具雏形，而且我还找到一个 bug。这种感觉真好！

废话不多说，开始干活！

## 安装宝塔面板

因为我使用的是轻量应用型服务器，在重置系统的选项里有 BT-panel。如果你的服务器无法这样做的话，可以到宝塔官网（ https://www.bt.cn/ ），下载适合你的服务器系统的宝塔面板。

之所以选择它，是因为它对新手很友好，不用使用命令行工具。我并不是不喜欢使用命令行，而是我想自己先试验，想看看自己最后能做出什么样的效果。

推荐我使用宝塔面板的，就是这篇文章（[一款支持 Markdown 语法的 Wiki 知识管理系统：Wikitten 搭建教程](https://www.moerats.com/archives/549/)）的作者。

## 安装并配置 PHP

在宝塔面板的软件商店里，你可以看到很多软件，我们需要在运行环境下的软件里找到这几个软件：PHP($\ge$5.3)、Nginx。其他软件无要求，Nginx 我用的是最新版本：1.16.1。

在软件商店那里，找到已安装的 PHP，点击设置，点击安装扩展，找到`fileinfo`，点击安装。

## 解析并添加域名

这一步我做过很多遍了，尤其是当我在不同的应用之间来回折腾的时候。解析记录也是添加完又删除、删除完又要添加回来。

在阿里云控制台找到域名，进入解析列表。看到我的域名，点击解析设置。

1. 添加记录
2. 记录类型选择 'A' (因为是将我的域名，解析到我服务器的 IP 地址上，使我能够通过域名直接访问 IP 地址)
3. 主机记录选择 '@' (因为这样可以缩短网址，看起来舒服)
4. 解析线路默认就 OK 了
5. 记录值填你服务器的公网 IP
6. TTL 不用动(因为我不太懂它的用法，所以默认就 OK )

到这里，域名解析 OK；

下一步，是在宝塔面板网站那里，添加刚才解析的域名。不用创建 FTP 和数据库，直接提交就 OK。

## 下载并配置 Wikitten

从 github 仓库里下载 Wikitten 的源码（这是地址：https://github.com/victorstanciu/Wikitten/archive/master.zip ），你点击一下，它就下载了。

下载好不用解压，在宝塔面板文件那里，有一个“上传”。要看清，当前目录应该是：根目录\www\wwwroot。应该把 zip 文件放在 wwwroot 目录下面。然后解压，把 zip 文件删除。然后到网站那里，修改它的根目录为：/www/wwwroot/Wikitten。这是我的，你的根据自己情况而定。不过，内部文件结构是差不多的，还有人根据自己的情况进行了修改。如下所示为 Wikitten 的内部结构：

```plain
docker/
library/
plugins/
renderers/#这里有2个文件有bug
--Markdown/
----Markdown.php           #这个文件有bug
----MarkdownExtra.php      #这个文件也有bug
----MarkdownInterface.php
--Wikitten/
--HTML.php
--Markdown.php
--index.html
static/
views/
.gitignore
.htaccess
.user.ini
CHANGELOG.md
DEV.md
LICENSE
README.md
config.php #这个文件，默认是config.php.example
default.php
index.php
login.php
routing.php
wiki.php
```

我并没有写出全部结构。因为其他文件并无变动。

## 访问站点

接下来，就用事先添加好的域名访问了。有一件事情还要提：在宝塔面板网站的域名的设置中，有 SSL 选项。在这里可以获取 Let's Encrypt 的免费证书，通过它就可以强制 HTTPS 访问，这样可以更加安全。

接下来，就可以访问站点：https://yidajiabei.xyz 了！

当你访问时，可能会感觉有点怪，因为我还没有配置好。

## 问题出现及解决

当我进行完上述步骤，开始访问站点时，出现了如下信息：

```plain
Deprecated: Array and string offset access syntax with curly braces is deprecated in /www/wwwroot/Wikitten/renderers/Markdown/Markdown.php on line 1799
```

翻译成中文就是：不赞成使用大括号`{}`的数组和字符串偏移访问语法。（这句话使用软件翻译的）

当我跳转到具体的行数时，我发现都有`{}`的存在，我接下来进行的就是把`{}`改为`[]`。每改一个，刷新一次，当我第一次刷新时，我发现：有关刚才修改的那一行的报错消失了。这说明我的做法能够把这个错误修改为正常状态。

于是，我把接下来的几个错误修改了过来，于是，我能够正常访问了！！！和其他人的一样！！！

**参考资料**：

https://wikitten.vizuina.com/

https://github.com/devaneando/Wikitten

https://www.moerats.com/archives/549/

我搜索了很多相关内容，这三个是最主要的。