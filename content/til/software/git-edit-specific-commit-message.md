---
title: 'Git Edit Specific Commit Message'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Git
---

<https://stackoverflow.com/a/1186549/12539782>

想修改 `bbc643cd` 的信息

\`\`\`bash git rebase --interactive 'bbc643cd^' \`\`\`

在默认编辑器打开后，将 pick 改为 r/reword 后保存，然后就可以修改 commit 信息了。
