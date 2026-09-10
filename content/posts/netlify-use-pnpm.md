---
title: 'Netlify 使用 pnpm'
date: 2022-11-14T09:09:00+08:00
tags: ['技术']
---

如果你的仓库根目录中存在 `pnpm-lock.yaml` 文件，会自动安装依赖；如果你的仓库有多个 `pnpm-lock.yaml` 文件，即 monorepo，需指定环境变量 =NETLIFY_USE_PNPM=true= 。

参考资料：

1. [Manage build dependencies | Netlify Docs](https://docs.netlify.com/configure-builds/manage-dependencies/#pnpm)
2. [Feature request: Add PNPM support · Issue #1633 · netlify/build](https://github.com/netlify/build/issues/1633)
