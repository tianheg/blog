---
title: 'Linux User'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Linux
---

## `chsh`

更改当前用户 Shell

\`\`\`bash chsh -s /bin/zsh echo $SHELL \`\`\`

列出所有 Shell

\`\`\`bash chsh -l \`\`\`

## `useradd`

新建用户（有家目录）

来源: [ArchWiki: Users and groups](https://wiki.archlinux.org/title/Users_and_groups)

\`\`\`bash useradd -m example passwd example \`\`\`

## `adduser`

`adduser` provides a high level interface for adding new users, and `useradd` provides a low level interface.
