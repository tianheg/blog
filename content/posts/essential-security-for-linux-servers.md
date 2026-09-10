---
title: '为 Linux 服务器设置的重要安全措施'
date: 2023-01-17T21:29:00+08:00
tags: ['技术', Linux]
---

[My First 5 Minutes On A Server; Or, Essential Security for Linux Servers – Sol Love](https://sollove.com/2013/03/03/my-first-5-minutes-on-a-server-or-essential-security-for-linux-servers/)

作者的安全哲学：采取一些措施，它们必须能够阻止那些最频繁的攻击方向，同时让服务器管理不至于因为过于安全而繁琐。

服务器只有两个用户：root 和部署用户。部署用户通过一段长密码获得 sudo 权限，它也是开发者登入的账户。开发者通过公钥而非密码登入，这样系统管理就变成在多个服务器之间保证 `authorized_keys` 文件的最新。root 用户无法通过 ssh 登入，部署用户只能从指定公司 IP 段登入。这种方法的缺点是，如果 `authorized_keys` 文件遭到破坏或被错误授权，需要登录到远程终端来修复它。

作者声明这并非自己的主张，只是自己的经验：

> Note: I’m not advocating this as the most secure approach – just that it balances security and management simplicity for our small team. From my experience, most security breaches are caused either by insufficient security procedures or sufficient procedures poorly maintained.

## 改变 root 密码

密码要很长，可以记不住，但要保存在安全的地方。

我通过 Vagrant 新建了 Ubuntu 22.04：

```bash
vagrant init generic/ubuntu2204
vagrant up
```

默认情况下，无法使用 root 账户进行操作：

```bash
su root
# su: Authentication failure
```

需要设置 root 密码：

```bash
sudo passwd root
```

解答来自：<https://askubuntu.com/a/314098>

## 更新包

通过包管理器更新包。Ubuntu 的更新命令：

```bash
apt-get update
apt-get upgrade
```

## 安装 Fail2ban

```bash
apt-get install fail2ban
```

Fail2ban 是一种守护进程，用于监控登录服务器的行为，并阻挡可疑的登录。开箱即用。

## 设置登录用户

用户名为 deploy，选择你喜欢的。

```bash
useradd deploy
mkdir /home/deploy
mkdir /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
```

## 公钥授权

```bash
vim /home/deploy/.ssh/authorized_keys
```

在文件中添加，你本地机器的 id_rsa.pub 文件或其他 ssh 公钥文件内容。

```bash
chmod 400 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy -R
```

## 测试新用户并开启 sudo 权限

```bash
passwd deploy
visudo
```

注释掉所有存在的 用户/组，并加上：

```text
root    ALL=(ALL) ALL
deploy  ALL=(ALL) ALL
```

## 锁定 SSH

```bash
vim /etc/ssh/sshd_config
```

修改/添加的内容：

```text
PermitRootLogin no
PasswordAuthentication no
AllowUsers deploy@(your-ip) deploy@(another-ip-if-any)
```

重启 ssh：

```bash
service ssh restart
```

## 设置防火墙

```bash
ufw allow from {your-ip} to any port 22
ufw allow 80
ufw allow 443
ufw enable
```

## 开启自动安全更新

```bash
apt-get install unattended-upgrades

vim /etc/apt/apt.conf.d/10periodic
```

将文件更新为：

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

```bash
vim /etc/apt/apt.conf.d/50unattended-upgrades
```

将文件更新为：

```text
Unattended-Upgrade::Allowed-Origins {
        "Ubuntu lucid-security";
//      "Ubuntu lucid-updates";
};
```

## 安装 Logwatch 用于监控日志

```bash
apt-get install logwatch

vim /etc/cron.daily/00logwatch
```

添加到文件下面的内容：

```text
/usr/sbin/logwatch --output mail --mailto test@gmail.com --detail high
```

以上就是该文章的全部内容。

Hacker News 关于此问题的讨论：<https://news.ycombinator.com/item?id=5316093>
