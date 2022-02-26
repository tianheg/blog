+++
title = "Docker 基本使用"
date = 2022-02-17T00:00:00+08:00
lastmod = 2022-02-26T14:11:00+08:00
tags = ["技术", "Docker"]
draft = false
toc = true
+++

## 安装 {#安装}

按系统安装：

-   Ubuntu：<https://docs.docker.com/engine/install/ubuntu/>
-   Arch Linux：<https://wiki.archlinux.org/title/Docker>

需要安装：Docker + Docker Compose


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


## 入门指南 {#入门指南}


### 什么是容器？ {#什么是容器}

容器可以看作计算机的进程，但它与一般进程是隔离的。这种隔离策略使用了已经存在很多年的 Linux 内核的特性——命名空间[^fn:5]和控制组 cgroups[^fn:6]。

所有的 container 其实都是在共享主机 Linux 的内核。


### 什么是容器镜像？ {#什么是容器镜像}

> A container image represents binary data that encapsulates an application and all its software dependencies. Container images are executable software bundles that can run standalone and that make very well defined assumptions about their runtime environment.
>
> -- Kubernetes Documentation[^fn:7]
>
> A container image is a static file with executable code that can create a container on a computing system. A container image is immutable—meaning it cannot be changed, and can be deployed consistently in any environment. It is a core component of a containerized architecture.
>
> -- Container Images: Architecture and Best Practices - Aqua[^fn:8]

镜像是二进制数据，它封装了应用运行所需的一切。

在运行镜像时，使用的是孤立系统，与主机隔离。

可以把容器视为 `chroot` 的扩展。文件系统来自镜像，但比 `chroot` 多了一层隔离。


### 什么是容器 volumes？ {#什么是容器-volumes}

每次容器从镜像中构建时，都会是一个全新的开始，过去对旧有的容器做过的更改无法保存在新创建的容器上。当我们希望保存这些更改时，volumes 就出现了。它可以将容器的目标路径，挂载至主机系统中。当我们对当前容器中的文件进行修改时，这些修改会被保存至主机系统的特定 volume 中，即便当前容器被销毁，重新创建同样容器时，因为使用的还是之前的 volume，所以那些修改还在，也就达到了我们跨容器保存数据修改的目的。

volumes 有两种主要类型：named volumes 和 bind mounts。前者可以不必关心数据在主机的位置，但当我们想把主机的一些内容放到容器中时，named volumes 就无法达到目的。于是，bind mounts 就有了用武之地。它能把主机中的数据载入容器中，使得我们可以在容器中对数据进行操作。


### 多容器应用（TODO + MySQL） {#多容器应用-todo-plus-mysql}

一个容器是一个进程，最好只做一件事。

容器之间是互相隔离的，怎样才能通信呢？通过网络。 **如果两个容器在相同网络环境下，它们便能互相通信；反之则不能。**

以下是来自官方教程的命令（我修改了细节）：

```sh
# 创建网络
docker network create todo-app
# 在已创建的网络下，创建数据库todos，并创建网络别名mysql
docker run -d \
     --network todo-app --network-alias mysql \
     -v todo-mysql-data:/var/lib/mysql \
     -e MYSQL_ROOT_PASSWORD=secret \
     -e MYSQL_DATABASE=todos \
     mysql:8.0
# 检查todos是否创建成功
docker exec -it <mysql-container-id> mysql -u root -p
mysql> SHOW DATABASES;
 +--------------------+
 | Database           |
 +--------------------+
 | information_schema |
 | mysql              |
 | performance_schema |
 | sys                |
 | todos              |
 +--------------------+
 5 rows in set (0.00 sec)
# 使用nicolaka/netshoot提供的dig命令检查mysql是否和todo应用在同一网络
docker run -it --network todo-app nicolaka/netshoot
dig mysql
```

注意：不要在生产环境中使用环境变量，更安全的做法是使用 .env 之类的文件[^fn:9]。


### 使用 Docker Compose {#使用-docker-compose}

在应用跟路径新建文件 `docker-compose.yml` ：

```yml
version: "3.7"

services:
  app:
    image: node:12-alpine
    command: sh -c "yarn install && yarn run dev"
    ports:
      - 3000:3000
    working_dir: /app
    volumes:
      - ./:/app
    environment:
      MYSQL_HOST: mysql
      MYSQL_USER: root
      MYSQL_PASSWORD: secret
      MYSQL_DB: todos

  mysql:
    image: mysql:8.0
    volumes:
      - todo-mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: todos

volumes:
  todo-mysql-data:
```

确保之前运行的容器都已经停止。

在当前应用根路径下运行，启动容器：

```sh
docker-compose up -d
```

查看日志：

```sh
docker-compose logs -f
```

全部停止：

```sh
docker-compose down # 该命令不删除创建的 volumes
docker-compose down --volumes # 该命令删除创建的volumes
```


### 安全检查 {#安全检查}

```sh
docker scan image_name
```


## 常用命令 {#常用命令}

```sh
docker version # 输出Docker版本、系统等信息

docker ps # 列出所有正在运行的容器
docker ps -a # 列出所有容器
docker build -t image_name . # 根据当前目录下的Dockerfile，构建镜像
docker run -dp 3000:3000 image_name # 后台运行image_name，本地端口3000，容器内端口也是3000

## 在对image内容进行修改后，需要再次运行 docker build 以更新构建
docker stop container_name # 停止正在运行容器
docker rm -f container_name # 移除正在运行容器
docker rm container_name # 移除已停止容器

## 发布自己的image
docker push USER_NAME/image_name

## 在容器内部执行命令
docker exec <container-id> command

## 管理镜像
docker image
docker image history image_name # 查看镜像层
## 管理容器
docker container

## volume相关
docker volume create volume_name # 创建一个 volume
docker run -v volume_name:/container/path image_name # 连接 volume 至容器路径
docker run -v "$(pwd):/container/path" image_name # 将主机所在的当前路径，放进容器的目标路径
```

---
参考资料

1.  <https://docs.docker.com/get-started/>

[^fn:1]: <https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user>
[^fn:2]: <https://docs.docker.com/engine/install/linux-postinstall/#configure-docker-to-start-on-boot>
[^fn:3]: <https://docs.docker.com/config/daemon/systemd/>
[^fn:4]: <https://docs.docker.com/engine/install/linux-postinstall/#configure-where-the-docker-daemon-listens-for-connections>
[^fn:5]: <https://man7.org/linux/man-pages/man7/namespaces.7.html>
[^fn:6]: <https://medium.com/@saschagrunert/demystifying-containers-part-i-kernel-space-2c53d6979504>
[^fn:7]: <https://kubernetes.io/docs/concepts/containers/images/>
[^fn:8]: <https://www.aquasec.com/cloud-native-academy/container-security/container-images/>
[^fn:9]: <https://diogomonica.com/2017/03/27/why-you-shouldnt-use-env-variables-for-secret-data/>