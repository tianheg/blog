---
title: Git - 使用问题
date: 2020-05-10T18:56:56+08:00
categories: ["技术"]
tech: ["Git"]
slug: Git use problems
toc: true
tocNum: true
keywords: ["Git"]
description: "记录使用 Git 过程中出现的错误，以及解决的过程"
---

## 当 git pull 失败时

报错：

```bash
λ git pull
remote: Enumerating objects: 3, done.
remote: Counting objects: 100% (3/3), done.
remote: Compressing objects: 100% (3/3), done.
error: RPC failed; curl 18 transfer closed with outstanding read data remaining
fatal: the remote end hung up unexpectedly
fatal: early EOF
fatal: index-pack failed
```

## 当添加子模块连接有问题时

报错：

```
repo URL: 'master' must be absolute or begin with ./|../
```

这一错误出现在 **我添加子模块** 时，以后再复现，解决

## 当本地分支推送至远程本地名称输入错误时

报错：

```bash
E:\>git push origin master
error: src refspec master does not match any
error: failed to push some refs to 'git@github.com:Name/repo.git'
```

在该例子中，我的本地分支实际上是 `gh-pages`，所以正确的命令为：`git push origin gh-pages`

## 当 https 连接被误以为 ssh 连接时

报错：

```
git push
fatal: HttpRequestException encountered
输入 GitHub 用户名
输入 GitHub 密码
成功推送
```

