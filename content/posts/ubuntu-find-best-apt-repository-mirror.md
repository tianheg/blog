---
title: 'Ubuntu 找到最好镜像'
date: 2022-11-13T15:37:00+08:00
tags: ['技术']
---

https://ostechnix.com/how-to-find-best-ubuntu-apt-repository-mirror/

1. 备份原 `/etc/apt/sources.list` 文件
2. `sudo apt install python3-pip`
3. `pip install install apt-select`
4. `apt-select --country SG` 新加坡

通过以下命令可以得到自己当前 IP 的 Ubuntu 镜像地址：

```bash
    wget -qO - mirrors.ubuntu.com/mirrors.txt
```
