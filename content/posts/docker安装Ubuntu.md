---
title: Docker 安装 Ubuntu
date: 2020-05-10T10:19:26+08:00
categories: ["技术"]
tech: ["Docker"]
slug: docker install ubuntu
---

```bash
D:\A\
λ docker search Ubuntu     # 查找 Ubuntu 镜像
```

```bash
D:\A\
λ docker pull ubuntu     # 安装 Ubuntu 镜像
Using default tag: latest
latest: Pulling from library/ubuntu
d51af753c3d3: Pull complete
fc878cd0a91c: Pull complete
6154df8ff988: Pull complete
fee5db0ff82f: Pull complete
Digest: sha256:747d2dbbaaee995098c9792d99bd333c6783ce56150d1b11e333bbceed5c54d7
Status: Downloaded newer image for ubuntu:latest
docker.io/library/ubuntu:latest
```

```bash
D:\A\
λ docker images     # 查看 docker 镜像
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu              latest              1d622ef86b13        8 days ago          73.9MB
docker/doodle       cheers              82b1ca5c25eb        10 months ago       3.76MB
```

```bash
D:\A\
λ docker run -it -d --name ubuntu_test -p 8088:80 ubuntu     # 运行 docker 镜像
# --name 自定义容器名 -p 指定端口映射 前者为虚拟机端口，后者为容器端口 成功后返回 id
14e201b84f7903bd4f6087728f033d12bd4bb2d47af791e062d9d4ca96bcac1d
```

```bash
D:\A\
λ docker ps     # 查看所有启动的容器（查看所有容器加 -a ）
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                  NAMES
14e201b84f79        ubuntu              "/bin/bash"         8 minutes ago       Up 8 minutes        0.0.0.0:8088->80/tcp   ubuntu_test
```

```bash
D:\A\
λ docker inspect 14     # 根据 id 查看容器信息
...
... #表示很多行
...
```

```bash
D:\A\
λ docker exec -it 14 /bin/bash     # 进入 docker （或者把容器 id:14 改为容器名）
root@14e201b84f79:/# exit     # 退出容器
exit
```

```bash
D:\A\
λ docker stop 14     # 停止容器
14
```

```bash
D:\A\
λ docker commit 14 ubuntu_test1:1.0     # 制作 docker 镜像
sha256:90e4dd8353a58d840d9f11c7cffddcc2ec083a47d0c3b230e05ced5c23be694c
# 镜像名字（ubuntu_tets1）随意 1.0为版本号，需要添加
```

```bash
D:\A\
λ docker images     # 查看镜像是否创建
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
ubuntu_test1        1.0                 90e4dd8353a5        18 seconds ago      73.9MB
ubuntu              latest              1d622ef86b13        8 days ago          73.9MB
docker/doodle       cheers              82b1ca5c25eb        10 months ago       3.76MB
# 此镜像只能本地使用，在其他机器使用需打包
```

```bash
# 以下命令：打包镜像并查看
D:\A\
λ docker save -o ubuntu_test1.tar ubuntu_test1:1.0

D:\A\
λ ls
LICENSE  LICENSE-APACHE  LICENSE-MIT  README.md  install.sh  ipfs.exe  ubuntu_test1.tar
```

