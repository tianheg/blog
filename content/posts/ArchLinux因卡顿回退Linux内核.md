+++
title = "Arch Linux 因卡顿回退 Linux 内核"
date = "2021-08-17T20:12:50+08:00"
tags = ["Arch"]
slug = "arch-linux-downgrade-linux-kernel-because-of-system-freeze"
+++

在未回退以前使用 linux 5.13.10，目前回退到 5.13.9，暂时正常。

设置 BIOS U 盘启动，插入制作好的 USB 启动盘，进入 U 盘中的 arch 系统，然后执行命令：

```sh
mount /dev/sdb2 /mnt
arch-root /mnt /bin/bash
cd /var/cache/pacman/pkg
ls -a | grep linux
pacman -U linux-5.13.9.arch1-1-x86_64.pkg.tar.zst
# linux kernel: 5.13.10 --> 5.13.9
```

ref: <https://wiki.archlinux.org/title/downgrading_packages#Downgrading_the_kernel>
