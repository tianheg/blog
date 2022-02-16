+++
title = "使用 xwmx/nb"
date = 2021-07-31T00:00:00+08:00
lastmod = 2022-02-16T09:47:10+08:00
tags = ["技术"]
draft = false
+++

## 安装 {#安装}

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install --lts
npm install -g nb.sh
sudo "$(which nb)" completions install # install Bash and Zsh completion scripts (recommended)
```


## 用法 {#用法}

```sh
nb add
nb <url>
nb edit <id>
nb show <id>
nb open <id>
nb list
nb search <query>
nb browse
nb notebooks add <name>
nb settings
nb help
```


## 用途 {#用途}

-   命令行记笔记、为链接加书签、支持 Backlink
-   可同步至 GitHub，备份方便

ref:

1.  <https://github.com/xwmx/nb>
2.  <https://xwmx.github.io/nb/>
3.  <https://github.com/nvm-sh/nvm#installing-and-updating>