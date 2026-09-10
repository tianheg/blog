---
title: 'Git Github Act'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Git
---

[nektos/act: Run your GitHub Actions locally 🚀](https://github.com/nektos/act)

## 配置

```bash

yay -S act act

```

## 使用

\`\`\`bash

act [&lt;event&gt;] [options] If no event name passed, will default to "on: push"

act -l

act workflow<sub>dispatch</sub> -l

act

act pull<sub>request</sub>

act -j test

act -n

act -v ```

在 GitHub 上运行 Actions 时，`GITHUB<sub>TOKEN</sub>` 是自动生成的，本地运行则需要添加：

\`\`\`bash act -s GITHUB<sub>TOKEN</sub>=[insert token or leave blank for secure input] \`\`\`
