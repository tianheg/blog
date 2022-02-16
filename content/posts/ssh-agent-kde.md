+++
title = "KDE 开机自启 ssh agent，加载密匙"
date = 2021-12-26T00:00:00+08:00
lastmod = 2022-02-16T14:59:47+08:00
tags = ["技术", "SSH", "KDE"]
draft = false
+++

1.  [Using the KDE Wallet to store ssh key passphrases](https://wiki.archlinux.org/title/KDE_Wallet#Using_the_KDE_Wallet_to_store_ssh_key_passphrases)
2.  [KDE Plasma &amp; ssh keys](https://dev.to/manekenpix/kde-plasma-ssh-keys-111e)

[Kwallet](https://userbase.kde.org/KDE_Wallet_Manager) 是 Linux 桌面管理器 KDE 下的一款管理密码的应用。


## Kwallet {#kwallet}

创建一个新钱包，并为它设置密码。


## 开机启动 ssh-agent {#开机启动-ssh-agent}

确保安装了 [Ksshaskpass](https://github.com/KDE/ksshaskpass)。

新建文件 `~/.config/plasma-workspace/env/ssh-agent-startup.sh` ：

```sh
#!/bin/sh

eval "$(ssh-agent -s)"
```

通过 KDE 的系统设置中 Autostart 设置， `Add Login Script` 。添加新建的这个文件，之后会自动生成文件 `~/.config/autostart/ssh-agent-startup.sh.desktop` 。

不要忘记让 Shell 文件可执行：

```sh
sudo chmod +x ~/.config/plasma-workspace/env/ssh-agent-startup.sh
```


## 开机添加 ssh 密匙 {#开机添加-ssh-密匙}

新建文件 `~/.config/autostart/ssh-add.desktop` ：

```cfg
[Desktop Entry]
Exec=ssh-add ~/.ssh/key
Name=ssh-add
Type=Application
```


## 环境变量与普通应用 {#环境变量与普通应用}

启动 ssh agent 要比添加 ssh 密匙提前。因为前者使用的是环境变量，后者使用的只是普通应用自启动。