+++
title = "Git Add Files to A Commit Except A Single File"
date = 2021-12-11T00:00:00+08:00
lastmod = 2022-04-27T16:05:35+08:00
tags = ["技术", "Git"]
draft = false
+++

<https://stackoverflow.com/a/4475506/12539782>

```sh
git add -u
git reset -- file_excepted
```
