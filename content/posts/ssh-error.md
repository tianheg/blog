+++
title = "SSH 相关问题"
date = 2022-02-08T00:00:00+08:00
lastmod = 2022-02-16T14:58:52+08:00
tags = ["技术", "SSH"]
draft = false
+++

1.  ssh: Could not resolve hostname + cron job

需要自动化执行 cron job，脚本主要功能就是 git push 到远程仓库。

解决方法：

在脚本中添加：

```sh
#!/bin/bash

## Git
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ssh_key1
ssh-add ~/.ssh/ssh_key2
ssh-add -l

## Job
cd ~/repo/blog/
make publish
cd ~/repo/gtd/
make publish
```