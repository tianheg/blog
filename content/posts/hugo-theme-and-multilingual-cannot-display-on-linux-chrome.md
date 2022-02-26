+++
title = "Hugo 主题及多语言图标不能在 Linux Chrome 中正常显示"
date = 2020-05-17T00:00:00+08:00
lastmod = 2022-02-26T15:20:22+08:00
tags = ["技术", "Hugo"]
draft = false
+++

这个问题，我给正在使用的主题：Meme，提了 issue，[地址](https://github.com/reuixiy/hugo-theme-meme/issues/139)。

博客我是不放图片的，我描述一下，什么是不能正常显示：

在 Win10 的 Chrome 中原来显示主题的太阳图标和多语言的字符图标（在移动端显示为国旗），现在在 Linux 中都变成了 **方块** ，功能上没问题，就是不太好看。

系统环境：

```text
System:
           Kernel: 4.19.0-6-amd64 x86_64 bits: 64 compiler: gcc v: 8.3.0
           parameters: BOOT_IMAGE=/boot/vmlinuz-4.19.0-6-amd64
           root=UUID=dc4e6e4a-c8a2-44e4-aee1-e677ad07eada ro quiet splash
           Desktop: Xfce 4.14.2 tk: Gtk 3.24.5 info: xfce4-panel wm: xfwm4 dm: LightDM 1.26.0
           Distro: MX-19.1_x64 patito feo February 15  2020 base: Debian GNU/Linux 10 (buster)
Machine:
           Type: Virtualbox System: innotek product: VirtualBox v: 1.2 serial: <filter>
           Chassis: Oracle Corporation type: 1 serial: <filter>
           Mobo: Oracle model: VirtualBox v: 1.2 serial: <filter> BIOS: innotek v: VirtualBox
           date: 12/01/2006
```

Chrome 版本：

```text
Chrome: 81.0.4044.138 (Official Build) (64-bit)
```

主题的开发者说，因为主题和多语言图标用了 emoji。所以，如果 Linux 上没有相关的 emoji 支持的话，是不能正常显示的。

所以，我按照 Ta 的建议，安装了 `fonts-noto-color-emoji` ：

```sh
apt install fonts-noto-color-emoji
```

但是没有立刻起作用，于是我在 Google 搜索，这个字体 `Google Noto Fonts` ，又下载了 =Noto Emoji=。

这时我发现，起作用了，但是没有颜色。

过了一会儿（有 10 分钟的样子），好了，图标可以正常显示了。

---
参考资料

1.  [The icon of theme and multilingual can't display on GoogleChrome on linux](https://github.com/reuixiy/hugo-theme-meme/issues/139)
2.  [Google Noto Fonts](https://www.google.com/get/noto/)