---
title: 'Git Delete Submodule'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Git
---

<https://stackoverflow.com/a/1260982/12539782>

仓库中只有一个子模块：

\`\`\`bash git rm <path-to-submodule> rm .gitmodules rm -rf .git/modules git config --remove-section submodule.<path-to-submodule> \`\`\`


相关：[[git-submodule-update|git-submodule-update]]

相关：[[git-set-global-gitignore|git-set-global-gitignore]]