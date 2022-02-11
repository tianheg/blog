+++
title = "修复 KDE Plasma panel 崩溃问题"
date = 2022-02-04T00:00:00+08:00
lastmod = 2022-02-11T15:18:59+08:00
tags = ["KDE"]
draft = false
+++

<https://www.addictivetips.com/ubuntu-linux-tips/fix-kde-plasma-panel-crash/>

崩溃之后需要重启，不过 KDE 并没有像 GNOME 那样的重启机制。所以需要自定义。

创建一个脚本 panel-restart

```sh
#!/bin/bash
killall plasmashell;plasmashell &
```

```sh
sudo chmod +x panel-restart
sudo mv panel-restart /usr/bin/
```