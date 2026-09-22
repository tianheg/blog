---
title: Vagrant
date: 2022-11-14T21:54:00+08:00
tags: ['技术']
---

### 安装

```
    pacman -S vagrant
```

### 两个 Vagrantfile 文件

#### Pure cli archlinux

```
    Vagrant.configure("2") do |config|
      config.vm.box = "archlinux/archlinux"
    end
```

#### Archlinux with GUI

```
    # -*- mode: ruby -*-
    # vi: set ft=ruby :

    Vagrant.configure("2") do |config|
      config.vm.box = "archlinux/archlinux"
      config.vm.box_check_update = false

      config.vm.provider "virtualbox" do |vb|
        # Display the VirtualBox GUI when booting the machine
        vb.gui = true

        # Customize the amount of memory on the VM:
        vb.memory = "4096"
      end
      # Enable provisioning with a shell script.
      config.vm.provision "shell", path: "bootstrap1.sh"

      # bootstrap2 is for enabling GUI otherwise comment statement below
      config.vm.provision "shell", path: "bootstrap2.sh"

      # bootstrap3 is for saving package cache on shared folder
      config.vm.provision "shell", path: "bootstrap3.sh"
    end
```

`bootstrap1.sh`

```
    #!/usr/bin/env bash

    # localisation configuration eg. en_US Shanghai
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
    mv /etc/locale.gen /etc/locale.gen.old
    echo -e "en_US.UTF-8 UTF-8" > /etc/locale.gen
    echo "LANG=en_US.UTF-8" > /etc/locale.conf
    locale-gen

    # restore if package cache was saved from previous deployments
    if [ -e /vagrant/pkg.tgz ]
    then
    	cd /var/cache/pacman/pkg
    	tar -xzvf /vagrant/pkg.tgz
    	cd
    fi

    # update packages
    pacman -Syu --noconfirm
```

`bootstrap2.sh`

```
    #!/usr/bin/env bash

    # install X Gnome and alsa utils
    pacman -S --noconfirm xorg-server gnome alsa-utils lightdm lightdm-gtk-greeter

    # ttf-liberation fonts works well with lxde terminal emulator
    pacman -S --noconfirm ttf-liberation

    # install firefox and adblock plus
    pacman -S --noconfirm firefox firefox-adblock-plus

    # replace virtualbox guest additions with X support
    pacman -Rns --noconfirm virtualbox-guest-utils-nox
    pacman -S --noconfirm virtualbox-guest-utils

    # unmute sound and set volume to 100%
    amixer sset Master 100%+ unmute
    alsactl store

    # start lightdm at boot
    systemctl disable gdm
    systemctl enable lightdm

    # PulseAudio seems to remove crackling sound, YMMV
    pacman -S --noconfirm pulseaudio pulseaudio-alsa

    # https://io-oi.me/tech/hello-arch-linux/
    # https://www.yidajiabei.xyz/blog/2021/arch-installation-guide.html
```

`bootstrap3.sh`

```
    #!/usr/bin/env bash

    # save downloaded packages future deployments
    pacman -Sc --noconfirm
    cd /var/cache/pacman/pkg
    tar -czvf /vagrant/pkg.tgz *
```
