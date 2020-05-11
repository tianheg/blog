---
title: Git - 使用问题
date: 2020-05-10T18:56:56+08:00
tags: []
categories: ["技术"]
series: ["Git"]
slug: Git use problems
keywords: ["Git"]
description: ""
---

## git pull 报错

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

## repo URL: 'master' must be absolute or begin with ./|../

## 在使用gitpush推送至远程时，如果本地分支名错误，会报错：

```bash
E:\>git push origin master
error: src refspec master does not match any
error: failed to push some refs to 'git@github.com:Name/repo.git'
```

在该例子中，我的本地分支实际上是 `gh-pages`，所以正确的命令为：`git push origin gh-pages`