+++
title = "Arch 软件安装和用法"
date = "2021-08-20T10:47:41+08:00"
tags = ["Arch"]
slug = "arch-software-installation-and-usage"
+++

## Hide GRUB

Tried [this way](https://io-oi.me/tech/hello-arch-linux/#隐藏-grub-除非按下-shift-键) not work, then try [this](https://www.reddit.com/r/linux4noobs/comments/5372gj/disable_arch_linux_grub_boot_menu/d7qjh6s?utm_source=share&utm_medium=web2x&context=3):

```sh
sudo vim /etc/default/grub
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

Edit `etc/default/grub`:

```sh
-GRUB_TIMEOUT=1
+GRUB_TIMEOUT=0
```

## reflector

<https://wiki.archlinux.org/title/reflector>

### Automation

`/etc/xdg/reflector/reflector.conf`:

```conf
--save /etc/pacman.d/mirrorlist
--country China
--protocol https
--latest 5
```

```sh
systemctl enable reflector
systemctl start reflector
```

### Pacman hook

`/etc/pacman.d/hooks/mirrorupgrade.hook`:

```hook
[Trigger]
Operation = Upgrade
Type = Package
Target = pacman-mirrorlist

[Action]
Description = Updating pacman-mirrorlist with reflector and removing pacnew...
When = PostTransaction
Depends = reflector
Exec = /bin/sh -c 'systemctl start reflector.service; [ -f /etc/pacman.d/mirrorlist.pacnew ] && rm /etc/pacman.d/mirrorlist.pacnew'
```

## Proxy

### Clash

```sh
export CLASH_VERSION="1.6.5"
wget -O clash.gz https://github.com/Dreamacro/clash/releases/download/v${CLASH_VERSION}/clash-linux-amd64-v${CLASH_VERSION}.gz
gzip -f clash.gz -d
sudo mv ~/clash /usr/local/bin/clash
chmod +x /usr/local/bin/clash
clash # Generate config.yaml, Country.mmdb in ~/.config/clash
## download yaml file from your service provider, rename it to config.yaml, put it under your clash folder

# open clash at start https://github.com/Dreamacro/clash/wiki/clash-as-a-daemon
sudo vim /etc/systemd/system/clash.service
```

`/etc/systemd/system/clash.service`:

```sh
[Unit]
Description=Clash daemon, A rule-based proxy in Go.
After=network.target

[Service]
Type=simple
Restart=always
ExecStart=/usr/local/bin/clash -d "/home/archie/.config/clash"

[Install]
WantedBy=multi-user.target
```

```sh
systemctl daemon-reload
systemctl enable clash
```

## Input method

Want to remove ibus, use fcitx.

```sh
sudo pacman -S fcitx-im fcitx-configtool fcitx-googlepinyin
```

Add support for gtk,qt:

```txt
# /etc/profile
export XMODIFIERS="@im=fcitx"
export GTK_IM_MODULE="fcitx"
export QT_IM_MODULE="fcitx"
```

## Font

Use default Gnome 40 font:

- Cantarell Regular 11
- Cantarell Regular 11
- Source Code Pro Regular 10
- Cantarell Bold 11

```sh
sudo pacman -S noto-fonts noto-fonts-extra noto-fonts-emoji noto-fonts-cjk ttf-dejavu ttf-liberation ttf-roboto ttf-inconsolata ttf-linux-libertine ttf-droid adobe-source-han-sans-cn-fonts adobe-source-han-serif-cn-fonts
yay -S otf-eb-garamond ttf-monaco otf-san-francisco consolas-font
```

中文：

noto-fonts, noto-fonts-cjk, noto-fonts-emoji, noto-fonts-extra

代码：

monaco, menlo

- 命令行安装的字体所在的目录：`/usr/share/fonts/`
- 手动安装的字体所在的目录：`~/.local/share/fonts/`

```sh
fc-cache -fv # update font cache
```

## Bluetooth

```sh
sudo systemctl enable --now bluetooth
```

## Git

```sh
wget -O ~/.gitconfig https://raw.githubusercontent.com/tianheg/dotfiles/main/git/gitconfig

## SSH
chmod 400 ~/.ssh/id_ed25519
# solve sign_and_send_pubkey: signing failed for ED25519 "/home/user/.ssh/id_ed25519" from agent: agent refused operation; git@github.com: Permission denied (publickey).
```

## GPG

Modify `~/.gnupg/` permission:

```sh
# https://superuser.com/a/954536 ; https://superuser.com/a/954639
# Set ownership to your own user and primary group
chown -R "$USER:$(id -gn)" ~/.gnupg
# Set permissions to read, write, execute for only yourself, no others
chmod 700 ~/.gnupg
# Set permissions to read, write for only yourself, no others
chmod 600 ~/.gnupg/*
```

This step is to solve `gpg: WARNING: unsafe permissions on homedir '/home/user/.gnupg'`.

**Save ~/.gnupg safely**, then import public keys from GitHub(user + web-flow):

```sh
wget -O tianheg-pubkeys.txt https://github.com/tianheg.gpg
wget -O github-web-flow.txt https://github.com/web-flow.gpg
gpg --import tianheg-pubkeys.txt
gpg --import github-web-flow.txt
```

## archcn

Add repo:

```conf
[archlinuxcn]
Server = https://repo.archlinuxcn.org/$arch
```

to your `/etc/pacman.conf`.

For mirrors (mainly in China), see [archlinuxcn/mirrorlist-repo](https://github.com/archlinuxcn/mirrorlist-repo).

Import PGP Keys:

```sh
sudo pacman -Syy && sudo pacman -S archlinuxcn-keyring
```

## pacman

Is it possible that there is a major kernel update in the repository, and that some of the driver packages have not been updated?

No, it is not possible. Major kernel updates (e.g. linux 3.5.0-1 to linux 3.6.0-1) are always accompanied by rebuilds of all supported kernel driver packages. On the other hand, if you have an unsupported driver package (e.g. from the AUR) installed on your system, then a kernel update might break things for you if you do not rebuild it for the new kernel. Users are responsible for updating any unsupported driver packages that they have installed.

### pacman 命令

```sh
## Common
pacman -Qe # List all explicitly installed packages
pacman -Qet # list all packages explicitly installed and not required as dependencies
pacman -Qent # List all explicitly installed native packages (i.e. present in the sync database) that are not direct or optional dependencies
pacman -Qn # List all native packages (installed from the sync database(s))
pacman -Qm # List all foreign packages (typically manually downloaded and installed or packages removed from the repositories)

sudo pacman -Qtdq | sudo pacman -Rns - # recursively removing orphans and their configuration files

sudo pacman -Qii | awk '/^MODIFIED/ {print $2}' # print modified files under /etc

pacman -Qs regex # List packages by regex

pacman -Qg group_name # List installed packages under this group
pacman -Sg group # List all packages in the package group named `group`, etc, base-devel, gnome

pacman -Syu # Update package list and upgrade all packages afterwards
pacman -Syu git # Update package list, upgrade all packages, and then install git if it wasn’t already installed

pacman -S package_name1 package_name2 # Installing specific packages
pacman -S $(pacman -Ssq package_regex) # Install a list of packages with regex
pacman -S extra/package_name # Install specific repositories' package
pacman -S plasma-{desktop,mediacenter,nm}
pacman -S plasma-{workspace{,-wallpapers},pa}

pacman -S gnome # Install through group of packages
Enter a selection (default=all): 1-10 15 # which will select packages 1 through 10 and 15 for installation
Enter a selection (default=all): ^5-8 ^2 # which will select all packages except 5 through 8 and 2 for installation

pacman -R package_name # remove a single package, leaving all of its dependencies installed
pacman -Rs package_name # remove a single package and its dependencies which are not required by any other installed package

pacman -Qtd # check for packages that were installed as a dependency but now, no other packages depend on them

pacman -Ss string1 string2 ... # search for packages in the database
pacman -Qs string1 string2 ... # search for already installed packages
pacman -F string1 string2 ... # search for package file names in remote packages
pacman -Fy string1 string2 ... # first flush local cache, then search for package file names in remote packages

pacman -Si package_name # display extensive information about a given package
pacman -Qi package_name # display extensive information about locally installed packages
pacman -Qii package_name # also display the list of backup files and their modification states

pacman -Ql package_name # retrieve a list of the files installed by a package
pacman -Fl package_name # retrieve a list of the files installed by a remote package


## Rarely use
pacman -Qk package_name # verify the presence of the files installed by a package, Passing the k flag twice will perform a more thorough check
pacman -Qo /path/to/file_name # query the database to know which package a file in the file system belongs to
pacman -F /path/to/file_name # query the database to know which remote package a file belongs to
```

### 应该避免执行的 `pacman` 指令

```sh
pacman -Syu # always run
pacman -Sy # never run!!!
pacman -Rdd package # never run!!!
```

When installing packages in Arch, avoid refreshing the package list without upgrading the system (for example, when a package is no longer found in the official repositories). In practice, do not run pacman -Sy package_name instead of pacman -Syu package_name, as this could lead to dependency issues.

### list all development/unstable packages

```sh
pacman -Qq | grep -Ee '-(bzr|cvs|darcs|git|hg|svn)$'
```

### 执行 pacman 命令过程中，遇到的信息/警告/错误

```sh
warning: dependency cycle detected # 循环依赖
```

#### When `sudo pacman -Syu`

##### WARNING: Possibly missing firmware for module

这是一种警告。

ref:

1. <https://wiki.archlinux.org/title/Mkinitcpio#Possibly_missing_firmware_for_module_XXXX>
2. <https://arcolinuxforum.com/viewtopic.php?t=1174>

##### gpg: key 786C63F330D7CB92: no user ID for key signature packet of class 10

```sh
786C63F330D7CB92
1EB2638FF56C0C53
```

##### warning: /etc/pacman.d/mirrorlist installed as /etc/pacman.d/mirrorlist.pacnew

##### /etc/mkinitcpio.d/linux.preset: 'default' and /etc/mkinitcpio.d/linux.preset: 'fallback'

[mkinitcpio - ArchWiki](https://wiki.archlinux.org/title/Mkinitcpio)

ref:

1. <https://wiki.archlinux.org/title/Arch_User_Repository#Installing_and_upgrading_packages>
2. <https://wiki.archlinux.org/title/Frequently_asked_questions#Is_it_possible_that_there_is_a_major_kernel_update_in_the_repository,_and_that_some_of_the_driver_packages_have_not_been_updated?>
3. <https://wiki.archlinux.org/title/Pacman/Tips_and_tricks>
4. <https://wiki.archlinux.org/title/Pacman>
5. <https://wiki.archlinux.org/title/System_maintenance#Avoid_certain_pacman_commands>
6. <https://wiki.archlinux.org/title/Pacman/Rosetta>

## yay(~~donot use, only use pacman~~)

Yet Another Yogurt: A utility for Arch Linux to build and install packages from the Arch User Repository.

### 安装 yay

```sh
sudo pacman -S yay
# pacman -S --needed git base-devel
# git clone https://aur.archlinux.org/yay.git
# cd yay
# makepkg -si
```

### 使用 yay

```sh
# Interactively search and install packages from the repos and AUR:
yay package_name|search_term
# Synchronize and update all packages from the repos and AUR:
yay
#Synchronize and update only AUR packages:
yay -Sua
# Install a new package from the repos and AUR:
yay -S package_name
# Remove an installed package and both its dependencies and configuration files:
yay -Rns package_name
# Search the package database for a keyword from the repos and AUR:
yay -Ss keyword
# Remove orphaned packages (installed as dependencies but not required by any package):
yay -Yc
# Show statistics for installed packages and system health:
yay -Ps
```

### yay 问题

1. 安装时总是出现 `==> WARNING: Using existing $srcdir/ tree`，这个可以忽视，只是说明安装过程。
2. timeout 问题 <https://github.com/Jguer/yay/issues/1278#issuecomment-635833427>

ref:

1. <https://github.com/Jguer/yay>
2. <https://github.com/Jguer/yay/issues/1248>

## Imager(rpi-imager)

```sh
yay -S rpi-imager
```

对于支持 UEFI 启动的设备，直接复制 iso 镜像中的所有文件到安装介质（如 U 盘）中即可启动。

## KDE

```sh
sudo pacman -S 
```

### Swap Lctrl with CapsLock

System Settings --> Keyboard --> Advanced

### Error Discover(Software Center)

Uninstall it.

### kde Connect

```sh
sudo pacman -S kdeconnect
```

### seahorse + kde wallet

```sh
sudo pacman -S kwalletmanager seahorse
```

## GNOME

Extensions install: Copy the unziped folder to `~/.local/share/gnome-shell/extensions/`, rename the folder with `metadata.json`'s uuid.

### Remove software

```sh
sudo pacman -Rs gnome-software gnome-calendar gnome-documents gnome-todo gnome-maps gnome-contacts evolution gnome-builder gnome-boxes geary gnome-clocks gnome-books gnome-photos gnome-connections gnome-games ghex gnome-mahjongg gnome-music epiphany totem accerciser dconf-editor glade five-or-more four-in-a-row gedit gnome-sudoku gnome-nettool gnome-nibbles gnome-recipes gnome-robots gnome-taquin gnome-tetravex gnome-weather hitori iagno
```

totem <--> Gnome Video

iagno <--> Reversi

### Extension

<https://extensions.gnome.org/extension/3088/extension-list/>

#### Dash to Dock

```sh
sudo pacman -S sassc
git clone --branch ewlsh-ewlsh/gnome-40 https://github.com/micheleg/dash-to-dock.git
make
make install
```

<https://gitlab.gnome.org/GNOME/gnome-shell-extensions>

#### Coverflow Alt-Tab

<https://extensions.gnome.org/extension/97/coverflow-alt-tab/>

#### Tray Icons: Reloaded

<https://extensions.gnome.org/extension/2890/tray-icons-reloaded/>

#### Simple net speed

<https://extensions.gnome.org/extension/1085/simple-net-speed/>

#### GSconnect

<https://extensions.gnome.org/extension/1319/gsconnect/>

Connect PC with phone

## Other Software

ref: <https://io-oi.me/tech/hello-arch-linux/>

名字 | 说明 | 类似
:---:|:---:|:---:
google-chrome | Google Chrome 浏览器 | *
visual-studio-code-bin | Visual Studio Code | *
netease-cloud-music | 网易云音乐 | *
flameshot | 现代、快捷、轻便的截图工具 | *
proxychains-ng | 终端内科学上网代理工具 | *
redshift | 显示屏色温调节工具 | f.lux
vlc | 强大的多媒体播放工具 | *
telegram-desktop | 客户端开源的加密聊天工具 | *
gthumb | 图片浏览工具，可简单编辑图片，可清除照片元数据 | *
libreoffice-fresh | 必备的办公软件 | Microsoft Office
inkscape | 强大的矢量图形编辑软件 | Adobe Illustrator、CorelDraw
youtube-dl | YouTube 视频下载工具 | *
glances | monitoring tool | *
keepass | password manage | *
hugo | static site generator | *
foliate | equb ... reader | *
anki | a spaced repetition system | *
informant | arch news reader and pacman hook | *
dnsutils | `dig` | *
dnsmasq | 使用国外 DNS 造成国内网站访问慢的解决方法 | *
tldr | <https://github.com/tldr-pages/tldr> | *
virtualbox | Virtual Machine | *

```sh
sudo pacman -S google-chrome visual-studio-code-bin netease-cloud-music flameshot proxychains-ng redshift vlc telegram-desktop gthumb libreoffice-fresh inkscape youtube-dl glances keepass hugo foliate anki informant dnsutils dnsmasq tldr virtualbox virtualbox-host-modules-arch virtualbox-ext-oracle virtualbox
```

### informant

An Arch Linux News reader and pacman hook. You could use a pacman hook like informantAUR which prevents you from updating if there is fresh Arch News that you have not read since the last update ran.

ref: <https://wiki.archlinux.org/title/System_maintenance#Read_before_upgrading_the_system>

### Virtualbox

<https://wiki.archlinux.org/title/VirtualBox>

Error message:

```sh
WARNING: The vboxdrv kernel module is not loaded. Either there is no module
         available for the current kernel (5.13.8-arch1-1) or it failed to
         load. Please recompile the kernel module and install it by

           sudo /sbin/vboxconfig

         You will not be able to start VMs until this problem is fixed.
```

```sh
sudo modprobe vboxdrv
```

No message now.

### Vagrant

<https://wiki.archlinux.org/title/Vagrant>

```sh
sudo pacman -S vagrant
mkdir arch-vagrant &&  cd $_
vim Vagrantfile
vagrant up
```

`Vagrantfile`:

```sh
Vagrant.configure("2") do |config|
  config.vm.box = "archlinux/archlinux"
end
```

After exec `vagrant up`, error message:

> No usable default provider could be found for your system.
>
> Vagrant relies on interactions with 3rd party systems, known as
>
> "providers", to provide Vagrant with resources to run development
>
> environments. Examples are VirtualBox, VMware, Hyper-V.
>
> The easiest solution to this message is to install VirtualBox, which
>
> is available for free on all major platforms.
>
> If you believe you already have a provider available, make sure it
>
> is properly installed and configured. You can see more details about
>
> why a particular provider isn't working by forcing usage with
>
> `vagrant up --provider=PROVIDER`, which should give you a more specific
>
> error message for that particular provider.

After exec `sudo modprobe vboxdrv`, no message now.

```sh
vagrant up


Vagrant is currently configured to create VirtualBox synced folders with
the `SharedFoldersEnableSymlinksCreate` option enabled. If the Vagrant
guest is not trusted, you may want to disable this option. For more
information on this option, please refer to the VirtualBox manual:

  https://www.virtualbox.org/manual/ch04.html#sharedfolders

This option can be disabled globally with an environment variable:

  VAGRANT_DISABLE_VBOXSYMLINKCREATE=1

or on a per folder basis within the Vagrantfile:

  config.vm.synced_folder '/host/path', '/guest/path', SharedFoldersEnableSymlinksCreate: false
```

### Mutt

终端邮件 <http://www.mutt.org/>

### Flameshot

可以配置下快捷键，使用起来更加快捷。去 Settings > Keyboard，然后下拉页面到底部，点击 `+` 号，Name 填 `Flameshot`，Command 填 `flameshot gui`，然后点击下 Shortcut 的右方方块，按下 `Alt` + `Super/Win` + `P` 键

### Anki

<https://apps.ankiweb.net/#download>

```sh
tar xjf ~/Downloads/anki-2.1.46-linux.tar.bz2
cd anki-2.1.46-linux
sudo ./install.sh
```

### exercism

```sh
# https://github.com/exercism/cli/releases/ download exercism-linux-64bit.tgz
tar -xf exercism-linux-64bit.tgz
# Once you download and extract the archive, make it available in your $PATH
cd ~/Downloads/exercism-linux-64bit
mkdir -p ~/bin
mv exercism ~/bin
~/bin/exercism
exercism configure --token=
```

### Scheme Programming Language

```sh
guile hello-world.scm
;;; note: source file /home/archie/exercism/scheme/hello-world/hello-world.scm
;;;       newer than compiled /home/archie/.cache/guile/ccache/2.2-LE-8-3.A/home/archie/exercism/scheme/hello-world/hello-world.scm.go
;;; note: auto-compilation is enabled, set GUILE_AUTO_COMPILE=0
;;;       or pass the --no-auto-compile argument to disable.
;;; compiling /home/archie/exercism/scheme/hello-world/hello-world.scm
;;; compiled /home/archie/.cache/guile/ccache/2.2-LE-8-3.A/home/archie/exercism/scheme/hello-world/hello-world.scm.go
Hello World!

guile hello-world.scm --no-auto-compile
```

How to close these info?

```zshrc
alias guile="guile --no-auto-compile"
```

[Install guile](https://www.linuxfromscratch.org/blfs/view/svn/general/guile.html)

### `nscd` 自启动

```sh
systemctl enable nscd
```

nscd is a daemon that provides a cache for the most common name service requests. The default configuration file, /etc/nscd.conf, determines the behavior of the cache daemon.

### redshift

115.622324,33.165395

```sh
mkdir ~/.config/redshift
vim ~/.config/redshift/redshift.conf
```

`~/.config/redshift/redshift.conf`:

```conf
[redshift]
location-provider=manual
temp-day=5500
temp-night=3700

[manual]
lat=33.165395
lon=115.622324
```

ref:

1. <https://wiki.archlinux.org/title/redshift>
2. <https://io-oi.me/tech/hello-arch-linux/#redshift>

## 让 Arch Linux 系统和最新的镜像同步，从最快的镜像下载

<https://blog.lilydjwg.me/2020/10/29/pacsync.215578.html>

```sh
#!/bin/bash -e

unshare -m bash <<'EOF'
mount --make-rprivate /
for f in /etc/pacman.d/*.sync; do
  filename="${f%.*}"
  mount --bind "$f" "$filename"
done
pacman -Sy
EOF
```

## 使用国外 DNS 造成国内网站访问慢的解决方法

<https://wzyboy.im/post/874.html>

```sh
systemctl status dnsmasq
 dnsmasq.service - dnsmasq - A lightweight DHCP and caching DNS server
     Loaded: loaded (/usr/lib/systemd/system/dnsmasq.service; enabled; vendor preset: disabled)
     Active: inactive (dead)
       Docs: man:dnsmasq(8)
```

`dnsmasq.service: Start request repeated too quickly.`:

The default limit is to allow 5 restarts in a 10sec period. If a service goes over that threshold due to the `Restart=` config option in the service definition, it will not attempt to restart any further.

ref:

1. <https://github.com/felixonmars/dnsmasq-china-list>
2. <https://serverfault.com/a/845473>
3. <https://web.archive.org/web/20191101231638/http://felixc.at:80/Dnsmasq>

## 备份

- <https://blog.lilydjwg.me/2013/12/29/rsync-btrfs-dm-crypt-full-backup.42219.html>
- <https://github.com/teejee2008/timeshift>

```sh
sudo pacman -S timeshift
```

### timeshift

1. Snapshot type: rsync ~~(btrfs cannot use because of BTRFS snapts are saved on system partition)~~
2. User home directories: root-include all files, user-include only hidden files

## 自动更新 hosts GitHub 相关 IP

ref:

1. <https://bbs.archlinuxcn.org/viewtopic.php?pid=43366#p43366>
2. <https://gist.github.com/lilydjwg/93d33ed04547e1b9f7a86b64ef2ed058>
3. <https://github.com/rbew/github-host>

前提：`/etc/hosts` 文件中要先存在 `github.com`

```sh
sudo pacman -S python-aiohttp
```

## Problems

### `command not found: service`

使用 `systemctl` 是可行的。

### fcitx

Follow above section works

### `Unknown download protocol: https`

安装软件时错误，Unknown download protocol: https

更新 pacman 包，但是当用 yay 下载 netease-cloud-music 时，仍然出现这个错误。

### 中文语言不能选择 Hanyu Pinyin (with AltGr dead keys)，当我通过鼠标点击切换到它时，电脑卡了

### Cannot find fcitx input method module for Qt4.

### 系统卡顿

2次进入 tplogin.cn 均卡顿，似乎与进入网址无关

本来使用有线接入网络，树莓派需要用到有线，限于网线只有一根。于是，电脑连接无线网络。

进入路由器管理页面，点击〔设备管理〕/〔应用管理〕页面后，出现卡顿现象。具体表现：键盘鼠标失灵

采取措施：按住电源键重启。

依旧卡顿，仅仅打开一个网页。

---

现在暂时不卡顿，解决办法：

设置 BIOS U 盘启动，插入制作好的 USB 启动盘，进入 U 盘中的 arch 系统，然后执行命令：

```sh
mount /dev/sdb2 /mnt
arch-root /mnt /bin/bash
cd /var/cache/pacman/pkg
ls -a | grep linux
pacman -U linux-5.13.9.arch1-1-x86_64.pkg.tar.zst
# linux kernel: 5.13.10 --> 5.13.9
```

依然出现卡顿，推测是无线网的缘故，需要安装驱动。（驱动已安装）

编辑了 /etc/default/grub:

GRUB_CMDLINE_LINUX_DEFAULT="elevator=noop loglevel=3 quiet"

GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet mds=full,nosmt"

ref:

1. <https://wiki.archlinux.org/title/downgrading_packages#Downgrading_the_kernel>
2. <https://www.kernel.org/doc/html/latest/admin-guide/hw-vuln/mds.html>
3. <https://askubuntu.com/a/1250060>
4. <https://www.google.com/url?sa=t&source=web&rct=j&url=https://www.linprofs.com/blog/how-to-patch-the-intel-mds-bug/&ved=2ahUKEwjwq-W9jbjyAhWqQPUHHVznB0IQFnoECD4QAQ&usg=AOvVaw1Ijihg0Il1razMVV1yrvM9>
5. <https://wiki.archlinux.org/title/Security_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)>

### rpi-imager 能够用 `yay -S rpi-imager` 下载，却不能用 `sudo pacman -S rpi-imager` 下载

### gparted `Too many primary partitions`

Create new partition atble, then solved.
