---
title: Git - 使用问题
date: 2020-05-10T18:56:56+08:00
categories: ["技术"]
tech: ["Git"]
slug: Git use problems
toc: true
tocNum: true
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

## fatal: refusing to merge unrelated histories

The "fatal: refusing to merge unrelated histories" Git error occurs when two *unrelated* projects are merged (i.e., projects that are not aware of each other’s existence and have mismatching commit histories).

![](/images/refusing-to-merge.png "understandable image")

Consider the following two cases that throw this error:

* You have cloned a project and, somehow, the `.git`  directory got deleted or corrupted. This leads Git to be unaware of your local history and will, therefore, cause it to throw this error when  you try to *push to* or *pull from* the remote repository.
* You have created a new repository, added a few *commits* to it, and now you are trying to *pull* from a remote repository that already has some commits of its own. Git  will also throw the error in this case, since it has no idea how the two projects are related.

### Solution

The error is resolved by toggling the *allow-unrelated-histories* switch. After a `git pull` or `git merge` command, add the following tag:

```git
git pull origin master --allow-unrelated-histories
```

More information can be found [here, ](https://github.com/git/git/blob/master/Documentation/RelNotes/2.9.0.txt#L58-L68) on Git’s official documentation.

## `git push origin master` 后出现：

```bash
$ git push origin master
kex_exchange_identification: read: Connection reset by peer
Connection reset by 192.30.255.112 port 22
fatal: Could not read from remote repository.
```

