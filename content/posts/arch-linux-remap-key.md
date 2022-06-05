+++
title = "Arch Linux 映射按键"
date = 2022-06-05T15:23:00+08:00
lastmod = 2022-06-05T15:46:13+08:00
tags = ["技术", "Arch Linux"]
draft = false
+++

在闲鱼上买了便宜的二手机械键盘，到手发现字母 z 坏掉了，对方说可能是运输过程中某些地方震得接触不良，需要给按键的轴体上油，对方会把油寄给我。

刚才想到是可以通过软件的方式把 z 键映射到其他不用的按键上的，经过一番搜索，终于在 [Wayland - ArchWiki](https://wiki.archlinux.org/title/Wayland#Remap_keyboard_or_mouse_keys) 上找到了解决办法。

安装 [evremap](https://github.com/wez/evremap)，并进行配置。

```sh
# 安装  evremap
yay -S evremap
# 选择 一个位置存放配置文件
mkdir ~/evremap && cd $_
touch remap.toml
```

`remap.toml` ：

```toml
device_name = "USB Keyboard"

[[remap]]
input = ["KEY_RIGHTALT"]
output = ["KEY_Z"]
```

-   `device_name` 是你的键盘型号，可通过 `sudo evremap list-devices` 查找。
-   `remap` 是映射组， `input`  是输入， `output` 是输出。
-   `KEY_RIGHTALT` 和 `KEY_Z` 是输入输出按键，可通过 `sudo evremap list-keys` 查找。


## 配置 systemd 自启动 {#配置-systemd-自启动}

```shell
sudo vim /usr/lib/systemd/system/evremap.service
sudo systemctl daemon-reload
sudo systemctl enable evremap.service --now
```

`evremap.service` ：

```bash
[Service]
WorkingDirectory=/
ExecStart=bash -c "/usr/bin/evremap remap /home/$USER/evremap/remap.toml"
Restart=always
```