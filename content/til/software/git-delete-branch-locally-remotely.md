---
title: 'Git Delete Branch Locally Remotely'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Git
---

```bash
## local
git branch -d BRANCH
git branch -D BRANCH # force delete
## Remote
git push origin --delete BRANCH
git remote prune origin
```
