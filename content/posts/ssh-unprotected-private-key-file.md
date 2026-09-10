---
title: 'WARNING: UNPROTECTED PRIVATE KEY FILE! 警告怎样解释'
date: 2021-12-26
tags: ['技术', SSH]
---

- <https://chmodcommand.com/>
- [Fixing "WARNING: UNPROTECTED PRIVATE KEY FILE!" on Linux](https://www.howtogeek.com/168119/fixing-warning-unprotected-private-key-file-on-linux/)

这说明公钥和私钥的权限不对。

要对公钥和私钥设置 600 权限：

```bash
    sudo chmod 600 ~/.ssh/yourkey
    sudo chmod 600 ~/.ssh/yourkey.pub
```

如果遇到：

```bash
    Are you sure you want to continue connecting (yes/no)? yes
    Failed to add the host to the list of known hosts (/home/user/.ssh/known_hosts).
```

说明 `/home/user/.ssh/known_hosts` 的权限不正确，需要修改为 644：

```bash
    sudo chmod 644 ~/.ssh/known_hosts
```

最后，可能还需要调整目录的权限为 755：

```bash
    sudo chmod 755 ~/.ssh
```

- 600：表示 Ower 可读可写不可执行，Group 和 Others
  都不可读不可写不可执行。
- 644：表示 Ower 可读可写不可执行，Group 和 Others
  都可读不可写不可执行。
- 755：表示 Ower 可读可写可执行，Group 和 Others 都可读不可写可执行。
