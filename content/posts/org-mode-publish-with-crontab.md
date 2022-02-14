+++
title = "自动发布 Org Mode"
date = 2022-01-08T00:00:00+08:00
lastmod = 2022-02-12T21:46:18+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

使用了 crontab。

```sh
crontab -e
```

通过默认编辑器打开一个空白文件，输入：

```text
@hourly ~/org/publish.sh >> /home/$USER/cron.log 2>&1
```

这行文本的作用：

1.  每个小时（整点，如 1 点，2 点……）会执行后面紧跟着的 shell 脚本，要确保脚本可执行（ `chmod +x ~/org/publish.sh` ）
2.  日志输出到 `/home/$USER/cron.log`

`~/org/publish.sh` 内容：

```sh
#!/bin/bash

# 如果没有下面这一行，就不能通过 publickey push 到远程仓库
export GIT_SSH_COMMAND="ssh -i /home/$USER/.ssh/private_key"
cd ~/repo/blog/
make publish
```

如上述代码中注释所说，通过 cronie 自动化程序，似乎没办法读取到当前用户的私匙，这可能是为了安全。

我直接添加环境变量的解决办法会不会导致安全问题呢？

致谢：

1.  [How to automate Github using Cron?](https://chai-bapat.medium.com/how-to-automate-github-using-cron-16effc825bcf)
2.  [GIT\_SSH\_COMMAND - git Documentation](https://git-scm.com/docs/git#Documentation/git.txt-codeGITSSHCOMMANDcode)