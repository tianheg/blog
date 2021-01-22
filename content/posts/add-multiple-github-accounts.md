---
title: "为本地添加多个 GitHub 账户"
date: 2020-06-12T17:51:00+08:00
description: "记录在本地如何添加多个 GitHub 账户"
tags: ["Git"]
keywords: ["Git"]
---

重要参考：[使用 SSH 连接到 GitHub（多帐号）](https://io-oi.me/tech/ssh-with-multiple-github-accounts/)

```bash
solve the hexo deploy problem:

Omit --global to set the identity only in this repository.

It tells me I must add the global user.name and user.email, but I didn't want to do that. Then, I can't find the ways to solve it and I add the global configuration. However, it's no use!
```

以上是我遇到的问题：在执行 `hexo deploy` 时报错。

根据提示，我应该把全局 `user.name` 和 `user.email` 改为我要提交的 GitHub 的账号信息。但是，这是不行的。因为我使用了两个 GitHub 账号，如果设置了全局的信息。本该是 A 账号的提交却变成 B 账号，此时 GitHub 的 commits 统计就不会显示非当前账号用户的提交，另外，如果你从别人的仓库 fork 到你自己的仓库，在本地提交给你自己的 forked 的仓库，也是无法显示 commits 提交的。

对于多个 GitHub 账号，网络中大多是在路径：`~/.ssh/` 下新建文件名为 `config` 。并在其中写入以下下内容：

```plain
# Personal account, - the default config
Host github.com
   HostName github.com
   User git
   IdentityFile ~/.ssh/id_rsa
   
# Work account-1
Host github.com-work_user1    
   HostName github.com
   User git
   IdentityFile ~/.ssh/id_rsa_work_user1
```

但是，我发现这样做无法解决问题，即便在设置全局变量之后。

我再次搜索，发现可以为当前仓库单独设置变量，即使用命令：

```bash
git config --local user.name ""
git config --local user.email ""
```

在引号中输入你的 GitHub 账号 id 和对应的用于登录的邮箱。此时，你的提交信息就会显示你的名字和你的邮箱。

之后，我发现这样做可行，能够在 GitHub 中显示我的提交。

至于 hexo deploy 问题的解决，我特别沮丧，因为我怎样设置，也没有办法解决。我尝试了：

1. 设置 global 变量(user.name, user.email)
2. 设置 local 变量(user.name, user.email)
3. 配置 config

最后，在尝试完了以上步骤之后，我发现：`hexo deploy` 和 `git push origin master` 有很大区别。

前者是将 public 文件夹的内容推送至目标仓库，后者是将本地仓库所有内容推送至目标仓库。前者能在目标仓库生成网页，后者却不能。这样的收获也算是意外所得。

经过这一系列的过程之后，我发现：自己再也无法使用 hexo 了，于是我全心投入 hugo 的怀抱。

---

参考链接：

1. <https://www.fofxacademy.com/how-to-setup-git-on-your-pc-for-multiple-github-accounts/>
2. <https://www.freecodecamp.org/news/manage-multiple-github-accounts-the-ssh-way-2dadc30ccaca/> (理解更清晰)
