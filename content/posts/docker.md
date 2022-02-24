+++
title = "Docker 基本使用"
date = 2022-02-17T00:00:00+08:00
lastmod = 2022-02-23T15:02:55+08:00
tags = ["技术", "Docker"]
draft = false
toc = true
+++

## 安装 {#安装}

按系统安装：

-   Ubuntu：<https://docs.docker.com/engine/install/ubuntu/>
-   Arch Linux：<https://wiki.archlinux.org/title/Docker>


## 配置 {#配置}


### non-root 执行命令[^fn:1] {#non-root-执行命令}

```sh
sudo groupadd docker
sudo usermod -aG docker $USER # 把 $USER 替换成当前用户
## 登出再登陆，使更改生效。也可以运行以下命令激活改变
newgrp docker
## 验证可以没有 sudo 运行 docker
docker run hello-world
```


### 开机启动 Docker[^fn:2] {#开机启动-docker}

```sh
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```


### 自定义 Docker 守护进程[^fn:3] {#自定义-docker-守护进程}

```sh
# 开启 Docker 守护进程
sudo systemctl start docker
```

通过修改 `/etc/docker/daemon.json` 文件进行自定义。这个文件能覆盖大部分 Docker 守护进程配置选项，不能通过它配置 HTTP 代理。

运行时目录和存储驱动：

```json
{
    "data-root": "/mnt/docker-data",
    "storage-driver": "overlay2"
}
```

配置守护进程监听端口[^fn:4]：

有两种方式，一种通过 `daemon.json` 一种通过 `systemd` 。只介绍第一种。

一、在 `/etc/docker/daemon.json` 中设置 `hosts` 连接到 UNIX 套接字和 IP 地址。

```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://127.0.0.1:2375"]
}
```

二、重启 Docker

三、通过 `netstat` 命令检查更改生效与否

```sh
sudo netstat -lntp | grep dockerd
```

在重启 Docker 这一步出错，通过 `sudo systemctl restart docker.service` 无法重启。再次阅读文档后，发现第一种方式适合不使用 systemd 的发行版。我的 Arch Linux 使用 systemd，所以无法通过第一种方式配置。

第二种配置方式：

```sh
sudo vim /usr/lib/systemd/system/docker.service
```

找到 `ExecStart` 并按以下方式修改：

```diff
- ExecStart=/usr/bin/dockerd -H fd://
+ ExecStart=/usr/bin/dockerd -H fd:// -H tcp://127.0.0.1:2375
```

重载 `systemctl` 配置，重启 Docker：

```sh
sudo systemctl daemon-reload
sudo systemctl restart docker.service
```

此时检查端口，发现可行：

```sh
sudo netstat -lntp | grep dockerd
# tcp        0      0 127.0.0.1:2375          0.0.0.0:*               LISTEN      8823/dockerd
```


## 入门指南[^fn:5] {#入门指南}


### 什么是容器？ {#什么是容器}

容器可以看作计算机的进程，但它与一般进程是隔离的。这种隔离策略使用了已经存在很多年的 Linux 内核的特性——命名空间[^fn:6]和控制组 cgroups[^fn:7]。

所有的 container 其实都是在共享主机 Linux 的内核。


### 什么是容器镜像？ {#什么是容器镜像}

> A container image represents binary data that encapsulates an application and all its software dependencies. Container images are executable software bundles that can run standalone and that make very well defined assumptions about their runtime environment.
>
> -- Kubernetes Documentation[^fn:8]
>
> A container image is a static file with executable code that can create a container on a computing system. A container image is immutable—meaning it cannot be changed, and can be deployed consistently in any environment. It is a core component of a containerized architecture.
>
> -- Container Images: Architecture and Best Practices - Aqua[^fn:9]

镜像是二进制数据，它封装了应用运行所需的一切。

在运行镜像时，使用的是孤立系统，与主机隔离。

可以把容器视为 `chroot` 的扩展。文件系统来自镜像，但比 `chroot` 多了一层隔离。


## 常用命令 {#常用命令}

```sh
docker ps # 列出所有正在运行的容器
docker ps -a # 列出所有容器
docker build -t image_name . # 根据当前目录下的 Dockerfile，构建镜像
docker run -dp 3000:3000 image_name # 后台运行 image_name，本地端口 3000，容器内端口也是 3000

## 在对 image 内容进行修改后，需要再次运行 docker build 以更新构建
docker stop container_name # 停止正在运行容器
docker rm -f container_name # 移除正在运行容器
docker rm container_name # 移除已停止容器

## 发布自己的 image
docker push USER_NAME/image_name

## 在容器内部执行命令
docker exec <container-id> command
```

[^fn:1]: <https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user>
[^fn:2]: <https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot>
[^fn:3]: <https://docs.docker.com/config/daemon/systemd/>
[^fn:4]: <https://docs.docker.com/engine/install/linux-postinstall/#configure-where-the-docker-daemon-listens-for-connections>
[^fn:5]: <https://docs.docker.com/get-started/>
[^fn:6]: <https://man7.org/linux/man-pages/man7/namespaces.7.html>
[^fn:7]: <https://medium.com/@saschagrunert/demystifying-containers-part-i-kernel-space-2c53d6979504>
[^fn:8]: <https://kubernetes.io/docs/concepts/containers/images/>
[^fn:9]: <https://www.aquasec.com/cloud-native-academy/container-security/container-images/>