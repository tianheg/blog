+++
title = "Arch Linux KDE 桌面屏幕闪烁"
date = 2022-04-20T00:00:00+08:00
lastmod = 2022-04-20T21:40:00+08:00
tags = ["技术", "Arch Linux", "KDE"]
draft = false
+++

```shell
> neofetch --off

OS: Arch Linux x86_64
Host: HP Laptop 14s-cr0xxx
Kernel: 5.17.3-arch1-1
Uptime: 4 days, 18 hours, 51 mins
Packages: 1479 (pacman)
Shell: zsh 5.8.1
Resolution: 1920x1080
DE: Plasma 5.24.4
WM: kwin
Theme: Breeze Light [Plasma], Breeze [GTK2]
Icons: [Plasma], breeze [GTK2/3]
Terminal: konsole
Terminal Font: IBM Plex Mono 15
CPU: Intel i5-8250U (4) @ 3.400GHz
GPU: Intel UHD Graphics 620
GPU: AMD ATI Radeon R7 M260/M265 / M340/M360 / M440/M445 / 530/535 / 620/625 Mobile
Memory: 6686MiB / 23924MiB
```

解决办法：

```sh
sudo vim /etc/default/grub
sudo grub-mkconfig -o /boot/grub/grub.c
# reboot
```

\`/etc/default/grub\`:

```cfg
GRUB_CMDLINE_LINUX_DEFAULT="... i915.enable_psr=0 nomodeset"
或
GRUB_CMDLINE_LINUX_DEFAULT="... i915.enable_psr=0"
```

以上办法行不通。

又尝试：

```cfg
GRUB_CMDLINE_LINUX_DEFAULT="... nomodeset"
```

目前看没有屏幕闪烁，不知道以后会怎么样。没有解决，锁屏 20 分钟后开机再次闪烁。

nomodeset 的意思：

> The newest kernels have moved the video mode setting into the kernel. So all the programming of the hardware specific clock rates and registers on the video card happen in the kernel rather than in the X driver when the X server starts.. This makes it possible to have high resolution nice looking splash (boot) screens and flicker free transitions from boot splash to login screen. Unfortunately, on some cards this doesn't work properly and you end up with a black screen. Adding the nomodeset parameter instructs the kernel to not load video drivers and use BIOS modes instead until X is loaded.
>
> 来自 <https://ubuntuforums.org/showthread.php?t=1613132>

---

参考资料

1.  <https://wiki.archlinux.org/title/intel_graphics#Screen_flickering>
2.  <https://bbs.archlinux.org/viewtopic.php?id=243307>
3.  <https://bbs.archlinux.org/viewtopic.php?id=228815>
