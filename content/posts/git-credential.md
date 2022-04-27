+++
title = "Git Credential"
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-04-27T16:05:54+08:00
tags = ["技术", "Git"]
draft = false
+++

<https://git-scm.com/docs/gitcredentials>

## Credential 的描述 {#credential-的描述}

Git 有时需要来自用户的凭证来执行操作；例如，为了通过 HTTP 访问远程存储库，它可能需要请求用户名和密码。本手册描述了 Git 用于请求这些凭据的机制，以及避免重复输入这些凭据的一些特性。

## 请求凭证 {#请求凭证}

在未定义凭证助手（credential helpers）的情况下，Git 会采用一下策略得到用户名和密码：

1.  如果设置了 `GIT_ASKPASS` 环境变量，变量指定的程序会被触发。命令行会输出一个合理的提示，提醒用户输入用户名和密码
2.  如果设置了 `core.askPass` 配置变量，它的行为如 1 所见
3.  如果设置了 `SSH_ASKPASS` 环境变量，它的行为如 1 所见
4.  否则，终端会提示用户

## 避免冗杂 {#避免冗杂}

重复输入某些凭证，令人讨厌。Git 提供了两种解决办法：

1.  用于给定验证上下文的用户名的静态配置
2.  凭据助手可以缓存或存储密码，或者与系统密码钱包或钥匙链进行交互

---

<https://stackoverflow.com/a/51327559>

Git Credential 是为了保存用户名和密码而存在的，然而最安全的办法还是使用 SSH 密钥，不使用用户名和密码。

## 使用 SSH 密钥 {#使用-ssh-密钥}

创建好一个 SSH 密钥对，私匙保存在本地，公匙存放在目标服务器。在本地添加私匙到 ssh-agent ：

```sh
ssh-add ~/.ssh/id_rsa
```

## Caching {#caching}

```sh
git config --global credential.helper cache
# or
git config --global credential.helper 'cache --timeout=3600'
```

## Store {#store}

使用该选项，会将用户名和密码保存为纯文本，容易被窃取了。

```sh
git config credential.helper store
```