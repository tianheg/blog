---
title: '使用 JSMin 压缩 JavaScript'
date: 2021-12-15
tags: ['技术', JavaScript]
---

从 GitHub 仓库：[douglascrockford/JSMin](https://github.com/douglascrockford/JSMin) 得到源代码 `jsmin.c` ，然后执行以下命令：

```bash
gcc -Wall jsmin.c -o jsmin # 编译源文件，生成可执行文件，附带警告
./jsmin <source.js >source.min.js # > 左侧的空格，如果省去，则无法将所有代码压缩成一行
```
