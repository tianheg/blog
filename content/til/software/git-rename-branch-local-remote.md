---
title: 'Git Rename Branch Local Remote'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Git
---

[How to Rename Git Local and Remote Branches](https://www.w3docs.com/snippets/git/how-to-rename-git-local-and-remote-branches.html)

\`\`\`bash ## Local git branch -m <old-name> <new-name> ## Remote

git push origin --delete <old-name> # or git push origin :<old-name>

git push origin <new-name>

git push origin -u <new-name> ```
