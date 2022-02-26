+++
title = "云服务器配置 Git 仓库托管并使用 Git Hooks 自动执行脚本"
date = 2021-10-11T00:00:00+08:00
lastmod = 2022-02-26T14:56:47+08:00
tags = ["技术", "Git"]
draft = false
+++

上文见[部署 Hugo 博客到 Ubuntu 服务器](/posts/hugo-deploy-to-server/)。

之前的博客更新思路是，本地提交修改至 GitHub，再登陆云服务器，手动执行脚本，达到更新博客内容的目的。但是，从 GitHub 拉取代码较慢，于是想到可以把本地的更改同时推送到 GitHub 和云服务器。再通过 Git Hooks 自动执行「更新博客」的脚本，以此达到提升效率的目的。


## 更新 Git 至最新版本 {#更新-git-至最新版本}

云服务器的系统是 Ubuntu 20.04，所以可以通过以下命令安装 Git 的最新版本：

```sh
add-apt-repository ppa:git-core/ppa
apt update
apt install git
```


## 创建 Git 用户 {#创建-git-用户}

```sh
adduser git # note difference with useradd
passwd git # add password for git user
sudo visudo
```

修改 `/etc/sudoers` ：

```cfg
root    ALL=(ALL)       ALL
ubuntu  ALL=(ALL:ALL) NOPASSWD: ALL
git  ALL=(ALL:ALL) NOPASSWD: ALL # add
```


## 配置 ssh 公匙 {#配置-ssh-公匙}

在本地主机执行以下命令：

```sh
ssh-keygen -t ed25519 -C "email"
```

会生成两个文件：id_ed25519 和 id_ed25519.pub。将 id_ed25519.pub 文件里的内容复制到云服务器的 authorized_keys 文件中：

```sh
su git
mkdir ~/.ssh
vim ~/.ssh/authorized_keys
```

然后在本地添加私匙：

```sh
ssh-add ~/.ssh/ssh_rsa
```

如果不添加私匙，还是提示输入密码。

注意： `~` 代表 `/home/git` 。只有 git 用户才能使用这个公匙。

修改权限：

```sh
cd ~
chmod 600 .ssh/authorized_keys
chmod 700 .ssh
```

本地测试 git 服务：

```sh
ssh -v git@server-ip # Server public network IP
```


## 创建博客文件夹 {#创建博客文件夹}

```sh
su root # switch to root user
mkdir /home/hugo
chown git:git -R /home/hugo
```


## 更改站点目录权限 {#更改站点目录权限}

```sh
sudo chown git:git -R /var/www/hugo # for git hook
```


## 创建 bare 仓库并配置 Git Hook {#创建-bare-仓库并配置-git-hook}

```sh
su root
cd /home/git
git init --bare blog.git
chown git:git -R blog.git
vim blog.git/hooks/post-receive
chmod +x blog.git/hooks/post-receive
```

新建文件 `blog.git/hooks/post-receive` ：

```bash
#!/bin/sh
git --work-tree=/home/hugo --git-dir=/home/git/blog.git checkout -f
cd /var/www/hugo
rm -rf * # 删除文件夹下的所有文件以保持最新
cd /home/hugo
hugo --minify -d /var/www/hugo
```


## 本地配置云服务器仓库 {#本地配置云服务器仓库}

```sh
git remote add origin git@server-ip:/home/git/blog.git
git push -u origin main # first push
```

---
参考资料

1.  <https://segmentfault.com/a/1190000039676421>
2.  <https://www.saintsjd.com/2011/01/what-is-a-bare-git-repository/>