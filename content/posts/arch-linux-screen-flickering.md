+++
title = "Arch Linux KDE桌面屏幕闪烁"
date = 2022-04-20T00:00:00+08:00
lastmod = 2022-04-20T14:11:42+08:00
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
GRUB_CMDLINE_LINUX_DEFAULT="... i915.enable_psr=0"
```

---

参考资料

1.  <https://wiki.archlinux.org/title/intel_graphics#Screen_flickering>
2.  <https://bbs.archlinux.org/viewtopic.php?id=243307>
3.  <https://bbs.archlinux.org/viewtopic.php?id=228815>
