+++
title = "ssh-agent"
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-02-16T15:00:01+08:00
tags = ["技术", "SSH"]
draft = false
+++

<https://www.ssh.com/academy/ssh/agent>


## 什么是 ssh-agent？ {#什么是-ssh-agent}

`ssh-agent` 是一个帮助程序，帮助记录用户们的身份密钥和对应的密匙。记录之后，用户便能够登陆对应服务器，而不需要重复输入密码或密匙。这是单点登陆（SSO，single-sign-on）的一种实现方式。

SSH agent 被用于 SSH 公钥验证。它使用 SSH 密钥进行身份验证。用户可以通过 `ssh-keygen` 新建 SSH 密钥，通过 `ssh-copy-id` 将对应的公匙上传至待登录服务器的 `.ssh/authorized_keys` 文件中。


## 启动 `ssh-agent` {#启动-ssh-agent}

在大多数 Linux 系统中， `ssh-agent` 是自启动的。如果未启动的话可以使用 `` eval `ssh-agent` `` 启动。为了允许通过密钥登录，需要开启公钥授权。这在 OpenSSH 中是默认开启的。由位于 `/etc/ssh/sshd_config` 文件中的 `PubkeyAuthentication` 选项确定。


## 为 Agent 添加 SSH 密钥 {#为-agent-添加-ssh-密钥}

```sh
ssh-add ~/.ssh/id_rsa
ssh-add -l # list added keys
```


## 转发 SSH Agent {#转发-ssh-agent}


## `ssh-agent` 命令 {#ssh-agent-命令}


## 延伸阅读 {#延伸阅读}

-   [SSH Key Management](https://www.ssh.com/academy/iam/ssh-key-management)