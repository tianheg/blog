+++
title = "常用脚本"
date = 2022-01-14T00:00:00+08:00
lastmod = 2022-03-04T15:02:03+08:00
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


## 找到字符串中的汉字 {#找到字符串中的汉字}

<https://stackoverflow.com/a/2718203>

```py
#!/usr/bin/env python
import rs
sample = "I am from 美国。We should be friends. 朋友。"
for n in re.findall(r'[\u4e00-\u9fff]+', sample):
  print(n)
```


## 新建文章 {#新建文章}

```sh
#!/bin/bash

CURRENTDATE=`date +"%Y-%m-%d"`
echo -n "Enter the Article Name: "
read -r a
echo "---
layout: post
title:
tags:
  -
description:
---" >> content/posts/"${CURRENTDATE}-$a.md"
# 问题：
# 如果文章名字含有空格，能够新建文章，但同时会新建其他文档
# 如果 文件名字有 /，无法创建
```


## pandoc Org to Md {#pandoc-org-to-md}

```sh
pandoc -f org -t markdown original_org_file -s -o converted_md_file
```