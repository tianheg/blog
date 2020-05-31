---
title: Git - 放弃本地修改，强制拉取更新
date: 2020-05-10T18:54:45+08:00
categories: ["技术"]
tech: ["Git"]
slug: Abandon local modifications and force pull updates
keywords: ["Git"]
description: ""
---

开发时，对于本地的项目中修改不做保存操作（或代码改崩），可以用到Git pull的强制覆盖，具体代码如下：

```
git fetch --all
git reset --hard origin/master
git pull //可以省略
```

git fetch 指令是下载远程仓库最新内容，不做合并
git reset 指令把HEAD指向master最新版本