+++
date = '2021-08-20T10:43:44+08:00'
slug = 'arch-installation-guide'
tags = ['Arch']
title = 'Arch 安装指南'
+++

安装过程整体顺利，没有无法解决的问题，主要参考资料：

1. <https://io-oi.me/tech/hello-arch-linux/>
2. <https://wiki.archlinux.org/>
3. Google

除此之外，还有 [archinstall](https://python-archinstall.readthedocs.io/en/latest/index.html)

## 初始安装

### 更改 BIOS，使用 USB 系统启动盘优先启动

插入制作好的 arch linux USB 启动盘，当前目录下并无 install.txt（详见参考资料 1）。

### 验证 UEFI

`ls /sys/firmware/efi/efivars` 有输出，说明启动模式为 UEFI。

### 验证网络

`ping archlinux.org -c 3` 验证网络，0% packet loss 说明网络正常。

### 更新系统时间

`timedatectl set-ntp true` 更新系统时间，`timedatectl status` 检查无误。

### 硬盘分区

1. `fdisk -l` 查看硬盘信息：sdb 119.24g 固态，sda 931.51g 机械
2. `fdisk /dev/sdb` 固态硬盘分区

进入 fdisk 操作界面后，m 查看命令帮助，p 显示目标硬盘分区，g 新建 GPT 分区表。创建 sdb1 分区，n 创建分区、分区序号、类型起始扇区默认，结束扇区 +256M。修改分区类型为 EFI System，p 确认为 EFI System。创建 sdb2 分区，全部默认。我的安装移除了原系统的 signature。

分区结果：

```sh
Device      Start       End   Sectors  Size Type
/dev/sdb1    2048    526335    524288  256M EFI System
/dev/sdb2  526336 250069646 249543311  119G Linux filesystem
```

机械硬盘 sda 作为挂载硬盘存储文件。

### 硬盘格式化、新建文件系统

```sh
mkfs.fat -F32 /dev/sdb1
mkfs.ext4 /dev/sdb2
mkfs.ext4 /dev/sda
```

### 挂载分区

```sh
mount /dev/sdb2 /mnt
mkdir -p /mnt/boot/efi
mount /dev/sdb1 /mnt/boot/efi
```

### 选择镜像源

```sh
pacman -Syyy reflector # reflector 能够方便地选择镜像源
reflector -c China -a 6 --sort rate --save /etc/pacman.d/mirrorlist # 这里的 mirrorlist 是 U 盘中的，还是硬盘中的？U 盘中的
pacman -Syyy # y 刷新本地缓存 yyy 强制刷新
```

### 安装基本系统和安装时要用的应用到硬盘

```sh
pacstrap -i /mnt base base-devel linux linux-firmware dhcpcd vim
```

## 配置系统

### 进入硬盘，而不在 U 盘

```sh
arch-chroot /mnt /bin/bash
```

### 生成挂载表

```sh
genfstab -U -p /mnt >> /mnt/etc/fstab
```

检查：

```sh
cat /mnt/etc/fstab
```

### 时区和语言

设置时区：

```sh
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
hwclock --systohc --utc
```

配置系统语言环境:

`vim /etc/locale.gen` 取消注释：

```gen
en_US.UTF-8 UTF-8
...
zh_CN.UTF-8 UTF-8
```

生成配置：

```sh
locale-gen
```

设置本地语言环境:

`vim /etc/locale.conf` 输入：

```conf
LANG=en_US.UTF-8
```

### 安装引导程序

```sh
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --bootloader-id=GRUB --efi-directory=/boot/efi
grub-mkconfig -o /boot/grub/grub.cfg
```

运行 grub 相关操作时，会出现警告：`Warning: os-prober will not be executed to detect other bootable partitions.`。查 arch wiki 后，可以在 /etc/default/grub 中设置 `GRUB_DISABLE_OS_PROBER=false`。

### 设置主机名

```sh
echo arch > /etc/hostname
```

`vim /etc/hosts` 添加以下内容：

```hosts
127.0.0.1 localhost
::1 localhost
127.0.0.1 arch.localdomain arch
```

### 提前配置网络

```sh
pacman -S networkmanager
systemctl enable NetworkManager
systemctl start NetworkManager
systemctl status NetworkManager # 检查是否运行
```

### 设置 root 密码

```sh
passwd
```

### 新建普通用户

```sh
useradd -m -g users -G wheel -s /bin/bash archie
```

设置普通用户密码：

```sh
passwd archie
```

设置普通用户权限:

```sh
EDITOR=vim visudo
```

取消注释：

```conf
## Uncomment to allow members of group wheel to execute any command

%wheel ALL=(ALL) ALL

## Same thing without a password

%wheel ALL=(ALL) NOPASSWD: ALL
```

### 返回 U 盘

```sh
exit
```

## 重启系统

```sh
umount -R /mnt
reboot
```

开机后改动 BIOS，配置「系统启动」后，拔掉 U 盘。普通用户 archie 登录。

## 完善系统

### 启动微码更新

```sh
sudo pacman -S intel-ucode
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

### 完善显卡驱动

这一步要在知道自己显卡配置的前提下执行。

```sh
sudo pacman -S xf86-video-intel intel-media-driver vulkan-intel xf86-video-amdgpu xf86-video-ati mesa-vdpau vulkan-radeon
```

### 安装图形界面

```sh
sudo pacman -S xorg xorg-server xorg-xinit plasma # gnome gnome-extra
# systemctl enable gdm
systemctl enable sddm # for kde(plasma)
```

桌面环境为 GNOME 时，切换 Wayland 至 Xorg：

```sh
sudo vim /etc/gdm/custom.conf
```

`/etc/gdm/custom.conf`:

```conf
[daemon]
# Uncoment the line below to force the login screen to use Xorg
-#WaylandEnable=false
+WaylandEnable=false
```

重启后，图形界面打开，但无法打开 Gnome Terminal，通过 Ctrl+Alt+F2 进入命令行模式，输入 gnome-terminal 显示：

```sh
# Locale not supported by C library.
# Using the fallback 'C' locale
Unable to init server: Could not connect: Connection refused
# Failed to parse arguments: Cannot open display!
```

解决：在配置系统语言环境时，选择了 es_US，而不是 en_US。

### SSD 优化

#### 开启TRIM

一定要确认固态硬盘是否支持，否则别用。会导致数据丢失

查看是否支持：`lsblk --discard` 如果输出的 DISC-GRAN 和 DISC-MAX 不为 0，则表明支持。

```sh
sudo vim /etc/fstab
```

添加 noatime 和 diacard：

```fstab
# <file system> <dir> <type> <options> <dump> <pass>
# /dev/sdb2
UUID=b182ad17-2f74-4bf0-95b6-a42884a4ff79 /          ext4       rw,noatime,discard 0 1

# /dev/sdb1
UUID=EF6F-2E0C       /boot/efi  vfat       rw,noatime,discard,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro 0 2
```

#### 更换 I/O  scheduler

```sh
sudo vim /etc/default/grub
```

找到 `GRUB_CMDLINE_LINUX_DEFAULT` 这一行，添加 `elevator=noop`:

```grub
GRUB_CMDLINE_LINUX_DEFAULT="elevator=noop loglevel=3 quiet"
```

```sh
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

#### 迁移高读写文件到 tmpfs

```sh
sudo vim /etc/fstab
```

添加以下内容到最后：

```fstab
tmpfs  /tmp    tmpfs   defaults,noatime,mode=1777 0 0
tmpfs  /var/log    tmpfs   defaults,noatime,mode=1777 0 0
tmpfs  /var/tmp    tmpfs   defaults,noatime,mode=1777 0 0
```

将 Google Chrome 的缓存挂载到 /tmp（后因排查 [arch linux system freeze after connecting wifi](https://github.com/tianheg/blog/issues/147) 问题取消挂载）：

```sh
cd ~/.cache/google-chrome/Default/ && rm -rf Cache && ln -sf /tmp Cache
cd ~/.cache/google-chrome/Default/ && unlink Cache # 取消 Symbolic Link
```

### 检查硬盘状况

```sh
sudo pacman -S hdparm smartmontools
sudo hdparm -I /dev/sdb
sudo smartctl -t short /dev/sdb
```

### 测试固态硬盘速度

```sh
sudo dd if=/dev/zero of=/tmp/test.img bs=1G count=1 oflag=dsync
```

至此系统完善到此告一段落。
