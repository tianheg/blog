+++
title = "常用脚本"
date = 2022-01-14T00:00:00+08:00
lastmod = 2022-02-18T18:57:53+08:00
tags = ["技术"]
draft = false
+++

## 批量删除 Pypi 包 {#批量删除-pypi-包}

```sh
pip freeze | grep SOMETHING | xargs pip uninstall -y
# https://stackoverflow.com/a/9406259
```


## 批量删除 Pacman 包 {#批量删除-pacman-包}

```sh
sudo pacman -Rs $(pacman -Qq | grep some_words)
# https://bbs.archlinux.org/viewtopic.php?pid=1533162#p1533162
```


## X.org 下读取文本到剪切板 {#x-dot-org-下读取文本到剪切板}

```sh
xclip -sel c < text.txt
```