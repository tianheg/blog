---
title: 'npm 发布包'
date: 2022-11-07T14:31:00+08:00
tags: ['技术']
---

1. <https://docs.npmjs.com/creating-and-publishing-scoped-public-packages>
2. <https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages>

有用户名（@tianheg/package）

```bash
npm login
npm init --scope=@tianheg
touch README.md

# 测试
npm install /path/to/package

# 发布
cd /path/to/package
npm publish --access public
```

无用户名（package）

```bash
...
npm init
...
npm publish
```
