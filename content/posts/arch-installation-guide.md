+++
title = "Arch 安装指南"
date = 2021-08-20T00:00:00+08:00
lastmod = 2022-03-04T13:48:43+08:00
tags = ["技术", "Archlinux"]
draft = false
+++

安装过程整体顺利，没有无法解决的问题，主要参考资料：

1.  <https://io-oi.me/tech/hello-arch-linux/>
2.  <https://wiki.archlinux.org/>
3.  Google

除此之外，还有
[archinstall](https://python-archinstall.readthedocs.io/en/latest/index.html)


## 初始安装 {#初始安装}


### 更改 BIOS，使用 USB 系统启动盘优先启动 {#更改-bios 使用-usb-系统启动盘优先启动}

插入制作好的 arch linux USB 启动盘，当前目录下并无
install.txt（详见参考资料 1）。


### 验证 UEFI {#验证-uefi}

`ls /sys/firmware/efi/efivars` 有输出，说明启动模式为 UEFI。


### 验证网络 {#验证网络}

`ping archlinux.org -c 3` 验证网络，0% packet loss 说明网络正常。


### 更新系统时间 {#更新系统时间}

`timedatectl set-ntp true` 更新系统时间，=timedatectl status= 检查无误。


### 硬盘分区 {#硬盘分区}

1.  `fdisk -l` 查看硬盘信息：sdb 119.24g 固态，sda 931.51g 机械
2.  `fdisk /dev/sdb` 固态硬盘分区

进入 fdisk 操作界面后，m 查看命令帮助，p 显示目标硬盘分区，g 新建 GPT
分区表。创建 sdb1 分区，n 创建分区、分区序号、类型起始扇区默认，结束扇区
+256M。修改分区类型为 EFI System，p 确认为 EFI System。创建 sdb2
分区，全部默认。我的安装移除了原系统的 signature。

分区结果：

```text
Device      Start       End   Sectors  Size Type
/dev/sdb1    2048    526335    524288  256M EFI System
/dev/sdb2  526336 250069646 249543311  119G Linux filesystem
```

关于是否分配 SWAP
分区的讨论：<https://bbs.archlinuxcn.org/viewtopic.php?id=10472>

机械硬盘 sda 作为挂载硬盘存储文件。


### 硬盘格式化、新建文件系统 {#硬盘格式化新建文件系统}

```text
mkfs.fat -F32 /dev/sdb1
mkfs.ext4 /dev/sdb2
mkfs.ext4 /dev/sda
```


### 挂载分区 {#挂载分区}

```text
mount /dev/sdb2 /mnt
mkdir -p /mnt/boot/efi
mount /dev/sdb1 /mnt/boot/efi
```


### 选择镜像源 {#选择镜像源}

```text
pacman -Syyy reflector # reflector 能够方便地选择镜像源
reflector -c China -a 6 --sort rate --save /etc/pacman.d/mirrorlist # 这里的 mirrorlist 是 U 盘中的，还是硬盘中的？U 盘中的
pacman -Syyy # y 刷新本地缓存 yyy 强制刷新
```


### 安装基本系统和安装时要用的应用到硬盘 {#安装基本系统和安装时要用的应用到硬盘}

```text
pacstrap -i /mnt base base-devel linux linux-firmware dhcpcd vim
```


## 配置系统 {#配置系统}


### 进入硬盘，而不在 U 盘 {#进入硬盘而不在-u-盘}

```text
arch-chroot /mnt /bin/bash
```


### 生成挂载表 {#生成挂载表}

```text
genfstab -U -p /mnt >> /mnt/etc/fstab
```

检查：

```text
cat /mnt/etc/fstab
```


### 时区和语言 {#时区和语言}

设置时区：

```text
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
hwclock --systohc --utc
```

配置系统语言环境:

`vim /etc/locale.gen` 取消注释：

```text
en_US.UTF-8 UTF-8
...
zh_CN.UTF-8 UTF-8
```

生成配置：

```text
locale-gen
```

设置本地语言环境:

`vim /etc/locale.conf` 输入：

```text
LANG=en_US.UTF-8
```


### 安装引导程序 {#安装引导程序}

```text
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --bootloader-id=GRUB --efi-directory=/boot/efi
grub-mkconfig -o /boot/grub/grub.cfg
```

运行 grub
相关操作时，会出现警告：=Warning: os-prober will not be executed to detect other bootable partitions.=。查
arch wiki 后，可以在 /etc/default/grub 中设置
=GRUB_DISABLE_OS_PROBER=false=。


### 设置主机名 {#设置主机名}

```text
echo arch > /etc/hostname
```

`vim /etc/hosts` 添加以下内容：

```text
127.0.0.1 localhost
::1 localhost
127.0.0.1 arch.localdomain arch
```


### 提前配置网络 {#提前配置网络}

```text
pacman -S networkmanager
systemctl enable NetworkManager
systemctl start NetworkManager
systemctl status NetworkManager # 检查是否运行
```


### 设置 root 密码 {#设置-root-密码}

```text
passwd
```


### 新建普通用户 {#新建普通用户}

```text
useradd -m -g users -G wheel -s /bin/bash archie
```

设置普通用户密码：

```text
passwd archie
```

设置普通用户权限:

```text
EDITOR=vim visudo
```

取消注释：

```text
## Uncomment to allow members of group wheel to execute any command

%wheel ALL=(ALL) ALL

## Same thing without a password

%wheel ALL=(ALL) NOPASSWD: ALL
```


### 返回 U 盘 {#返回-u-盘}

```text
exit
```


## 重启系统 {#重启系统}

```text
umount -R /mnt
reboot
```

开机后改动 BIOS，配置「系统启动」后，拔掉 U 盘。普通用户 archie 登录。


## 完善系统 {#完善系统}


### 启动微码更新 {#启动微码更新}

```text
sudo pacman -S intel-ucode
sudo grub-mkconfig -o /boot/grub/grub.cfg
```


### 完善显卡驱动 {#完善显卡驱动}

这一步要在知道自己显卡配置的前提下执行。


#### VA-API or VDPAU {#va-api-or-vdpau}

```text
sudo pacman -S libva-utils vdpauinfo
vainfo
vdpauinfo
```

```text
vainfo: VA-API version: 1.12 (libva 2.12.0) vainfo: Driver
version: Intel iHD driver for Intel(R) Gen Graphics - 21.3.2 ()
vainfo: Supported profile and entrypoints VAProfileNone :
VAEntrypointVideoProc VAProfileNone : VAEntrypointStats
VAProfileMPEG2Simple : VAEntrypointVLD VAProfileMPEG2Simple :
VAEntrypointEncSlice VAProfileMPEG2Main : VAEntrypointVLD
VAProfileMPEG2Main : VAEntrypointEncSlice VAProfileH264Main :
VAEntrypointVLD VAProfileH264Main : VAEntrypointEncSlice
VAProfileH264Main : VAEntrypointFEI VAProfileH264Main :
VAEntrypointEncSliceLP VAProfileH264High : VAEntrypointVLD
VAProfileH264High : VAEntrypointEncSlice VAProfileH264High :
VAEntrypointFEI VAProfileH264High : VAEntrypointEncSliceLP
VAProfileVC1Simple : VAEntrypointVLD VAProfileVC1Main :
VAEntrypointVLD VAProfileVC1Advanced : VAEntrypointVLD
VAProfileJPEGBaseline : VAEntrypointVLD VAProfileJPEGBaseline :
VAEntrypointEncPicture VAProfileH264ConstrainedBaseline:
VAEntrypointVLD VAProfileH264ConstrainedBaseline: VAEntrypointEncSlice
VAProfileH264ConstrainedBaseline: VAEntrypointFEI
VAProfileH264ConstrainedBaseline: VAEntrypointEncSliceLP
VAProfileVP8Version0\_3 : VAEntrypointVLD VAProfileVP8Version0\_3 :
VAEntrypointEncSlice VAProfileHEVCMain : VAEntrypointVLD
VAProfileHEVCMain : VAEntrypointEncSlice VAProfileHEVCMain :
VAEntrypointFEI VAProfileHEVCMain10 : VAEntrypointVLD
VAProfileHEVCMain10 : VAEntrypointEncSlice VAProfileVP9Profile0 :
VAEntrypointVLD VAProfileVP9Profile2 : VAEntrypointVLD

display: :0 screen: 0 Failed to open VDPAU backend
libvdpau\_va\_gl.so: cannot open shared object file: No such file or
directory Error creating VDPAU device: 1
```

So mine is VA-API, I supposed to install
[libva-mesa-driver](https://wiki.archlinux.org/title/Hardware_video_acceleration#:~:text=VA-API%20on%20Radeon%20HD%202000%20and%20newer%20GPUs).

我的两种 GPU：

00:02.0 VGA compatible controller: Intel Corporation UHD Graphics 620
(rev 07) 01:00.0 Display controller: Advanced Micro Devices, Inc.
[AMD/ATI] Topaz XT [Radeon R7 M260/M265 / M340/M360 / M440/M445 /
530/535 / 620/625 Mobile] (rev c3)

-   Radeon R7 M260(Topaz)
    <https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units#Radeon_R5/R7/R9_M200_series>

<!--listend-->

```text
sudo pacman -S xf86-video-intel intel-media-driver vulkan-intel xf86-video-amdgpu xf86-video-ati mesa-vdpau vulkan-radeon
```

不推荐安装 =xf86-video-intel=，详见
[Intel
graphics - ArchWiki](https://wiki.archlinux.org/title/Intel_graphics#:~:text=Often%20not%20recommended%2C%20see%20note%20below)

CPU
的详细信息：<https://en.wikipedia.org/wiki/List_of_Intel_graphics_processing_units#:~:text=38.4-,Core%20i5-8250U,-Core%20i5-8350U>

HDMI audio:
<https://wiki.archlinux.org/title/ATI#:~:text=HDMI%20audio%20is%20supported>

ref:

1.  <https://wiki.archlinux.org/title/Hardware_video_acceleration>
2.  <https://wiki.archlinux.org/title/Vulkan>
3.  <https://wiki.archlinux.org/title/Xorg#Driver_installation>
4.  <https://wiki.archlinux.org/title/Hardware_video_acceleration#:~:text=VDPAU%20on%20Radeon%20R300%20and%20newer%20GPUs>


### 安装图形界面 {#安装图形界面}

```text
sudo pacman -S xorg xorg-server xorg-xinit plasma # gnome gnome-extra
# systemctl enable gdm
systemctl enable sddm # for kde(plasma)
```

桌面环境为 GNOME 时，切换 Wayland 至 Xorg：

```text
sudo vim /etc/gdm/custom.conf
```

`/etc/gdm/custom.conf`:

```text
[daemon]
# Uncoment the line below to force the login screen to use Xorg
-#WaylandEnable=false
+WaylandEnable=false
```

重启后，图形界面打开，但无法打开 Gnome Terminal，通过 Ctrl+Alt+F2
进入命令行模式，输入 gnome-terminal 显示：

```text
# Locale not supported by C library.
# Using the fallback 'C' locale
Unable to init server: Could not connect: Connection refused
# Failed to parse arguments: Cannot open display!
```

解决：在配置系统语言环境时，选择了 es_US，而不是 en_US。


### SSD 优化 {#ssd-优化}


#### 开启 TRIM {#开启 trim}

一定要确认固态硬盘是否支持，否则别用。会导致数据丢失

查看是否支持：=lsblk --discard= 如果输出的 DISC-GRAN 和 DISC-MAX 不为
0，则表明支持。

```text
sudo vim /etc/fstab
```

添加 noatime 和 diacard：

```text
# <file system> <dir> <type> <options> <dump> <pass>
# /dev/sdb2
UUID=b182ad17-2f74-4bf0-95b6-a42884a4ff79 /          ext4       rw,noatime,discard 0 1

# /dev/sdb1
UUID=EF6F-2E0C       /boot/efi  vfat       rw,noatime,discard,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro 0 2
```


#### 更换 I/O  scheduler {#更换-io-scheduler}

```text
sudo vim /etc/default/grub
```

找到 `GRUB_CMDLINE_LINUX_DEFAULT` 这一行，添加 `elevator=noop`:

```text
GRUB_CMDLINE_LINUX_DEFAULT="elevator=noop loglevel=3 quiet"
```

```text
sudo grub-mkconfig -o /boot/grub/grub.cfg
```


#### 迁移高读写文件到 tmpfs {#迁移高读写文件到-tmpfs}

```text
sudo vim /etc/fstab
```

添加以下内容到最后：

```text
tmpfs  /tmp    tmpfs   defaults,noatime,mode=1777 0 0
tmpfs  /var/log    tmpfs   defaults,noatime,mode=1777 0 0
tmpfs  /var/tmp    tmpfs   defaults,noatime,mode=1777 0 0
```

将 Google Chrome 的缓存挂载到 /tmp（后因排查
[arch linux system freeze
after connecting wifi](https://github.com/tianheg/blog/issues/147) 问题取消挂载）：

```text
cd ~/.cache/google-chrome/Default/ && rm -rf Cache && ln -sf /tmp Cache
cd ~/.cache/google-chrome/Default/ && unlink Cache # 取消 Symbolic Link
```


### 检查硬盘状况 {#检查硬盘状况}

```text
sudo pacman -S hdparm smartmontools
sudo hdparm -I /dev/sdb
sudo smartctl -t short /dev/sdb
```


### 测试固态硬盘速度 {#测试固态硬盘速度}

```text
sudo dd if=/dev/zero of=/tmp/test.img bs=1G count=1 oflag=dsync
```

至此系统完善到此告一段落。


## 其他 {#其他}

-   [在阿里云服务器上安装 Arch Linux](https://nyac.at/4)