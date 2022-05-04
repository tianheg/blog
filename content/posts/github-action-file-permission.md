+++
title = "GitHub Action 文件权限问题"
date = 2022-05-01T10:08:00+08:00
lastmod = 2022-05-04T08:21:27+08:00
tags = ["技术", "GitHub"]
draft = false
+++

今天在修补 [tianheg/coding-interview-university](https://github.com/tianheg/coding-interview-university) 仓库的 Action 时，遇到一个问题：想把一个文件的内容输出到 issue 中，但是因为文件字符长度超过 65536 而报错。

```sh
{"resource":"Issue","code":"custom","field":"body","message":"body is too long (maximum is 65536 characters)"}
```

所以通过以下命令，把文件中超出 60000 的部分移除。

```sh
cat ./lychee/out.md | cut -c 1-60000 >> ./lychee/out.md
```

但是却不停地报错。

```sh
/home/runner/work/_temp/3f19c8f9-894d-4ef8-aef0-f78d9fe01db7.sh: line 1: ./lychee/out.md: Permission denied
```

一开始，我改了很多次那个移除命令，比如加个 `sudo` ， `permissions: write-all` 。

后来，我想到可以加个 `ls -al` 试试看，结果听令我意外且惊喜。

```sh
> ls -al
total 188
drwxr-xr-x 6 runner docker   4096 May  1 03:30 .
drwxr-xr-x 3 runner docker   4096 May  1 03:29 ..
drwxr-xr-x 8 runner docker   4096 May  1 03:29 .git
drwxr-xr-x 3 runner docker   4096 May  1 03:29 .github
-rw-r--r-- 1 runner docker    222 May  1 03:29 .gitignore
-rw-r--r-- 1 runner docker  20130 May  1 03:29 LICENSE.txt
-rw-r--r-- 1 runner docker 132734 May  1 03:29 README.md
drwxr-xr-x 3 runner docker   4096 May  1 03:29 extras
drwxr-xr-x 2 root   root     4096 May  1 03:30 lychee
-rw-r--r-- 1 runner docker   6951 May  1 03:29 programming-language-resources.md
```

不错，权限为 root，所以需要添加命令。

```sh
pwd
ls -al
sudo chown runner:docker -R ./lychee
ls -al
cat ./lychee/out.md | cut -c 1-60000 >> ./lychee/out.md
```

这样，这个问题就算解决了。

## 后记 {#后记}

`cat ./lychee/out.md | cut -c 1-60000 >> ./lychee/out.md` 似乎还保留了文件的原内容，如果想要覆盖源文件的内容需要把 `>>` 改为 `>` 。
