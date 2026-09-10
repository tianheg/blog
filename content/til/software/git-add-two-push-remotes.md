---
title: 'Git Add two push remote'
status: draft
date: 2026-02-14T15:30:40+08:00
header: Git
---

```bash
git remote add origin git@github.com:xxx/a.git
git remote -v
#origin git@github.com:xxx/a.git (fetch)
#origin git@github.com:xxx/a.git (push)
git remote set-url --add --push origin git@codeberg.org:xxx/a.git
git remote -v
#origin git@github.com:xxx/a.git (fetch)
#origin git@codeberg.org:xxx/a.git (push)
git remote set-url --add --push origin git@codeberg.org:xxx/b.git
git remote -v
#origin git@github.com:xxx/a.git (fetch)
#origin git@codeberg.org:xxx/a.git (push)
#origin git@codeberg.org:xxx/b.git (push)
```
