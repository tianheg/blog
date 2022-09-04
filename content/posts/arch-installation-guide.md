+++
title = "Arch 安装指南"
author = ["Tianhe Gao"]
date = 2021-08-20T00:00:00+08:00
lastmod = 2022-09-04T20:57:01+08:00
tags = ["技术", "Arch Linux"]
draft = false
toc = true
+++

## 准备 ISO 镜像 {#准备-iso-镜像}

方法一（推荐）：

从[官网下载页面](https://archlinux.org/download/)提供的镜像站下载。然后[验证镜像](https://wiki.archlinux.org/title/Installation_guide#Verify_signature)。

方法二（我的自定制镜像）：

从 [GitHub release](https://github.com/tianheg/archlive/releases) 页面下载。


## 准备安装介质 {#准备安装介质}

我选择 U 盘。直接将 ISO 文件拷贝进 U 盘即可（也可用烧录软件烧录）。


## 进入 BIOS 界面并设置 {#进入-bios-界面并设置}

每个品牌的笔记本进入 BIOS 界面的方式各不相同，我的笔记本是 HP。此外，F9 是更改启动顺序。

按下开机键 -&gt; 持续按 F10 直到出现 BIOS 设置页面

之后进行三项操作：

1.  启动虚拟化（要在主机创建虚拟机，不需要则不必开启）
2.  关闭安全启动
3.  修改 UEFI 模式下的启动顺序：让 USB 启动在前


## 设置命令行键盘布局 {#设置命令行键盘布局}

默认是 US，不必修改。


## 验证 UEFI {#验证-uefi}

```sh
# ls /sys/firmware/efi/efivars
```

有输出，说明启动模式为 UEFI。


## 验证网络 {#验证网络}

```sh
# ping baidu.com -c 3
```

验证网络，0% packet loss 说明网络正常。


## 更新系统时间 {#更新系统时间}

```sh
# timedatectl set-ntp true
```

更新系统时间， `timedatectl status` 检查无误。


## 硬盘分区 {#硬盘分区}

```sh
# fdisk -l
# fdisk /dev/sda
```

1.  `fdisk -l` 查看硬盘信息
2.  `fdisk /dev/sda` 固态硬盘分区

进入 fdisk 操作界面后，

-   m 查看命令帮助
-   p 显示目标硬盘分区
-   g 新建 GPT 分区表
-   创建 sdb1 分区，n 创建分区、分区序号、类型起始扇区默认，结束扇区 +256M。修改分区类型为 EFI System，p 确认为 EFI System
-   创建 sdb2 分区，全部默认。我的安装移除了原系统的 signature

分区结果：

```txt
Device      Start       End   Sectors  Size Type
/dev/sda1    2048    526335    524288  256M EFI System
/dev/sda2  526336 250069646 249543311  119G Linux filesystem
```

关于是否分配 SWAP 分区的讨论：<https://bbs.archlinuxcn.org/viewtopic.php?id=10472>


## 硬盘格式化、新建文件系统 {#硬盘格式化-新建文件系统}

```sh
# mkfs.fat -F32 /dev/sdb1
# mkfs.ext4 /dev/sdb2
# mkfs.ext4 /dev/sda
```


## 挂载分区 {#挂载分区}

```sh
# mount /dev/sdb2 /mnt
# mkdir -p /mnt/boot/efi
# mount /dev/sdb1 /mnt/boot/efi
```


## 选择镜像源 {#选择镜像源}

```sh
# pacman -Syyy reflector # reflector 能够方便地选择镜像源
# reflector -c China -a 6 --sort rate --save /etc/pacman.d/mirrorlist # 这里的 mirrorlist 是 U 盘中的
# pacman -Syyy # y 刷新本地缓存 yyy 强制刷新
```


## 安装基本系统和其他应用 {#安装基本系统和其他应用}

```sh
# pacstrap -i /mnt base base-devel linux linux-firmware dhcpcd vim
```


## 生成挂载表 {#生成挂载表}

```sh
# genfstab -U -p /mnt >> /mnt/etc/fstab
```

检查：

```sh
# cat /mnt/etc/fstab
```


## 进入硬盘，而不在 U 盘 {#进入硬盘-而不在-u-盘}

```sh
# arch-chroot /mnt /bin/bash
```


## 时区和语言 {#时区和语言}

设置时区：

```sh
# ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
# hwclock --systohc --utc
```

配置系统语言环境:

```sh
# vim /etc/locale.gen
```

取消注释：

```txt
en_US.UTF-8 UTF-8
...
zh_CN.UTF-8 UTF-8
```

生成配置：

```sh
# locale-gen
```

设置本地语言环境:

```sh
# vim /etc/locale.conf
```

输入：

```sh
# LANG=en_US.UTF-8
```


## 安装引导程序 {#安装引导程序}

```sh
# pacman -S grub efibootmgr
# grub-install --target=x86_64-efi --bootloader-id=GRUB --efi-directory=/boot/efi
# grub-mkconfig -o /boot/grub/grub.cfg
```

运行 grub-mkconfig 操作时，会出现警告： `Warning: os-prober will not be executed to detect other bootable partitions.` 。查 ArchWiki 后，可以在 /etc/default/grub 中设置 `GRUB_DISABLE_OS_PROBER=false` 。


## 设置主机名 {#设置主机名}

```sh
# echo arch > /etc/hostname
```

在 /etc/hosts 中添加以下内容（ `arch` 是我的主机名）：

```txt
127.0.0.1 localhost
::1 localhost
127.0.0.1 arch.localdomain arch
```


## 配置网络 {#配置网络}

```sh
# pacman -S networkmanager
# systemctl enable NetworkManager
```


## 设置 root 密码 {#设置-root-密码}

```sh
# passwd
```


## 新建普通用户 {#新建普通用户}

```sh
# useradd -m -g users -G wheel -s /bin/bash archie
```

设置普通用户密码：

```sh
# passwd archie
```

设置普通用户权限:

```sh
# EDITOR=vim visudo
```

取消注释：

```sh
## Uncomment to allow members of group wheel to execute any command

%wheel ALL=(ALL) ALL

## Same thing without a password

%wheel ALL=(ALL) NOPASSWD: ALL
```


## 返回 U 盘 {#返回-u-盘}

```sh
# exit
```


## 重启系统 {#重启系统}

```sh
# umount -R /mnt
# reboot
```

开机后改动 BIOS，配置「系统启动」后，拔掉 U 盘。普通用户 archie 登录。


## 启动微码更新 {#启动微码更新}

```sh
# pacman -S intel-ucode
# grub-mkconfig -o /boot/grub/grub.cfg
```


## 完善显卡驱动 {#完善显卡驱动}

这一步要在知道自己显卡配置的前提下执行。

有两种 VA-API or VDPAU

```sh
# pacman -S libva-utils vdpauinfo
# vainfo
# vdpauinfo
```

所以我的是 VA-API，我应该安装 [libva-mesa-driver](https://wiki.archlinux.org/title/Hardware_video_acceleration#:~:text=VA-API%20on%20Radeon%20HD%202000%20and%20newer%20GPUs)。

我的两种 GPU：

00:02.0 VGA compatible controller: Intel Corporation UHD Graphics 620
(rev 07) 01:00.0 Display controller: Advanced Micro Devices, Inc.
[AMD/ATI] Topaz XT [Radeon R7 M260/M265 / M340/M360 / M440/M445 /
530/535 / 620/625 Mobile] (rev c3)

```sh
# pacman -S intel-media-driver vulkan-intel xf86-video-amdgpu xf86-video-ati mesa-vdpau vulkan-radeon
```

不推荐安装 `xf86-video-intel` ，详见 [Intel graphics - ArchWiki](https://wiki.archlinux.org/title/Intel_graphics#:~:text=Often%20not%20recommended%2C%20see%20note%20below)

Refers:

1.  <https://wiki.archlinux.org/title/Hardware_video_acceleration>
2.  <https://wiki.archlinux.org/title/Vulkan>
3.  <https://wiki.archlinux.org/title/Xorg#Driver_installation>
4.  <https://wiki.archlinux.org/title/Hardware_video_acceleration#:~:text=VDPAU%20on%20Radeon%20R300%20and%20newer%20GPUs>
5.  [HDMI audio](https://wiki.archlinux.org/title/ATI#:~:text=HDMI%20audio%20is%20supported)
6.  [CPU 的详细信息](https://en.wikipedia.org/wiki/List_of_Intel_graphics_processing_units#:~:text=38.4-,Core%20i5-8250U,-Core%20i5-8350U)
7.  [Radeon R7 M260(Topaz)](https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units#Radeon_R5/R7/R9_M200_series)


## 安装图形界面——KDE {#安装图形界面-kde}

```sh
# pacman -S xorg xorg-server xorg-xinit plasma-meta plasma-wayland-session sddm dolphin konsole
# systemctl enable sddm
```


## 检查硬盘状况 {#检查硬盘状况}

```sh
# pacman -S hdparm smartmontools
# hdparm -I /dev/sdb
# smartctl -t short /dev/sdb
```


## 测试固态硬盘速度 {#测试固态硬盘速度}

```sh
# dd if=/dev/zero of=/tmp/test.img bs=1G count=1 oflag=dsync
```


## 参考资料 {#参考资料}

1.  [Hello, Arch Linux!](https://io-oi.me/tech/hello-arch-linux/)
2.  [ArchWiki](https://wiki.archlinux.org/)