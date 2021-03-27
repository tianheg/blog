---
title: "生成 ssh 密匙并添加到 Github"
date: 2020-05-13T21:55:40+08:00
description: "记录如何生成 ssh 密匙，并添加到 GitHub"
tags: ["Git"]
keywords: ["Git"]
---

## 生成新 SSH 密钥并添加到 ssh-agent

### 生成新 SSH 密钥

1.打开 Terminal（终端）。

2.粘贴下面的文本（替换为你的 GitHub 电子邮件地址）。

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

这将创建以所提供的电子邮件地址为标签的新 SSH 密钥。

```bash
> Generating public/private rsa key pair.
```

3.提示您“Enter a file in which to save the key（输入要保存密钥的文件）”时，按 Enter 键。 这将接受默认文件位置。

```bash
> Enter a file in which to save the key (/home/you/.ssh/id_rsa): [Press enter]
```

4.在提示时输入安全密码。

```bash
> Enter passphrase (empty for no passphrase): [Type a passphrase]
> Enter same passphrase again: [Type passphrase again]
```

### 将 SSH 密钥添加到 ssh-agent

将新 SSH 密钥添加到 ssh-agent 以管理密钥之前，应检查现有 SSH 密钥并生成新 SSH 密钥。

1.在后台启动 ssh 代理。

```bash
$ eval "$(ssh-agent -s)"
> Agent pid 59566
```

2.将 SSH 私钥添加到 ssh-agent。如果创建了不同名称的密钥，或者要添加不同名称的现有密钥，请将命令中的 id_rsa 替换为私钥文件的名称。

```bash
ssh-add ~/.ssh/id_rsa
```

3.将 SSH 密钥：id_rsa.pub 添加到 GitHub 帐户。

---

**参考资料**：

1. [生成新 SSH 密钥并添加到 ssh-agent](https://help.github.com/cn/github/authenticating-to-github/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#adding-your-ssh-key-to-the-ssh-agent)
