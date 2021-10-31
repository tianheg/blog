+++
date = '2021-08-20T10:47:41+08:00'
slug = 'arch-software-installation-and-usage'
tags = ['Arch']
title = 'Arch 软件安装和用法'
toc = true
+++
# Arch 软件安装和用法

## 隐藏 GRUB 加载

尝试过这种办法[^1]，没起作用；然后尝试这一个[^2]成功了：

```sh
sudo vim /etc/default/grub
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

修改 `etc/default/grub`:

```sh
-GRUB_TIMEOUT=1
+GRUB_TIMEOUT=0
```

## 挂载

挂载外来文件系统，推荐使用 udiskctl(install udisks2, `pkgfile -b udisksctl`) 命令，很多时候不需要 root 权限就能挂载和卸载[^3]。

## Reflector 更新镜像[^4]

### 开机自动执行

`/etc/xdg/reflector/reflector.conf`:

```text
--save /etc/pacman.d/mirrorlist
--country China
--protocol https
--latest 5
```

```sh
systemctl enable reflector
systemctl start reflector
```

### 通过 Pacman hook 自动化以上步骤

`/etc/pacman.d/hooks/mirrorupgrade.hook`:

```sh
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

### 设置代理

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

测试代理是否有效（脚本不起作用）[^5]：

```py
# 来自「依云」 https://blog.lilydjwg.me
def test_youtube(port: int) -Union[str, bool]:
  output = subprocess.check_output([
    'curl', '-sS', '-m30', '-H', 'Accept-Language: en',
    'https://www.youtube.com/premium', '--socks5-hostname', f'localhost:{port}',
  ], text=True)
  if 'Premium is not available in your country' in output:
    return False
  m = re.search(r'countryCode":"(\w+)', output)
  if m:
    return m.group(1)
  else:
    return 'US'
```

## 输入法配置[^6]

想把 ibus 移除，只使用 fcitx。后来发现 ibus 被很多程序依赖无法删除。

```sh
sudo pacman -S fcitx-im fcitx-configtool fcitx-googlepinyin
```

Add support for gtk,qt:

添加对 gtk，qt 类（指通过 gtk、qt 编程得到的软件）软件的支持：

```sh
# /etc/profile
export XMODIFIERS="@im=fcitx"
export GTK_IM_MODULE="fcitx"
export QT_IM_MODULE="fcitx"
```

升级 fcitx 版本 4->5，并安装词库、主题：

```sh
sudo pacman -Rsc fcitx
sudo pacman -S fcitx5-im fcitx5-chinese-addons fcitx5-pinyin-zhwiki fcitx5-material-color
```

配置开机启动；主题：material-color-black

### fcitx5 使用发现

`Enter` 回车键异常：中文模式下，按 <kbd>；</kbd> 后再按 <kbd>Enter</kbd> 无法输入英文分号。可能不是问题，刚从 fcitx4 升级到 fcitx5。

经过这些时间的磨合，发现：这的确是一个 bug。过段时间，我改变了想法，想到这可能是因为不同软件之间 `Enter` 键的作用不同造成的。

## 字体[^7]

使用的是以前用过的 GNOME 桌面环境的默认字体设置：

- Cantarell Regular 11
- Source Code Pro Regular 10
- Cantarell Bold 11

所有安装的字体：

```sh
sudo pacman -S noto-fonts noto-fonts-extra noto-fonts-emoji noto-fonts-cjk ttf-dejavu ttf-liberation ttf-roboto ttf-inconsolata ttf-linux-libertine ttf-droid adobe-source-han-sans-cn-fonts adobe-source-han-serif-cn-fonts
yay -S otf-eb-garamond ttf-monaco otf-san-francisco consolas-font
```

中文：

noto-fonts, noto-fonts-cjk, noto-fonts-emoji, noto-fonts-extra

代码：

monaco, menlo, hack, IBM Plex Mono

- 命令行安装的字体所在的目录：`/usr/share/fonts/`
- 手动安装的字体所在的目录：`~/.local/share/fonts/`

```sh
fc-cache -fv # 更新字体缓存
```

## 蓝牙

```sh
sudo systemctl enable --now bluetooth
```

## Git

```sh
wget -O ~/.gitconfig https://github.com/tianheg/dotfiles/raw/main/gitconfig
# 不要忘记 commit.gpgsign true

## SSH
chmod 400 ~/.ssh/id_ed25519
# 解决 sign_and_send_pubkey: signing failed for ED25519 "/home/user/.ssh/id_ed25519" from agent: agent refused operation; git@github.com: Permission denied (publickey).
```

## GPG

修改 `~/.gnupg/` 权限：

```sh
# https://superuser.com/a/954536 ; https://superuser.com/a/954639
# Set ownership to your own user and primary group
chown -R "$USER:$(id -gn)" ~/.gnupg
# Set permissions to read, write, execute for only yourself, no others
chmod 700 ~/.gnupg
# Set permissions to read, write for only yourself, no others
chmod 600 ~/.gnupg/*
```

这几条命令解决 `gpg: WARNING: unsafe permissions on homedir '/home/user/.gnupg'`。

**把 ~/.gnupg 文件夹保存在安全的地方**，然后导入公匙 GitHub(user + web-flow)：

```sh
wget -O tianheg-pubkeys.txt https://github.com/tianheg.gpg
wget -O github-web-flow.txt https://github.com/web-flow.gpg
gpg --import tianheg-pubkeys.txt
gpg --import github-web-flow.txt
```

## 键盘映射[^17]

把上下左右建映射到字母键：

```sh
vim ~/ijkl
xmodmap ~/ijkl
```

`ijkl`:

```
keycode 66 = Mode_switch
keysym j = j J Left
keysym l = l L Right
keysym i = i I Up
keysym k = k K Down
```

但是，在做完以上步骤后，我的 Left Ctrl -> CapsLock 的映射失效了，所以我需要修改文件内容。

让一切恢复之前的状态的命令：`setxkbmap -layout us`。

## pacman

Is it possible that there is a major kernel update in the repository, and that some of the driver packages have not been updated?

No, it is not possible. Major kernel updates (e.g. linux 3.5.0-1 to linux 3.6.0-1) are always accompanied by rebuilds of all supported kernel driver packages. On the other hand, if you have an unsupported driver package (e.g. from the AUR) installed on your system, then a kernel update might break things for you if you do not rebuild it for the new kernel. Users are responsible for updating any unsupported driver packages that they have installed.

### 配置 pacman

添加库 `/etc/pacman.conf`：

```sh
[archlinuxcn]
Server = https://repo.archlinuxcn.org/$arch
```

分布在中国境内的镜像见这里[^8]。

导入 PGP 公匙（为了验证 archlinuxcn 库）:

```sh
sudo pacman -Syy && sudo pacman -S archlinuxcn-keyring
```

### pacman 命令

```sh
## 常用
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
pacman -Qq | grep -Ee '-(bzr|cvs|darcs|git|hg|svn)$' # list all development/unstable packages
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

### 应该避免执行的 pacman 指令

```sh
pacman -Sy # never run!!!
pacman -Rdd package # never run!!!
```

在 Arch 中安装包时应避免没有升级系统就刷新包列表。这样做是为了避免出现依赖问题，比如，如果一个包被从官方仓库中移除，在进行包同步时就会报错。在实践中，不要执行 `pacman -Sy package_name`，应该执行 `pacman -Syu package_name`

### 执行 pacman 命令过程中，遇到的信息/警告/错误

循环依赖：

```sh
warning: dependency cycle detected
```

执行 `sudo pacman -Syu` 时：

```sh
WARNING: Possibly missing firmware for module
```

这是一种警告。

参考：

1. <https://wiki.archlinux.org/title/Mkinitcpio#Possibly_missing_firmware_for_module_XXXX>
2. <https://arcolinuxforum.com/viewtopic.php?t=1174>

gpg: key 786C63F330D7CB92: no user ID for key signature packet of class 10[^0]

```sh
gpg: key 786C63F330D7CB92: no user ID for key signature packet of class 10
gpg: key 1EB2638FF56C0C53: no user ID for key signature packet of class 10
gpg: next trustdb check due at 2021-10-09
  -> Disabled 3 keys.

## try 1
sudo pacman-key --refresh-keys
sudo pacman -S archlinux-keyring archlinuxcn-keyring
## try 2
sudo rm -R /etc/pacman.d/gnupg/ # No such file or directory
sudo rm -rf /etc/pacman.d/gnupg/
sudo rm -R /root/.gnupg/ 
sudo rm -R /var/cache/pacman/pkg/
sudo gpg --refresh-keys
sudo pacman-key --init
sudo pacman-key --populate archlinux # still display `gpg: key xxx: no user ID for key signature packet of class 10`
sudo pacman-key --refresh-keys
sudo pacman -Syyu
```

warning: /etc/pacman.d/mirrorlist installed as /etc/pacman.d/mirrorlist.pacnew

/etc/mkinitcpio.d/linux.preset: 'default' and /etc/mkinitcpio.d/linux.preset: 'fallback'

参考：

1. <https://wiki.archlinux.org/title/Arch_User_Repository#Installing_and_upgrading_packages>
2. <https://wiki.archlinux.org/title/Frequently_asked_questions#Is_it_possible_that_there_is_a_major_kernel_update_in_the_repository,_and_that_some_of_the_driver_packages_have_not_been_updated>?
3. <https://wiki.archlinux.org/title/Pacman/Tips_and_tricks>
4. <https://wiki.archlinux.org/title/Pacman>
5. <https://wiki.archlinux.org/title/System_maintenance#Avoid_certain_pacman_commands>
6. <https://wiki.archlinux.org/title/Pacman/Rosetta>
7. <https://wiki.archlinux.org/title/Mkinitcpio>

## yay

Yet Another Yogurt: 又一个从 Arch User Repository 下载包的工具。

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

1. 安装时总是出现 `==WARNING: Using existing $srcdir/ tree`，这个可以忽视，只是说明安装过程。
2. timeout 问题 <https://github.com/Jguer/yay/issues/1278#issuecomment-635833427>
3. `Missing AUR Packages`

参考：

1. <https://github.com/Jguer/yay>
2. <https://github.com/Jguer/yay/issues/1248>

## Imager(rpi-imager)

```sh
yay -S rpi-imager
```

对于支持 UEFI 启动的设备，直接复制 iso 镜像中的所有文件到安装介质（如 U 盘）中即可启动。

## 其他软件

参考：

1. <https://io-oi.me/tech/hello-arch-linux/>

| 名字  | 说明        |
| --- | --- |
| chromium | 开源浏览器（基于 Blink 渲染引擎） |
| google-chrome | 浏览器 |
| firefox | 浏览器 |
| firefox-esr | Firefox(Extended Support Release)浏览器 |
| firefox-developer-edition | 具有开发者定制功能的 Firefox 浏览器 |
| brave-bin(aur) | Web browser that blocks ads and trackers by default |
| lynx | A text browser for the World Wide Web |
| pulseaudio | A featureful, general-purpose sound server |
| kmix | 修复 Firefox 没有声音 |
| profile-cleaner | Simple script to vacuum and reindex sqlite databases used by browsers 用于对浏览器使用的 sqlite 数据库进行清理和重新索引的简单脚本 |
| visual-studio-code-bin | Visual Studio Code |
| netease-cloud-music | 网易云音乐 |
| flameshot  | 现代、快捷、轻便的截图工具 |
| proxychains-ng | 终端内科学上网代理工具 |
| redshift | 显示屏色温调节工具 |
| vlc | 强大的多媒体播放工具 |
| telegram-desktop | 客户端开源的加密聊天工具 |
| gthumb | 图片浏览工具，可简单编辑图片，可清除照片元数据 |
| libreoffice-fresh | 必备的办公软件 |
| inkscape | 强大的矢量图形编辑软件 |
| youtube-dl | YouTube 视频下载工具 |
| glances | terminal monitoring tool |
| keepass | password manager |
| hugo | static site generator |
| python-sphinx | a documentation generator |
| anki | a spaced repetition system |
| informant | arch news reader and pacman hook |
| dnsutils | `dig` |
| dnsmasq | 使用国外 DNS 造成国内网站访问慢的解决方法 |
| tldr | [tldr-pages/tldr](https://github.com/tldr-pages/tldr) |
| virtualbox | Virtual Machine |
| qemu | A generic and open source machine emulator and virtualizer |
| earlyoom | Early OOM Daemon for Linux |
| gtk2/3/4 | GObject-based multi-platform GUI toolkit |
| lsb-release | LSB version query program |
| exa | A modern replacement for ls (List directory contents) |
| filezilla | Fast and reliable FTP FTPS and SFTP client |
| intellij-idea-community-edition | IDE |
| mysql | Database |
| sagemath | Open Source Mathematics Software free alternative to Magma Maple Mathematica and Matlab Matlab dkms Dynamic Kernel Modules System |
| maven | Java project management and project comprehension tool |
| graphviz | Graph visualization software |
| cmdpxl | a totally practical command-line image editor 一个在命令行里画画的程序 |
| octave(GUI) | A high-level language, primarily intended for numerical computations. |
| asciiquarium | An aquarium/sea animation in ASCII art |
| lx-music-desktop-bin | A music software based on Electron + Vue. 一个基于 Electron + Vue 开发的音乐软件 |
| feeluown | FeelUOwn Music Player(feeluown-netease feeluown-qqmusic feeluown-local) |
| nuclear-player-bin | A free, multiplatform music player app that streams from multiple sources. |
| beets | Flexible music library manager and tagger |
| mps-youtube | Terminal based YouTube jukebox with playlist management |
| mopidy | An extensible music server written in Python |
| postman-bin | Build, test, and document your APIs faster |
| mongodb-bin(already have mongosh) | A high-performance, open source, schema-free document-oriented database |
| nginx | Lightweight HTTP server and IMAP/POP3 proxy server |
| zellij(aur) | A terminal multiplexer. |
| liferea | A desktop news aggregator for online news feeds and weblogs |
| arch-wiki-man(aur) | The Arch Wiki as linux man pages |
| xterm | X Terminal Emulator |
| konsole | KDE terminal emulator |
| foliate | ebook reader(EPUB, Mobipocket, Kindle, FictionBook, and Comicbook formats.) |
| mupdf | Lightweight PDF and XPS viewer |
| okular | Document Viewer(pdf, mobi, equb) |
| freemind | A Java mindmapping tool |
| wireshark-qt | Network traffic and protocol analyzer/sniffer - Qt GUI |
| newsboat | An RSS/Atom feed reader for text terminals |
| [treesheets-bin](http://strlen.com/treesheets/) | TreeSheets free form data organizer [给你一张无限大可缩放的白纸, 你会在上面写什么?](https://hintsnet.com/pimgeek/2019/07/10/if-given-an-infinite-zoomable-paper-what-would-you-write/)|
| python-pipenv | Sacred Marriage of Pipfile, Pip, & Virtualenv. |

### Fly.io

```sh
curl -L https://fly.io/install.sh | sh
flyctl auth login
flyctl info
flyctl open
```

### ventoy

Output:

```sh
NOTE: You can create persistence images for ventoy with the "ventoy-persistent" command,
      and losslessly expand persistence ".dat" files using "ventoy-extend-persistent",
      which are shortcuts to "/opt/ventoy/CreatePersistentImg.sh" and
      "/opt/ventoy/ExtendPersistentImg.sh", respectively.
      (See https://www.ventoy.net/en/plugin_persistence.html for documentation.)
```

### cmdpxl

```sh
pip install cmdpxl
```

### maven

Apache Maven. Tool for building and managing Java-based projects. More
information: <https://maven.apache.org>.

```sh
-   Compile a project:
    :   mvn compile

-   Compile and package the compiled code in its distributable format, such as a `jar`:
    :   mvn package

-   Compile and package, skipping unit tests:
    :   mvn package -Dmaven.test.skip=true

-   Install the built package in local maven repository. (This will invoke the compile and package commands too):
    :   mvn install

-   Delete build artifacts from the target directory:
    :   mvn clean

-   Do a clean and then invoke the package phase:
    :   mvn clean package

-   Clean and then package the code with a given build profile:
    :   mvn clean -Pprofile package

-   Run a class with a main method:
    :   mvn exec:java -Dexec.mainClass="com.example.Main"
        -Dexec.args="arg1 arg2"
```

### Sagemath

```sh
sudo pacman -S sagemath
```

Output:

```sh
resolving dependencies...
looking for conflicting packages...
warning: dependency cycle detected:
warning: python-ipykernel will be installed before its python-jupyter_client dependency
warning: dependency cycle detected:
warning: jupyter will be installed before its python-ipywidgets dependency
```

### Tomcat8

```sh
sudo pacman -S tomcat8
```

Output:

```sh
extra/eclipse-ecj          4.6.3-2        1.65 MiB       1.53 MiB
extra/java-commons-daemon  1.2.4-1        0.02 MiB       0.02 MiB
extra/java-jsvc            1.2.4-1        0.06 MiB       0.02 MiB
extra/tomcat8              8.5.70-1       9.83 MiB       5.54 MiB

Optional dependencies for tomcat8
tomcat-native: to allow optimal performance in production environments
\:\: Running post-transaction hooks...
(1/4) Creating system user accounts...
Creating group tomcat8 with gid 57.
Creating user tomcat8 (Tomcat 8 user) with uid 57 and gid 57.
```

### MySQL

```sh
sudo pacman -S mysql
```

Output:

```sh
archlinuxcn/libmysqlclient  8.0.24-1       6.89 MiB       1.31 MiB
archlinuxcn/mysql-clients   8.0.24-1      52.30 MiB       2.12 MiB
archlinuxcn/mysql           8.0.24-1     172.41 MiB      19.10 MiB

:: You need to initialize the MySQL data directory prior to starting
the service. This can be done with mysqld --initialize command, e.g.:
mysqld --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql
:: Additionally you should secure your MySQL installation using
mysql_secure_installation command after starting the mysqld service
Optional dependencies for mysql
perl-dbd-mysql: for mysqlhotcopy, mysql_convert_table_format, mysql_setpermission, mysqldumpslow
:: Running post-transaction hooks...
(1/4) Creating system user accounts...
Creating group mysqlrouter with gid 88.
Creating user mysqlrouter (MySQL) with uid 88 and gid 88.
Creating group mysql with gid 89.
Creating user mysql (MySQL) with uid 89 and gid 89.
(2/4) Reloading system manager configuration...
(3/4) Creating temporary files...
(4/4) Arming ConditionNeedsUpdate...
```

删除 mysql，使用 percona-server 管理。

```sh
sudo pacman -S percona-server
```

Output:

```sh
extra/numactl             2.0.14-1       0.22 MiB       0.08 MiB
community/percona-server  8.0.25_15-2  167.91 MiB      25.30 MiB
```

### IDEA

```sh
sudo pacman -S intellij-idea-community-edition/intellij-idea-ultimate-edition
```

Output:

```sh
# select jdk11-openjdk
extra/java-environment-common              3-3              0.00 MiB       0.00 MiB
extra/java-runtime-common                  3-3              0.01 MiB       0.00 MiB
extra/jdk11-openjdk                        11.0.12.u7-1    87.48 MiB      76.32 MiB
extra/jre11-openjdk                        11.0.12.u7-1     0.52 MiB       0.19 MiB
extra/jre11-openjdk-headless               11.0.12.u7-1   157.54 MiB      35.20 MiB
extra/libnet                               1:1.1.6-1        0.30 MiB       0.09 MiB
community/intellij-idea-community-edition  4:2021.1.3-1  1245.40 MiB     436.08 MiB
For the complete set of Java binaries to be available in your PATH,
you need to re-login or source /etc/profile.d/jre.sh
Please note that this package does not support forcing JAVA_HOME as former package java-common did

when you use a non-reparenting window manager,
set _JAVA_AWT_WM_NONREPARENTING=1 in /etc/profile.d/jre.sh
```

### Sphinx

Sphinx is a documentation generator or a tool that translates a set of plain text source files into various output formats, automatically producing cross-references, indices, etc.

```sh
pip install sphinx-autobuild rstcheck # for VS Code extension: reStructuredText
pip install sphinx-rtd-theme # sphinx-rtd-theme theme
pip install sphinx-copybutton
pip install m2r2 # converts a markdown file including reStructuredText (rst) markups to a valid rst format
sudo pacman -S python-sphinx-issues python-sphinx-furo
```

### exa

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

### informant[^10]

一个 Arch Linux 新闻阅读器和 pacman hook。可以帮你在更新包时检查是否还有没有阅读的 Arch Linux 新闻。

### Virtualbox[^11]

Error message:

```sh
WARNING: The vboxdrv kernel module is not loaded. Either there is no module available for the current kernel (5.13.8-arch1-1) or it failed to load. Please recompile the kernel module and install it by

sudo /sbin/vboxconfig

You will not be able to start VMs until this problem is fixed.
```

exec:

```sh
sudo modprobe vboxdrv
```

No message now.

### earlyoom

如果是为了避免系统卡死，可以安装并使用 earlyoom[^12]。

该软件默认将在空余内存、空余 swap 两者均低于 10%时，结束 oom_score 值最高的进程，避免系统内存耗尽卡死。

```sh
# after install
sudo systemctl enable --now earlyoom
```

### Vagrant[^13]

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

After exec `sudo modprobe vboxdrv`, no message now.

```sh
vagrant up
```

Output:

```sh
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

### QEMU

```sh
sudo pacman -S qemu
```

Output:

```sh
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

### Mutt[^14]

终端邮件

### Flameshot

可以配置下快捷键，使用起来更加快捷。去 Settings > Keyboard，然后下拉页面到底部，点击 `+` 号，Name 填 `Flameshot`，Command 填 `flameshot gui`，然后点击下 Shortcut 的右方方块，按下 `Alt` + `Super/Win` + `P` 键

### Anki[^15]

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

`.zshrc`:

```sh
alias guile="guile --no-auto-compile"
```

[Install guile](https://www.linuxfromscratch.org/blfs/view/svn/general/guile.html)

### `nscd` 自启动

```sh
systemctl enable nscd
```

nscd is a daemon that provides a cache for the most common name service requests. The default configuration file, /etc/nscd.conf, determines the behavior of the cache daemon.

### redshift

纬度，经度 115.622324,33.165395

```sh
mkdir ~/.config/redshift
vim ~/.config/redshift/redshift.conf
```

`~/.config/redshift/redshift.conf`:

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

1. <https://wiki.archlinux.org/title/redshift>
2. <https://io-oi.me/tech/hello-arch-linux/#redshift>

### tldr

1. tldr-node-client

```sh
npm install -g tldr
cd ~/.nvm/versions/node/v14.18.1/lib/node_modules/tldr
mkdir -p $ZSH_CUSTOM/plugins/tldr
cp bin/completion/zsh/_tldr $ZSH_CUSTOM/plugins/tldr/_tldr
```

在 `~/.zshrc` 的 plugins 中加入 tldr。

2. tldr-python-client

```sh
sudo pacman -S tldr
tldr --print-completion zsh | sudo tee /usr/local/share/zsh/site-functions/_tldr
```

在 `~/.zshrc` 中加入以下内容：

```sh
export TLDR_CACHE_ENABLED=1
export TLDR_CACHE_MAX_AGE=720
export TLDR_PAGES_SOURCE_LOCATION="https://raw.githubusercontent.com/tldr-pages/tldr/master/pages"
export TLDR_DOWNLOAD_CACHE_LOCATION="https://tldr-pages.github.io/assets/tldr.zip"
```

## 让 Arch Linux 系统和最新的镜像同步，从最快的镜像下载[^16]

```sh
#!/bin/bash -e

unshare -m bash <<'EOF'
mount --make-rprivate /
for f in /etc/pacman.d/\*.sync; do

  filename="${f%.\*}"
  mount --bind "$f" "$filename"

done
pacman -Sy
EOF
```

## 使用国外 DNS 造成国内网站访问慢的解决方法

<https://wzyboy.im/post/874.html>

```sh
systemctl status dnsmasq
```

Output:

```sh
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

1. Snapshot type: rsync (btrfs cannot use because of BTRFS snapts are saved on system partition)
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

## Gitlab

<https://gitlab.com/gitlab-org/gitlab-foss>

输出：

```sh
Configure gitlab-shell in /etc/webapps/gitlab-shell/config.yml
Put a secret bytestring to /etc/webapps/gitlab-shell/secret
warning: directory permissions differ on /var/log/gitlab/
filesystem: 770  package: 755
Configure your /etc/webapps/gitlab/gitlab.yml
Set up your redis to run on /run/redis/redis.sock or configure gitlab to use redis TCP
Put a secret bytestring to /etc/webapps/gitlab/secret
Copy /usr/share/webapps/gitlab/config/secrets.yml.example to /etc/webapps/gitlab/secrets.yml and configure it
Setup the database:
$ (cd /usr/share/webapps/gitlab && sudo -u gitlab $(cat environment | xargs) bundle-2.7 exec rake gitlab:setup)
Finally run the following commands to check your installation:
$ (cd /usr/share/webapps/gitlab && sudo -u gitlab $(cat environment | xargs) bundle-2.7 exec rake gitlab:env:info)
$ (cd /usr/share/webapps/gitlab && sudo -u gitlab $(cat environment | xargs) bundle-2.7 exec rake gitlab:check)
(1/5) Creating system user accounts...
Creating group git with gid 974.
Creating user git (git daemon user) with uid 974 and gid 974.
Creating group gitlab with gid 105.
Creating user gitlab (n/a) with uid 105 and gid 105.
Creating group redis with gid 973.
Creating user redis (Redis in-memory data structure store) with uid 973 and gid 973.
```

使用 Gitlab 需要高配的服务器。

[^1]: https://io-oi.me/tech/hello-arch-linux/#隐藏-grub-除非按下-shift-键
[^2]: https://www.reddit.com/r/linux4noobs/comments/5372gj/disable_arch_linux_grub_boot_menu/d7qjh6s
[^3]: https://bbs.archlinuxcn.org/viewtopic.php?pid=44067#p44067
[^4]: https://wiki.archlinux.org/title/reflector
[^5]: https://cfp.vim-cn.com/cb3wN/python
[^6]: https://zhuanlan.zhihu.com/p/341637818
[^7]: https://realdougwilson.com/writing/coding-with-character
[^8]: https://github.com/archlinuxcn/mirrorlist-repo
[^9]: https://github.com/yuk7/ArchWSL/issues/91#issuecomment-506806989
[^10]: https://wiki.archlinux.org/title/System_maintenance#Read_before_upgrading_the_system
[^11]: https://wiki.archlinux.org/title/VirtualBox
[^12]: https://bbs.archlinuxcn.org/viewtopic.php?pid=45774#p45774
[^13]: https://wiki.archlinux.org/title/Vagrant
[^14]: http://www.mutt.org/
[^15]: https://apps.ankiweb.net/#download
[^16]: https://blog.lilydjwg.me/2020/10/29/pacsync.215578.html
[^17]: https://tonsky.me/blog/cursor-keys/
