+++
title = "为 Arch Linux 定制启动镜像"
author = ["Tianhe Gao"]
date = 2022-09-02T12:31:00+08:00
lastmod = 2022-09-04T16:58:19+08:00
tags = ["技术", "Arch Linux"]
draft = false
+++

## 安装 Archiso {#安装-archiso}


## 准备好定制的配置文件 {#准备好定制的配置文件}

1.  复制 releng 这种配置的文件

<!--listend-->

```sh
cp -r /usr/share/archiso/configs/releng/ archlive
```

1.  配置文件结构

<!--listend-->

```txt
profile/
├── airoot
├── efibo
├── syslin
├── gr
├── bootstrap_packages.a
├── packages.a
├── pacman.c
└── profiledef
```

1.  添加需要的包，在明确了解的情况下删除包
2.  向镜像中添加文件
3.  Linux 内核
4.  引导加载程序 Boot loader
5.  systemd 单元

在在线环境中，开启 systemd 服务需要手动创建符号链接。比如 [SDDM](https://wiki.archlinux.org/title/SDDM) 这个登陆管理器 `ln -s /usr/lib/systemd/system/sddm.service archlive_path/airootfs/etc/systemd/system/display-manager.service` 。

关闭自动登录，修改 `archlive_path/airootfs/etc/systemd/system/getty@tty1.service.d/autologin.conf`

```diff
- ExecStart=-/sbin/agetty -o '-p -f -- \\u' --noclear --autologin root - $TERM
+ ExecStart=-/sbin/agetty -o '-p -f -- \\u' --noclear - $TERM
```

1.  用户和密码

用 archlive 指代 archlive 路径。

要添加用户需要修改以下 4 个文件。并且保证它们包含 root 用户和组。

```txt
archlive/
-- airootfs/etc/
               -- passwd
               -- shadow
               -- group
               -- gshadow
```

举例，添加用户 archie。

确保文件包含以下内容。

`passwd`

```txt
root:x:0:0:root:/root:/usr/bin/zsh
archie:x:1000:1000::/home/archie:/usr/bin/zsh
```

通过 `openssl passwd -6` 生成一个哈希密码，加到 `shadow` 文件。

```txt
root::14871::::::
archie:$6$TldMPVT6K6ghQruV$NA0N/.OlfSLAdauhjb33Xf7IjCDFEtBcIxyZWIIVcefIzKEmWQ3wKRJFZpoY5LFWm2L18COJci0ti7tgPK94o1:14871::::::
```

`group`

```txt
root:x:0:root
adm:x:4:archie
wheel:x:10:archie
uucp:x:14:archie
archie:x:1000:
```

创建 `gshadow`

```txt
root:!*::root
archie:!*::
```

在 `archlive_path/profiledef.sh` 文件中设置文件权限。

```sh
...
file_permissions=(
  ...
  ["/etc/shadow"]="0:0:400"
  ["/etc/gshadow"]="0:0:400"
)
```

1.  改变镜像中的发行版名称

<!--listend-->

```sh
sudo cp /etc/os-release archlive_path/airootfs/etc
```


## 构建镜像 {#构建镜像}

```sh
# mkarchiso -v -w /path/to/work_dir -o /path/to/out_dir /path/to/profile/
```


## 记录 {#记录}

我的 profile 配置文件在 [GitHub](https://github.com/tianheg/archlive)。

SDDM 登陆管理器已经配置好了，但是无法登陆 archie 用户，密码已确认是正确的。无法登录的表现——输入密码-&gt;黑屏-&gt;显示没有输入密码的登陆界面。

通过 [VirtualBox](https://wiki.archlinux.org/title/VirtualBox) 创建虚拟机，启动镜像。

后来我意识到，根本不需要在镜像中安装图形化界面，于是我对 packages.x86_64 进行了精简，但是我并不知道哪些包对镜像构建是必须的，所以只能根据安装镜像时返回的错误来判断。

有一次，刚在 VirtualBox 启动镜像，界面显示找不到 /boot/intel-ucode.img 然后就无法继续进行了，图片内容如下。

![](/images/arch-build-live-image-0.png "Kernel panic")

于是，我就猜测可能是少了 intel-ucode 这个包。

还见过的错误。

```sh
# arch kernel: RETBleed: WARNING: Spectre v2 mitigation leaves CPU vulnerable to RETBleed attacks, data leakpossible!
```

参考资料：

1.  <https://wiki.archlinux.org/title/Archiso>
2.  [Archiso 文件结构](https://gitlab.archlinux.org/archlinux/archiso/-/blob/master/docs/README.profile.rst)
3.  <https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface>
4.  <https://wiki.archlinux.org/title/Syslinux>
5.  <https://wiki.archlinux.org/title/Systemd-boot>
6.  <https://en.wikipedia.org/wiki/UEFI>
7.  <https://en.wikipedia.org/wiki/BIOS>
8.  <https://wiki.archlinux.org/title/Arch_boot_process>
9.  [Ramfs, rootfs and initramfs](https://docs.kernel.org/filesystems/ramfs-rootfs-initramfs.html)
10. <https://wiki.archlinux.org/title/FAT>
11. <https://en.wikipedia.org/wiki/Power-on_self-test>
12. <https://wiki.archlinux.org/title/GRUB>
13. <https://en.wikipedia.org/wiki/Vmlinux>
14. [GNU GRUB Manual 2.06](https://www.gnu.org/software/grub/manual/grub/grub.html)