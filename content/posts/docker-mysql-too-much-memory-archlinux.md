+++
title = "Arch Linux 下使用 Docker MySQL 占用过高内存"
date = 2022-02-18T00:00:00+08:00
lastmod = 2022-02-18T22:54:25+08:00
tags = ["技术", "Docker", "MySQL", "Archlinux"]
draft = false
+++

## 系统环境 {#系统环境}

```text
> neofetch --off
OS: Arch Linux x86_64
Host: HP Laptop 14s-cr0xxx
Kernel: 5.16.10-arch1-1
Shell: zsh 5.8.1
DE: Plasma 5.24.1
WM: KWin
CPU: Intel i5-8250U (4) @ 3.400GHz
Memory: 3268MiB / 23925MiB

> docker version
Client:
 Version:           20.10.12
 API version:       1.41
 Go version:        go1.17.5
 Git commit:        e91ed5707e
 Built:             Mon Dec 13 22:31:40 2021
 OS/Arch:           linux/amd64
 Context:           default
 Experimental:      true

Server:
 Engine:
  Version:          20.10.12
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.17.5
  Git commit:       459d0dfbbb
  Built:            Mon Dec 13 22:30:43 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          v1.6.0
  GitCommit:        39259a8f35919a0d02c9ecc2871ddd6ccf6a7c6e.m
 runc:
  Version:          1.1.0
  GitCommit:        v1.1.0-0-g067aaf85
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```


## 复现步骤 {#复现步骤}

```sh
docker run -d --rm --name mysql5.7 -e MYSQL_ROOT_PASSWORD=passwd mysql:5.7
# 这里 mysql 版本为 5.7.37

docker run -d --rm --name mysql -e MYSQL_ROOT_PASSWORD=passwd mysql
# 这里 mysql 版本为 8.0.27

docker stats
# 实时 CPU、内存占用显示
```

我的情况是：

版本 5 情况下，内存占用高低变化，从 1G 到 16G（总内存 23G），1 分钟后稳定在 16G；CPU 占用一开始在 100%，甚至超过，1 分钟后也稳定下来，不到 0.5%。 `BLOCK I/O` 一直是 `0B / 292MB` ，这可能是一个关键点。

版本 8 情况下，内存占用很稳定，382M；CPU 占用不超过 0.5%。 `BLOCK I/O` 为 `25.4MB / 258MB` 。

`I/O` 表示输入与输出。

只出不入，容易壅塞。

一条相关 GitHub issue：<https://github.com/docker-library/mysql/issues/579>