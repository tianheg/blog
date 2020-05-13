---
title: MXLinux 安装 Node.js 和 npm
date: 2020-05-12T15:59:49+08:00
categories: ["技术"]
series: ["Nodejs","MXLinux"]
slug: install nodejs and npm on MXLinux
keywords: ["MXLinux","Nodejs","npm"]
description: "记录在 MXLinux 上安装 Nodejs 和 npm 的过程"
---

以下方式能够下载 Nodejs 和 npm ：

```
sudo apt-get install nodejs
sudo apt-get install npm
```

但是，不能下载最新的长期支持版本，因为使用上述命令是从 apt 包里寻找 nodejs 和 npm，如果 apt 中的 Nodejs 没有跟着官网同步更新，那么就下载不到最新的长期支持版。

所以，就要采用其他办法安装。

## 办法一（该办法来源于网络[^1]）：

安装系统：CentOS

从 [Node.js 官网下载页面](https://nodejs.org/en/download/) 下载源码，然后编译安装。

### 登录 Linux 终端

进入 `/usr/local/src` 目录：

```
cd /usr/local/src 
```

### 下载 Nodejs 安装包

```
wget https://nodejs.org/dist/v12.16.1/node-v12.16.1-linux-x64.tar.gz
```

### 解压并安装

```
tar -zxvf node-v12.16.1-linux-x64.tar.gz
cd node-v12.16.1-linux-x64.tar.gz
sudo ./configure
sudo make
sudo make install
sudo cp /usr/local/bin/node /usr/local/node
# 查看当前安装版本
node -v
v12.16.1
```

### 下载 npm

这里要注意 npm 和 Node.js 的版本的关系。如果 Node 版本是 12.x.x 的话，那么对应的 npm 版本应该是 6.x.x。具体内容可自行搜索资料。

### 更换 npm 源

npm 是外国网站，因为某些原因，直接通过 npm 命令安装包会很慢。可以切换成国内的淘宝源：

```
npm install -g cnpm
```

## 办法二：

安装系统：MXLinux

可以使用 [nvm](https://github.com/nvm-sh/nvm) 管理多版本 Nodejs，进行下载 Nodejs 和 npm。

### 安装  nvm

```
cd ~/
git clone https://github.com/nvm-sh/nvm.git .nvm
cd ~/.nvm
# 查看 nvm 最新版本
git checkout v0.35.3
# 激活 nvm
. nvm.sh
```

然后将下列数行内容，放到你的 `~/.bashrc`，`~/.profile` 或者 `~/.zshrc` 文件中，这样做是为了在登录时自动获取资源：

```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

你可能拥有上述 3 个中的 2 个，那么这两个文件都要添加。

### 使用 nvm

```
$ nvm

Node Version Manager (v0.35.3)

Note: <version> refers to any version-like string nvm understands. This includes:
  - full or partial version numbers, starting with an optional "v" (0.10, v0.1.2, v1)
  - default (built-in) aliases: node, stable, unstable, iojs, system
  - custom aliases you define with `nvm alias foo`

 Any options that produce colorized output should respect the `--no-colors` option.

Usage:
  nvm --help                                Show this message
  nvm --version                             Print out the installed version of nvm
  nvm install [-s] <version>                Download and install a <version>, [-s] from source. Uses .nvmrc if available
    --reinstall-packages-from=<version>     When installing, reinstall packages installed in <node|iojs|node version number>
    --lts                                   When installing, only select from LTS (long-term support) versions
    --lts=<LTS name>                        When installing, only select from versions for a specific LTS line
    --skip-default-packages                 When installing, skip the default-packages file if it exists
    --latest-npm                            After installing, attempt to upgrade to the latest working npm on the given node version
    --no-progress                           Disable the progress bar on any downloads
  nvm uninstall <version>                   Uninstall a version
  nvm uninstall --lts                       Uninstall using automatic LTS (long-term support) alias `lts/*`, if available.
  nvm uninstall --lts=<LTS name>            Uninstall using automatic alias for provided LTS line, if available.
  nvm use [--silent] <version>              Modify PATH to use <version>. Uses .nvmrc if available
    --lts                                   Uses automatic LTS (long-term support) alias `lts/*`, if available.
    --lts=<LTS name>                        Uses automatic alias for provided LTS line, if available.
  nvm exec [--silent] <version> [<command>] Run <command> on <version>. Uses .nvmrc if available
    --lts                                   Uses automatic LTS (long-term support) alias `lts/*`, if available.
    --lts=<LTS name>                        Uses automatic alias for provided LTS line, if available.
  nvm run [--silent] <version> [<args>]     Run `node` on <version> with <args> as arguments. Uses .nvmrc if available
    --lts                                   Uses automatic LTS (long-term support) alias `lts/*`, if available.
    --lts=<LTS name>                        Uses automatic alias for provided LTS line, if available.
  nvm current                               Display currently activated version of Node
  nvm ls [<version>]                        List installed versions, matching a given <version> if provided
    --no-colors                             Suppress colored output
    --no-alias                              Suppress `nvm alias` output
  nvm ls-remote [<version>]                 List remote versions available for install, matching a given <version> if provided
    --lts                                   When listing, only show LTS (long-term support) versions
    --lts=<LTS name>                        When listing, only show versions for a specific LTS line
    --no-colors                             Suppress colored output
  nvm version <version>                     Resolve the given description to a single local version
  nvm version-remote <version>              Resolve the given description to a single remote version
    --lts                                   When listing, only select from LTS (long-term support) versions
    --lts=<LTS name>                        When listing, only select from versions for a specific LTS line
  nvm deactivate                            Undo effects of `nvm` on current shell
  nvm alias [<pattern>]                     Show all aliases beginning with <pattern>
    --no-colors                             Suppress colored output
  nvm alias <name> <version>                Set an alias named <name> pointing to <version>
  nvm unalias <name>                        Deletes the alias named <name>
  nvm install-latest-npm                    Attempt to upgrade to the latest working `npm` on the current node version
  nvm reinstall-packages <version>          Reinstall global `npm` packages contained in <version> to current version
  nvm unload                                Unload `nvm` from shell
  nvm which [current | <version>]           Display path to installed node version. Uses .nvmrc if available
  nvm cache dir                             Display path to the cache directory for nvm
  nvm cache clear                           Empty cache directory for nvm

Example:
  nvm install 8.0.0                     Install a specific version number
  nvm use 8.0                           Use the latest available 8.0.x release
  nvm run 6.10.3 app.js                 Run app.js using node 6.10.3
  nvm exec 4.8.3 node app.js            Run `node app.js` with the PATH pointing to node 4.8.3
  nvm alias default 8.1.0               Set default node version on a shell
  nvm alias default node                Always default to the latest available node version on a shell

Note:
  to remove, delete, or uninstall nvm - just remove the `$NVM_DIR` folder (usually `~/.nvm`)

```

这是 nvm 的命令，熟练使用即可。

### 常用命令

1.列出可安装的 Node.js 版本：

```
nvm ls-remote
```

2.安装指定 Node.js 版本：

```
nvm install 12.16.3
```

它会自动下载指定版本的Node.js二进制包（不需要编译源码），安装在~/.nvm/versions/node

3.卸载指定版本 Node.js：

```
nvm uninstall 12.16.3
```

4.通常最好安装最近的长周期版本：

```
nvm install --lts
```

5.设置 shell 的 Node.js 版本

```
nvm use 12.16.3
```

它将 Node.js 指定版本的 bin 路径加入 Path。

6.还原环境变量 Path：

```
nvm deactivate
```

7.迁移 npm 至新版本的 Node.js：

```
nvm install node --reinstall-packages-from=node
或
nvm install v12.16.3 --reinstall-packages-from=12.16.3
```

### .nvmrc

它存储在工程根目录中，用于记录该工程依赖的 Node.js 版本。

```
echo 12.16.3 > .nvmrc
```

进入工程目录（当前目录），运行：

```
nvm use
```

将根据 .nvmrc 指定 shell 的 Node.js 版本

### 升级 nvm

```
cd $NVM_DIR
git fetch origin
git checkout `git describe --abbrev=0 --tags`
```

升级完成后，需要重新激活 nvm：

```
. $NVM_DIR/nvm.sh
```

### 制作 Docker 镜像

若不希望使用 Node.js 的官方 Docker 镜像，可利用 nvm 创建镜像：

```
FROM ubuntu:bionic
MAINTAINER ...

ENV DEBIAN_FRONTEND noninteractive
ENV NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node
ENV NODE_VERSION 10.16.2
ENV PATH /root/.nvm/versions/node/v$NODE_VERSION/bin:$PATH

RUN set -eux; \
    apt-get update; \
    apt-get install --no-install-recommends -y wget ca-certificates; \
    wget -O- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash; \
    apt-get remove --purge -y wget ca-certificates; \
    apt-get autoremove --purge -y; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /root/.nvm/.cache
```



[^1]: [Linux 环境下源码编译安装 NodeJS及npm](https://www.jianshu.com/p/54e336acbae3)