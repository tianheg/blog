---
title: 'Linux 下的 Shell'
date: 2022-11-13T15:31:00+08:00
tags: ['技术']
---

Refers:

- https://www.cyberciti.biz/faq/how-to-change-shell-to-bash/

```bash
    sudo chsh -s /bin/bash $USERNAME
    sudo chsh -s /bin/bash user
```

查看用户的默认 Shell：

```bash
    $ grep user /etc/passwd
    user:x:1000:1000::/home/user:/bin/bash
    # 或者
    $ ps -p $$
    PID TTY          TIME CMD
    22572 pts/1    00:00:00 bash
    # 或者
    $ echo "$0"
    bash
```

查看系统可用 Shell：

```bash
    $ cat /etc/shells
    # /etc/shells: valid login shells
    /bin/sh
    /bin/bash
    /usr/bin/bash
    /bin/rbash
    /usr/bin/rbash
    /usr/bin/sh
    /bin/dash
    /usr/bin/dash
    /usr/bin/tmux
    /usr/bin/screen
```

通过 `type -a bash` 找到 bash 的所有位置。

### `chsh`

更改当前用户 Shell

```
    chsh -s /bin/zsh
    echo $SHELL
```

列出所有 Shell

```
    chsh -l
```

### `useradd`

新建用户（有家目录）

refer <https://wiki.archlinux.org/title/Users_and_groups>

```
    useradd -m example
    passwd example
```

### `adduser`

`adduser` provides a high level interface for adding new users, and
`useradd` provides a low level interface.

## sed
https://www.gnu.org/software/sed/manual/sed.html
## Quickly set up an SSH agent:

eval `ssh-agent` && ssh-add

from https://twitter.com/slicknet/status/1555246335883767808
## awk
https://www.gnu.org/software/gawk/
## 使用 shellcheck 进行语法检查
## 检查文件权限数字
```bash
stat -c '%a' /file/path/
# 也可以是目录
```
