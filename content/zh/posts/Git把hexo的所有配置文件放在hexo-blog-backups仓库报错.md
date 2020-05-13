---
title: Git - 把hexo的所有配置文件放在hexo-blog-backups仓库报错
date: 2020-05-10T19:03:30+08:00
tags: []
categories: ["技术"]
series: ["Git"]
slug: Git error place docs to repo
keywords: []
description: ""
---

错误信息：
```bash
E:\Github\hexo-blog-backups (master -> origin)
λ git add *
warning: adding embedded git repository: hexoblog
hint: You've added another git repository inside your current repository.
hint: Clones of the outer repository will not contain the contents of
hint: the embedded repository and will not know how to obtain it.
hint: If you meant to add a submodule, use:
hint:
hint:   git submodule add <url> hexoblog
hint:
hint: If you added this path by mistake, you can remove it from the
hint: index with:
hint:
hint:   git rm --cached hexoblog
hint:
hint: See "git help submodule" for more information.
```

问题描述：
把hexo的所有配置文件放在hexo-blog-backups仓库报错