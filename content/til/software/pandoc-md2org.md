---
title: 'Pandoc md2org'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

```bash
pandoc input.md -f markdown -t org | sed -e '/^:PROPERTIES:/,/^:END:/d' > output.org
```
