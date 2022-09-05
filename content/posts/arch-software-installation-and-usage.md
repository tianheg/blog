+++
title = "Arch Linux 软件安装和用法"
author = ["Tianhe Gao"]
date = 2021-08-20T00:00:00+08:00
lastmod = 2022-09-05T12:48:37+08:00
tags = ["Arch Linux", "技术"]
draft = false
toc = true
+++

## 隐藏 GRUB 加载 {#隐藏-grub-加载}

[参考资料](https://www.reddit.com/r/linux4noobs/comments/5372gj/comment/d7qjh6s/)

```sh
# vim /etc/default/grub
# grub-mkconfig -o /boot/grub/grub.cfg
```

修改 `etc/default/grub` ：

```diff
-GRUB_TIMEOUT=1
+GRUB_TIMEOUT=0
```


## Reflector 更新镜像 {#reflector-更新镜像}

<https://wiki.archlinux.org/title/reflector>


### 开机自动执行 {#开机自动执行}

`/etc/xdg/reflector/reflector.conf` ：

```text
--save /etc/pacman.d/mirrorlist
--country China
--protocol https
--latest 5
```

```sh
systemctl enable reflector
systemctl start reflector
vim /usr/lib/systemd/system/reflector.service
```

在 `[Service] -> ExecStart` 值的开始添加 `/usr/bin/proxychains` 。这一步要在代理设置好完成。之所以这样做是因为中国的网络对国外内容不友好，如果不设置代理，直接执行 `systemctl start reflector` 会出现如下错误。

```sh
# error: failed to retrieve mirrorstatus data: URLError: <urlopen error [Errno 101] Network is unreachable>
```


### 通过 Pacman hook 自动化以上步骤 {#通过-pacman-hook-自动化以上步骤}

`/etc/pacman.d/hooks/mirrorupgrade.hook` ：

```text
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


## 设置代理 {#设置代理}


### Clash {#clash}

```sh
# pacman -S clash
# clash # Generate config.yaml, Country.mmdb in ~/.config/clash
## download yaml file from your service provider, rename it to config.yaml, put it under your clash folder

# open clash at start https://github.com/Dreamacro/clash/wiki/clash-as-a-daemon
# vim /etc/systemd/system/clash.service
```

`/etc/systemd/system/clash.service` ：

```service
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


### proxychains-ng {#proxychains-ng}

<https://github.com/rofl0r/proxychains-ng>

```sh
pacman -S proxychains-ng
```


## Emacs Hunspell {#emacs-hunspell}

<https://github.com/hunspell/hunspell#usage>

```sh
# mkdir /usr/share/hunspell
# cd /usr/share/hunspell
# wget -O en_US.aff  https://cgit.freedesktop.org/libreoffice/dictionaries/plain/en/en_US.aff?id=a4473e06b56bfe35187e302754f6baaa8d75e54f
# wget -O en_US.dic https://cgit.freedesktop.org/libreoffice/dictionaries/plain/en/en_US.dic?id=a4473e06b56bfe35187e302754f6baaa8d75e54f
```


## 输入法配置 {#输入法配置}

想把 ibus 移除，只使用 fcitx。后来发现 ibus 被很多程序依赖无法删除。

```sh
# pacman -S fcitx-im fcitx-configtool fcitx-googlepinyin kcm-fcitx
```

Add support for gtk,qt:

添加对 gtk，qt 类（指通过 gtk、qt 编程得到的软件）软件的支持：

```text
# /etc/profile
export XMODIFIERS="@im=fcitx"
export GTK_IM_MODULE="fcitx"
export QT_IM_MODULE="fcitx"
```

Install fcitx5，并安装词库、主题：

```sh
# pacman -Rsc fcitx
# pacman -S fcitx5-im fcitx5-chinese-addons fcitx5-pinyin-zhwiki fcitx5-material-color
```

配置开机启动；主题：material-color-black

但是，当我安装好时，不能在 Konsole 这个命令行模拟器输入中文，尝试很多办法 `/etc/profile` （如上所示），在 `~/.profile` 等文件中加入以上相同的内容，但是（可能因为没有关机再开机）依然不可行。终于在 [Wayland environment - Environment variables - ArchWiki](https://wiki.archlinux.org/title/Environment_variables#Wayland_environment) 这里发现，需要设置 Wayland 环境变量。


### fcitx5 使用发现 {#fcitx5-使用发现}

`Enter` 回车键异常：中文模式下，按 ； 后再按 Enter 无法输入英文分号。可能不是问题，刚从 fcitx4 升级到 fcitx5。

经过这些时间的磨合，发现：这的确是一个 bug。过段时间，我改变了想法，想到这可能是因为不同软件之间 `Enter` 键的作用不同造成的。


## 字体 {#字体}

[Coding with Character](https://realdougwilson.com/writing/coding-with-character)

使用的是以前用过的 GNOME 桌面环境的默认字体设置：

-   Cantarell Regular
-   Source Code Pro Regular
-   Cantarell Bold

所有安装的字体：

```sh
# pacman -S noto-fonts noto-fonts-extra noto-fonts-emoji noto-fonts-cjk ttf-dejavu ttf-liberation ttf-roboto ttf-inconsolata libertinus-font ttf-droid adobe-source-han-sans-cn-fonts adobe-source-han-serif-cn-fonts
# yay -S otf-ibm-plex
```

中文：

noto-fonts, noto-fonts-cjk, noto-fonts-emoji, noto-fonts-extra

代码：

monaco, menlo, hack, IBM Plex Mono

-   命令行安装的字体所在的目录： `/usr/share/fonts/`
-   手动安装的字体所在的目录： `~/.local/share/fonts/`

<!--listend-->

```sh
# fc-cache -fv # 更新字体缓存
```


## 蓝牙 {#蓝牙}

```sh
# systemctl enable --now bluetooth
```


## Git {#git}

```sh
# pacman -S openssh
#wget -O ~/.gitconfig https://github.com/tianheg/dotfiles/raw/main/gitconfig
# 不要忘记 commit.gpgsign true

## SSH
# chmod 400 ~/.ssh/id_ed25519
# 解决 sign_and_send_pubkey: signing failed for ED25519 "/home/user/.ssh/id_ed25519" from agent: agent refused operation; git@github.com: Permission denied (publickey).
```


## GPG {#gpg}

修改 `~/.gnupg/` 权限：

```sh
# https://superuser.com/a/954536 ; https://superuser.com/a/954639
# Set ownership to your own user and primary group
# chown -R "$USER:$(id -gn)" ~/.gnupg
# Set permissions to read, write, execute for only yourself, no others
# chmod 700 ~/.gnupg
# Set permissions to read, write for only yourself, no others
# chmod 600 ~/.gnupg/*
```

这几条命令解决 `gpg: WARNING: unsafe permissions on homedir '/home/user/.gnupg'` 。

**把 `~/.gnupg` 文件夹保存在安全的地方** ，然后导入 GitHub(user + web-flow)公匙：

```sh
wget -O tianheg-pubkeys.txt https://github.com/tianheg.gpg
wget -O github-web-flow.txt https://github.com/web-flow.gpg
gpg --import tianheg-pubkeys.txt
gpg --import github-web-flow.txt
```

安装 seahorse 以防止每次 git commit 都要输入密码（不必麻烦，通过设置 `~/.gnupg/gpg-agent.conf` 可以延长密码时效）。

```cfg
default-cache-ttl 28800
max-cache-ttl 28800
```


## 键盘映射 {#键盘映射}

<https://tonsky.me/blog/cursor-keys/>

把上下左右键映射到字母键：

```sh
vim ~/ijkl
xmodmap ~/ijkl
```

`ijkl` ：

```sh
keycode 66 = Mode_switch
keysym j = j J Left
keysym l = l L Right
keysym i = i I Up
keysym k = k K Down
```

但是，在做完以上步骤后，我的 Left Ctrl -&gt; CapsLock 的映射失效了，所以我需要修改文件内容。

让一切恢复之前的状态的命令： `setxkbmap -layout us` 。

在 KDE 桌面环境下，有方便的系统设置菜单，可以设置键盘映射。


## pacman {#pacman}


### 添加 archlinuxcn {#添加-archlinuxcn}

添加库 `/etc/pacman.conf` ：

```cfg
[archlinuxcn]
Server = https://repo.archlinuxcn.org/$arch
```

导入 PGP 公匙（为了验证 archlinuxcn 库）:

```sh
# pacman -Syy && pacman -S archlinuxcn-keyring
```


### pacman 命令 {#pacman-命令}

```sh
## 常用
# pacman -Qe # List all explicitly installed packages
# pacman -Qet # list all packages explicitly installed and not required as dependencies
# pacman -Qent # List all explicitly installed native packages (i.e. present in the sync database) that are not direct or optional dependencies
# pacman -Qn # List all native packages (installed from the sync database(s))
# pacman -Qm # List all foreign packages (typically manually downloaded and installed or packages removed from the repositories)

# sudo pacman -Qtdq | sudo pacman -Rns - # recursively removing orphans and their configuration files

# sudo pacman -Qii | awk '/^MODIFIED/ {print $2}' # print modified files under /etc

# pacman -Qs regex # List packages by regex

# pacman -Qg group_name # List installed packages under this group
# pacman -Sg group # List all packages in the package group named `group`, etc, base-devel, gnome
# pacman -Slq | rg <package> # search package_name
# pacman -Qq | grep -Ee '-(bzr|cvs|darcs|git|hg|svn)$' # list all development/unstable packages
# pacman -Syu # Update package list and upgrade all packages afterwards
# pacman -Syu git # Update package list, upgrade all packages, and then install git if it wasn’t already installed

#pacman -S package_name1 package_name2 # Installing specific packages
#pacman -S $(pacman -Ssq package_regex) # Install a list of packages with regex
#pacman -S extra/package_name # Install specific repositories' package
#pacman -S plasma-{desktop,mediacenter,nm}
#pacman -S plasma-{workspace{,-wallpapers},pa}

#pacman -S gnome # Install through group of packages
# Enter a selection (default=all): 1-10 15 # which will select packages 1 through 10 and 15 for installation
# Enter a selection (default=all): ^5-8 ^2 # which will select all packages except 5 through 8 and 2 for installation

#pacman -R package_name # remove a single package, leaving all of its dependencies installed
#pacman -Rs package_name # remove a single package and its dependencies which are not required by any other installed package

#pacman -Qtd # check for packages that were installed as a dependency but now, no other packages depend on them

#pacman -Ss string1 string2 ... # search for packages in the database
#pacman -Qs string1 string2 ... # search for already installed packages
#pacman -F string1 string2 ... # search for package file names in remote packages
#pacman -Fy string1 string2 ... # first flush local cache, then search for package file names in remote packages

#pacman -Si package_name # display extensive information about a given package
#pacman -Qi package_name # display extensive information about locally installed packages
#pacman -Qii package_name # also display the list of backup files and their modification states

#pacman -Ql package_name # retrieve a list of the files installed by a package
#pacman -Fl package_name # retrieve a list of the files installed by a remote package


## Rarely use
#pacman -Qk package_name # verify the presence of the files installed by a package, Passing the k flag twice will perform a more thorough check
#pacman -Qo /path/to/file_name # query the database to know which package a file in the file system belongs to
#pacman -Qo command_name # 找到所属包
#pacman -F /path/to/file_name # query the database to know which remote package a file belongs to
```


### 应该避免执行的 pacman 指令 {#应该避免执行的-pacman-指令}

```sh
# pacman -Sy # never run!!!
# pacman -Rdd package # never run!!!
```

在 Arch 中安装包时应避免没有升级系统就刷新包列表。这样做是为了避免出现依赖问题，比如，如果一个包被从官方仓库中移除，在进行包同步时就会报错。在实践中，不要执行 `pacman -Sy package_name` ，应该执行 `pacman -Syu package_name` 。


### 执行 pacman 命令过程中，遇到的信息/警告/错误 {#执行-pacman-命令过程中-遇到的信息-警告-错误}

循环依赖：

```text
warning: dependency cycle detected
```

执行 `sudo pacman -Syu` 时：

```text
WARNING: Possibly missing firmware for module
```

这是一种警告。

参考：

1.  <https://wiki.archlinux.org/title/Mkinitcpio#Possibly_missing_firmware_for_module_XXXX>
2.  <https://arcolinuxforum.com/viewtopic.php?t=1174>

gpg: key 786C63F330D7CB92: no user ID for key signature packet of class 10

```sh
gpg: key 786C63F330D7CB92: no user ID for key signature packet of class 10
gpg: key 1EB2638FF56C0C53: no user ID for key signature packet of class 10
gpg: next trustdb check due at 2021-10-09
  -> Disabled 3 keys.

## try 1
# pacman-key --refresh-keys
# pacman -S archlinux-keyring archlinuxcn-keyring
## try 2
# rm -R /etc/pacman.d/gnupg/ # No such file or directory
# rm -rf /etc/pacman.d/gnupg/
# rm -R /root/.gnupg/
# rm -R /var/cache/pacman/pkg/
# gpg --refresh-keys
# pacman-key --init
# pacman-key --populate archlinux # still display `gpg: key xxx: no user ID for key signature packet of class 10`
# pacman-key --refresh-keys
# pacman -Syyu
```

warning: /etc/pacman.d/mirrorlist installed as /etc/pacman.d/mirrorlist.pacnew

/etc/mkinitcpio.d/linux.preset: 'default' and /etc/mkinitcpio.d/linux.preset: 'fallback'

参考：

1.  [Installing and upgrading packages](https://wiki.archlinux.org/title/Arch_User_Repository#Installing_and_upgrading_packages)
2.  [Is it possible that there is a major kernel update in the repository, and that some of the driver packages have not been updated?](https://wiki.archlinux.org/title/Frequently_asked_questions#Is_it_possible_that_there_is_a_major_kernel_update_in_the_repository,_and_that_some_of_the_driver_packages_have_not_been_updated?)
3.  <https://wiki.archlinux.org/title/Pacman/Tips_and_tricks>
4.  <https://wiki.archlinux.org/title/Pacman>
5.  <https://wiki.archlinux.org/title/System_maintenance#Avoid_certain_pacman_commands>
6.  <https://wiki.archlinux.org/title/Pacman/Rosetta>
7.  <https://wiki.archlinux.org/title/Mkinitcpio>


## yay {#yay}

Yet Another Yogurt: 又一个从 Arch User Repository 下载包的工具。


### 安装 yay {#安装-yay}

官方仓库：<https://github.com/Jguer/yay>

```sh
# pacman -S --needed git base-devel
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
```

如果想通过 pacman 官方仓库里的 yay 包安装，在版本升级时可能会有滞后。可以在通过 pacman 安装 yay 后，运行命令：

```sh
# yay -S yay
```

保证得到 yay 的最新版本。


### 使用 yay {#使用-yay}

```sh
# Interactively search and install packages from the repos and AUR:
# yay package_name|search_term
# Synchronize and update all packages from the repos and AUR:
# yay
#Synchronize and update only AUR packages:
# yay -Sua
# Install a new package from the repos and AUR:
# yay -S package_name
# Remove an installed package and both its dependencies and configuration files:
# yay -Rns package_name
# Search the package database for a keyword from the repos and AUR:
# yay -Ss keyword
# Remove orphaned packages (installed as dependencies but not required by any package):
# yay -Yc
# Show statistics for installed packages and system health:
# yay -Ps
```


### yay 问题 {#yay-问题}

1.  安装时总是出现 `WARNING: Using existing $srcdir/ tree` ，这个可以忽视，只是说明安装过程。
2.  timeout 问题 <https://github.com/Jguer/yay/issues/1278#issuecomment-635833427>
3.  `Missing AUR Packages`

参考：

1.  <https://github.com/Jguer/yay>
2.  <https://github.com/Jguer/yay/issues/1248>


## 备份 {#备份}

timeshift 在最近一次系统损坏中成为了罪魁祸首：新旧 GRUB 版本的冲突让我的系统不断进入 GRUB rescue 模式，只能重装，幸好通过 USB 启动盘将一些数据备份了出来。

-   <https://blog.lilydjwg.me/2013/12/29/rsync-btrfs-dm-crypt-full-backup.42219.html>
-   <https://github.com/teejee2008/timeshift>

<!--listend-->

```sh
# pacman -S timeshift
```


### timeshift {#timeshift}

1.  Snapshot type: rsync (btrfs cannot use because of BTRFS snapts are saved on system partition)
2.  User home directories: root-include all files, user-include only hidden files


## 常用命令行工具 {#常用命令行工具}


### ohmyzsh {#ohmyzsh}

<https://github.com/ohmyzsh/ohmyzsh>

安装前提：

1.  [Zsh](https://www.zsh.org/)： `pacman -S zsh`
2.  `curl` / `wget` installed
3.  `git` installed

<!--listend-->

```sh
# sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
## or
# sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

## plugins
# git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
# git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
# git clone https://gist.github.com/475ee7768efc03727f21.git ~/.oh-my-zsh/custom/plugins/git-auto-status
# git clone https://github.com/jameshgrn/zshnotes/ ~/.oh-my-zsh/custom/plugins/zshnotes

## my configuration
# cp dotfiles/shell/zsh/zshrc ~/.zshrc
```


### z.lua {#z-dot-lua}

```sh
# git clone https://github.com/skywind3000/z.lua.git ~/.z.lua
# pacman -S lua
```


### exa {#exa}

A modern replacement for `ls` (List directory contents) <https://the.exa.website>

```sh
exa
exa --oneline # List files one per line
exa --all # List all files, including hidden files
exa --long --all # Long format list (permissions, ownership, size and modification date) of all files
exa --reverse --sort=size # List files with the largest at the top
exa --long --tree --level=3 # Display a tree of files, three levels deep
exa --long --sort=modified # List files sorted by modification date (oldest first)
exa --long --header --icons --git # List files with their headers, icons, and Git statuses
exa --git-ignore # Don't list files mentioned in `.gitignore`
```


### bat {#bat}

<https://github.com/sharkdp/bat>

cat 的替代

```sh
pacman -S bat
```


### tldr {#tldr}

1.  tldr-node-client

<!--listend-->

```sh
npm install -g tldr
cd ~/.nvm/versions/node/v14.18.1/lib/node_modules/tldr
mkdir -p $ZSH_CUSTOM/plugins/tldr
cp bin/completion/zsh/_tldr $ZSH_CUSTOM/plugins/tldr/_tldr
```

在 `~/.zshrc` 的 plugins 中加入 tldr。

1.  tldr-python-client

<!--listend-->

```sh
# pacman -S tldr
```

在 `~/.zshrc` 中加入以下内容：

```cfg
export TLDR_CACHE_ENABLED=1
export TLDR_CACHE_MAX_AGE=720
export TLDR_PAGES_SOURCE_LOCATION="https://raw.githubusercontent.com/tldr-pages/tldr/master/pages"
export TLDR_DOWNLOAD_CACHE_LOCATION="https://tldr-pages.github.io/assets/tldr.zip"
```


### netstat {#netstat}

查看网络接口的占用情况

```sh
pacman -S net-tools
```


### hugo {#hugo}

<https://gohugo.io>

本博客站的生成程序

```sh
pacman -S hugo
```


### lf {#lf}

<https://github.com/gokcehan/lf>

终端文件管理器

```sh
pacman -S lf
```


## informant {#informant}

一个 Arch Linux 新闻阅读器和 pacman hook。可以帮你在更新包时检查是否还有没有阅读的 Arch Linux 新闻。


## Virtualbox {#virtualbox}

```sh
# pacman -S virtualbox virtualbox-host-modules-arch virtualbox-ext-oracle
# 这一次安装没有下面的错误消息，但是当我在 Virtualbox 新建虚拟机时，却出现了错误
```

![](/images/arch-software-installation-and-usage-0.png "这次错误")

图片表示 virtualbox linux kernel driver not installed。

但是，执行过几个命令好了，我不知道命令的作用，参考 [这个链接](https://bbs.archlinux.org/viewtopic.php?id=210006)：

```sh
modprobe vboxdrv
/sbin/rcvboxdrv setup
```

Error message:

```text
WARNING: The vboxdrv kernel module is not loaded. Either there is no module available for the current kernel (5.13.8-arch1-1) or it failed to load. Please recompile the kernel module and install it by

sudo /sbin/vboxconfig

You will not be able to start VMs until this problem is fixed.
```

运行命令解决：

```sh
modprobe vboxdrv
```


## earlyoom {#earlyoom}

如果是为了避免系统卡死，可以安装并使用 earlyoom。

该软件默认将在空余内存、空余 swap 两者均低于 10%时，结束 oom_score 值最高的进程，避免系统内存耗尽卡死。

```sh
# after install
# systemctl enable --now earlyoom
```


## Vagrant {#vagrant}

```sh
# pacman -S vagrant
# mkdir arch-vagrant && cd $_
# vim Vagrantfile
# vagrant up
```

`Vagrantfile` :

```cfg
Vagrant.configure("2") do |config|
    config.vm.box = "archlinux/archlinux"
end
```

运行 `vagrant up` 后的错误信息：

```text
No usable default provider could be found for your system.

Vagrant relies on interactions with 3rd party systems, known as

"providers", to provide Vagrant with resources to run development

environments. Examples are VirtualBox, VMware, Hyper-V.

The easiest solution to this message is to install VirtualBox, which

is available for free on all major platforms.

If you believe you already have a provider available, make sure it

is properly installed and configured. You can see more details about

why a particular provider isn't working by forcing usage with

`vagrant up --provider=PROVIDER`, which should give you a more specific

error message for that particular provider.
```

运行了 `sudo modprobe vboxdrv` 命令现在没有错误了。

```sh
vagrant up
```

Output:

```text
Vagrant is currently configured to create VirtualBox synced folders with
the `SharedFoldersEnableSymlinksCreate` option enabled. If the Vagrant
guest is not trusted, you may want to disable this option. For more
information on this option, please refer to the VirtualBox manual:

    https://www.virtualbox.org/manual/ch04.html#sharedfolders

This option can be disabled globally with an environment variable:

    VAGRANT_DISABLE_VBOXSYMLINKCREATE=1

or on a per folder basis within the Vagrantfile:

    config.vm.synced_folder '/host/path', '/guest/path', SharedFoldersEnableSymlinksCreate: false

NS_ERROR_INVALID_ARG
```


## QEMU {#qemu}

```sh
# pacman -S qemu
```

Output:

```text
Please add your user to the brlapi group.
Optional dependencies for brltty
    at-spi2-core: X11/GNOME Apps accessibility [installed]
    atk: ATK bridge for X11/GNOME accessibility [installed]
    espeak-ng: espeak-ng driver
    java-runtime: Java support [installed]
    libxaw: X11 support [installed]
    libxt: X11 support [installed]
    libx11: for xbrlapi [installed]
    libxfixes: for xbrlapi [installed]
    libxtst: for xbrlapi [installed]
    ocaml: OCaml support
    python: Python support [installed]
    speech-dispatcher: speech-dispatcher driver [installed]
vde config files should be placed in /etc/vde, sample files are provided.
iptables and dhcpd sample files have been installed to '/usr/share/vde2'.
Merge those examples, if needed to the according config files.
```


## VLC {#vlc}

音视频播放

```sh
pacman -S vlc
```


## 非常用软件 {#非常用软件}


### exercism {#exercism}

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


### Scheme Programming Language {#scheme-programming-language}

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

如果关闭提示？在 `~/.zshrc` 文件中添加如下别名：

```cfg
alias guile="guile --no-auto-compile"
```

[Guile Install guile](https://www.linuxfromscratch.org/blfs/view/svn/general/guile.html)


### `nscd` 自启动 {#nscd-自启动}

```sh
systemctl enable nscd
```

nscd is a daemon that provides a cache for the most common name service requests. The default configuration file, /etc/nscd.conf, determines the behavior of the cache daemon.


### redshift {#redshift}

需要纬度，经度

```sh
mkdir ~/.config/redshift
vim ~/.config/redshift/redshift.conf
```

`~/.config/redshift/redshift.conf` ：

```sh
[redshift]
location-provider=manual
temp-day=5500
temp-night=3700

[manual]
lat=33.165395
lon=115.622324
```

参考：

1.  <https://wiki.archlinux.org/title/redshift>
2.  <https://io-oi.me/tech/hello-arch-linux/#redshift>


## 一些文档 {#一些文档}

-   [让 Arch Linux 系统和最新的镜像同步，从最快的镜像下载](https://blog.lilydjwg.me/2020/10/29/pacsync.215578.html)
-   [使用国外 DNS 造成国内网站访问慢的解决方法](https://wzyboy.im/post/874.html)


## 软件安装列表 {#软件安装列表}

| 名字                                            | 说明                                                                                                                                                              |
|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| wl-clipboard                                    | Wayland clipboard utilities                                                                                                                                       |
| spectacle                                       | KDE 开发的截图软件                                                                                                                                                |
| net-tools                                       | 提供 netstat 命令                                                                                                                                                 |
| chromium                                        | 开源浏览器（基于 Blink 渲染引擎）                                                                                                                                 |
| google-chrome                                   | 浏览器                                                                                                                                                            |
| firefox                                         | 浏览器                                                                                                                                                            |
| firefox-esr                                     | Firefox(Extended Support Release)浏览器                                                                                                                           |
| firefox-developer-edition                       | 具有开发者定制功能的 Firefox 浏览器                                                                                                                               |
| brave-bin(aur)                                  | Web browser that blocks ads and trackers by default                                                                                                               |
| lynx                                            | A text browser for the World Wide Web                                                                                                                             |
| pulseaudio                                      | A featureful, general-purpose sound server                                                                                                                        |
| kmix                                            | 修复 Firefox 没有声音                                                                                                                                             |
| profile-cleaner                                 | Simple script to vacuum and reindex sqlite databases used by browsers 用于对浏览器使用的 sqlite 数据库进行清理和重新索引的简单脚本                                |
| visual-studio-code-bin                          | Visual Studio Code                                                                                                                                                |
| netease-cloud-music                             | 网易云音乐                                                                                                                                                        |
| flameshot                                       | 现代、快捷、轻便的截图工具                                                                                                                                        |
| proxychains-ng                                  | 终端内科学上网代理工具                                                                                                                                            |
| redshift                                        | 显示屏色温调节工具                                                                                                                                                |
| vlc                                             | 强大的多媒体播放工具                                                                                                                                              |
| telegram-desktop                                | 客户端开源的加密聊天工具                                                                                                                                          |
| gthumb                                          | 图片浏览工具，可简单编辑图片，可清除照片元数据                                                                                                                    |
| libreoffice-fresh                               | 必备的办公软件                                                                                                                                                    |
| inkscape                                        | 强大的矢量图形编辑软件                                                                                                                                            |
| youtube-dl                                      | YouTube 视频下载工具                                                                                                                                              |
| glances                                         | terminal monitoring tool                                                                                                                                          |
| keepassxc                                       | password manager                                                                                                                                                  |
| hugo                                            | static site generator                                                                                                                                             |
| python-sphinx                                   | a documentation generator                                                                                                                                         |
| anki                                            | a spaced repetition system                                                                                                                                        |
| informant                                       | arch news reader and pacman hook                                                                                                                                  |
| dnsutils                                        | provide `dig` command                                                                                                                                             |
| dnsmasq                                         | 使用国外 DNS 造成国内网站访问慢的解决方法                                                                                                                         |
| tldr                                            | Collaborative cheatsheets for console commands                                                                                                                    |
| virtualbox                                      | Virtual Machine                                                                                                                                                   |
| qemu                                            | A generic and open source machine emulator and virtualizer                                                                                                        |
| earlyoom                                        | Early OOM Daemon for Linux                                                                                                                                        |
| gtk2/3/4                                        | GObject-based multi-platform GUI toolkit                                                                                                                          |
| lsb-release                                     | LSB version query program                                                                                                                                         |
| exa                                             | A modern replacement for ls (List directory contents)                                                                                                             |
| filezilla                                       | Fast and reliable FTP FTPS and SFTP client                                                                                                                        |
| intellij-idea-community-edition                 | IDE                                                                                                                                                               |
| mysql                                           | Database                                                                                                                                                          |
| sagemath                                        | Open Source Mathematics Software free alternative to Magma Maple Mathematica and Matlab Matlab dkms Dynamic Kernel Modules System                                 |
| maven                                           | Java project management and project comprehension tool                                                                                                            |
| graphviz                                        | Graph visualization software                                                                                                                                      |
| cmdpxl                                          | a totally practical command-line image editor 一个在命令行里画画的程序                                                                                            |
| octave(GUI)                                     | A high-level language, primarily intended for numerical computations.                                                                                             |
| asciiquarium                                    | An aquarium/sea animation in ASCII art                                                                                                                            |
| lx-music-desktop-bin                            | A music software based on Electron + Vue. 一个基于 Electron + Vue 开发的音乐软件                                                                                  |
| feeluown                                        | FeelUOwn Music Player(feeluown-netease feeluown-qqmusic feeluown-local)                                                                                           |
| nuclear-player-bin                              | A free, multiplatform music player app that streams from multiple sources.                                                                                        |
| beets                                           | Flexible music library manager and tagger                                                                                                                         |
| mps-youtube                                     | Terminal based YouTube jukebox with playlist management                                                                                                           |
| mopidy                                          | An extensible music server written in Python                                                                                                                      |
| postman-bin                                     | Build, test, and document your APIs faster                                                                                                                        |
| mongodb-bin                                     | A high-performance, open source, schema-free document-oriented database                                                                                           |
| nginx                                           | Lightweight HTTP server and IMAP/POP3 proxy server                                                                                                                |
| zellij(aur)                                     | A terminal multiplexer.                                                                                                                                           |
| liferea                                         | A desktop news aggregator for online news feeds and weblogs                                                                                                       |
| arch-wiki-man(aur)                              | The Arch Wiki as linux man pages                                                                                                                                  |
| xterm                                           | X Terminal Emulator                                                                                                                                               |
| konsole                                         | KDE terminal emulator                                                                                                                                             |
| foliate                                         | ebook reader(EPUB, Mobipocket, Kindle, FictionBook, and Comicbook formats.)                                                                                       |
| mupdf                                           | Lightweight PDF and XPS viewer                                                                                                                                    |
| okular                                          | Document Viewer(pdf, mobi, equb)                                                                                                                                  |
| freemind                                        | A Java mindmapping tool                                                                                                                                           |
| wireshark-qt                                    | Network traffic and protocol analyzer/sniffer - Qt GUI                                                                                                            |
| newsboat                                        | An RSS/Atom feed reader for text terminals                                                                                                                        |
| [treesheets-bin](http://strlen.com/treesheets/) | TreeSheets free form data organizer [给你一张无限大可缩放的白纸, 你会在上面写什么?](https://hintsnet.com/pimgeek/2019/07/10/if-given-an-infinite-zoomable-paper-what-would-you-write/) |
| python-pipenv                                   | Sacred Marriage of Pipfile, Pip, &amp; Virtualenv.                                                                                                                |
| safeeyes(aur)                                   | Protect your eyes from eye strain using this simple and beautiful, yet extensible break reminder                                                                  |
| bat                                             | A cat(1) clone with wings                                                                                                                                         |
| htop                                            | Interactive process viewer                                                                                                                                        |
| prettyping                                      | A ping wrapper making the output prettier, more colorful, more compact, and easier to read                                                                        |
| cosbrowser(aur)                                 | COSBrowser 是腾讯云对象存储 COS 推出的可视化界面工具，让您可以使用更简单的交互轻松实现对 COS 资源的查看、传输和管理                                               |
| beekeeper-studio-appimage(aur)                  | Cross platform SQL editor and database management app for Windows, Linux, and Mac                                                                                 |
| dbeaver                                         | Free universal SQL Client for developers and database administrators (community edition)                                                                          |
| sqlitebrowser                                   | SQLite Database browser is a light GUI editor for SQLite databases, built on top of Qt                                                                            |
| adminer(aur)                                    | Adminer is available for MySQL, MariaDB, PostgreSQL, SQLite, MS SQL, Oracle, Elasticsearch, MongoDB and others via plugin                                         |
| treeline(aur)                                   | Outliner and PIM which stores information in a tree structure                                                                                                     |
| skopeo                                          | a command line utility that performs various operations on container images and image repositories                                                                |
| umoci(aur)                                      | modifies Open Container images                                                                                                                                    |
| zeal-git(aur)                                   | A simple documentation browser                                                                                                                                    |
| snyk(aur)                                       | CLI and build-time tool to find &amp; fix known vulnerabilities in open-source dependencies                                                                       |
| cloudflare-warp-bin(aur)                        | Cloudflare WARP client allows individuals and organizations to have a faster, more secure, and more private experience online                                     |
| rnote                                           | A simple drawing application to create handwritten notes                                                                                                          |
| yank-note-bin(aur)                              | A Hackable Markdown Note Application for Programmers                                                                                                              |
| imv                                             | a command line image viewer intended for use with tiling window managers                                                                                          |
| umlet                                           | Free UML Tool for Fast UML Diagrams                                                                                                                               |
| act                                             | Run your GitHub Actions locally                                                                                                                                   |
| speedtest-cli                                   | Command line interface for testing internet bandwidth using speedtest.net                                                                                         |
| rslsync(aur)                                    | Resilio Sync (ex:BitTorrent Sync) - automatically sync files via secure, distributed technology                                                                   |
| peek                                            | 录制 GIF 动图                                                                                                                                                     |
| obs-studio                                      | 录屏软件                                                                                                                                                          |
| pkgstats                                        | Submit a list of installed packages to the Arch Linux project                                                                                                     |
| masterpdfeditor                                 | A complete solution for viewing, creating and editing PDF files                                                                                                   |
| EtchDroid                                       | ios2usb on android                                                                                                                                                |
| archmage(aur)                                   | converts CHM files to HTML, plain text and PDF                                                                                                                    |