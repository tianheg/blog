---
title: 记录使用 nvm
date: 2020-04-04T07:56:10+08:00
categories: ["技术"]
tech: ["Node.js"]
slug: record use nvm
keywords: []
description: ""
---

一、nvm和nodejs的安装路径不能有空格，否则会报错：

nvm use 出问题 $ nvm use 7.2.0 exit status 1: 'D:\My

https://segmentfault.com/q/1010000007654139

二、设置npm全局安装路径

`npm config set prefix "....\nodejs\node_global"`

`npm config set cache "....\nodejs\node_cache"`

参考https://blog.csdn.net/traguezw/article/details/54577560

三、原来的node没有卸载干净，导致通过nvm安装node好后，输入npm没有反应

四、系统环境变量设置：

| Variable    | Value         |
| ----------- | ------------- |
| NVM_HOME    | C:\dev\nvm    |
| NVM_SYMLINK | C:\dev\nodejs |

另外，在Path中，添加：`%NVM_HOME%`隔一行`%NVM_SYMLINK%`。

原本有以下变量时，能够使用node和npm：

| Variable  | Value                                        |
| --------- | -------------------------------------------- |
| NODE_PATH | C:\dev\nvm\v12.16.1                          |
| Path      | C:\dev\nvm\v12.16.1\node_modules\npm\scripts |

我删去之后发现：依然能够使用node和npm。

我在昨天输入node和npm时，是没有输出的。我重启电脑很多次，按照网络上的文章删除全部的node原来的残留。

今天，我打开终端，输入`nvm use 12.16.1`，显示`Now using node v12.16.1 (64-bit)`。到这一步没有问题，是之前都出现过的输出。

然后，我输入`nvm node`，他显示自己的nvm的版本号和使用nvm的指令；然后输入`node`，输出`Welcome to Node.js v12.16.1. ......`。这说明，node命令可以使用；然后输入`npm`，正常输出npm的使用命令。

另外，昨天在我敲入`nvm use 12.16.1`时，并没有生成`C:\dev\nodejs`文件夹。现在它生成了。

五、在Path的最前面添加`;%NPM_HOME%`，注意了，这个一定要添加在 `%NVM_SYMLINK%`之前，所以我们直接把它放到Path的最前面
