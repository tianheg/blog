+++
title = "解决 Windows 下中文文件在 Linux 中读取乱码的问题"
date = 2021-12-20T00:00:00+08:00
lastmod = 2022-02-16T15:02:10+08:00
tags = ["技术", "Unicode"]
draft = false
+++

[Garbled problem - Localization/Simplified Chinese - ArchWiki](https://wiki.archlinux.org/title/Localization/Simplified_Chinese#Garbled_problem)

Windows 系统下创建的文件采用的编码标准可能是 gbk/gb2312。所以避免乱码的基本原则就是使用包含字符更多的 utf-8，避免使用其他编码格式。


## 文件名乱码 {#文件名乱码}

安装 [convmv](https://linux.die.net/man/1/convmv)，使用 `convmv` 命令转换编码格式。举例：

```sh
$ convmv -f GBK -t UTF-8 --notest --nosmart file
```


## 文件内容乱码 {#文件内容乱码}

使用 `iconv` 命令转换格式：

```sh
$ iconv -f GBK -t UTF-8 -o new-file origin-file
```


## zip 压缩包乱码 {#zip-压缩包乱码}

在非 utf8 编码环境(通常是 Windows 下的中文环境)下，不要使用 zip 进行压缩(建议使用 7z)。需要一个特殊的参数：

```sh
$ unzip -O gbk file.zip
```