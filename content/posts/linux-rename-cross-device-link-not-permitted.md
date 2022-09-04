+++
title = """
  "EXDEV: cross-device link not permitted"
  """
author = ["Tianhe Gao"]
date = 2022-09-04T18:25:00+08:00
lastmod = 2022-09-04T18:41:06+08:00
tags = ["技术", "Linux"]
draft = false
+++

```sh
#  WARN  EXDEV: cross-device link not permitted, link '/mnt/disk/.pnpm-store/v3/files/files/d5/c4e349548735fdbeea027ca73e7da1788ad6465afd8945bc14827e623ad86c77261b7749e0f63a26888b2eb1bc28ae4e9f83072b57db8bc5b97ef8bcf348bb-exec' -> '/home/archie/.local/share/pnpm/nodejs/_tmp_72305_1d7acc647b9cdc07eaa2ebcbcd970ab7/bin/node'
```

当我尝试通过 [pnpm](https://pnpm.io/) 包管理器命令 `pnpm env use --global lts` 时，出现了上述警告，原因是：当我执行命令时，所在位置是 `/mnt/disk` ，在另一个磁盘。

通过搜索 `EXDEV: cross-device link not permitted` 找到 [rename 的 man page](https://man7.org/linux/man-pages/man2/rename.2.html)。

其中有对 EXDEV 的解释。

```txt
oldpath and newpath are not on the same mounted filesystem. (Linux permits a filesystem to be mounted at multiple points, but rename() does not work across different mount points, even if the same filesystem is mounted on both.)
```

也就是说，无法跨磁盘建立软链接。