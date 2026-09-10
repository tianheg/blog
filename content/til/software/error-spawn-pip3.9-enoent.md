---
title: 'Error: spawn pip3.9 ENOENT'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

When deploying Datasette using Vercel, recently always come with this error:

```bash
Failed to run "pip3.9 install --disable-pip-version-check --target . werkzeug==1.0.1"
Error: spawn pip3.9 ENOENT
```

Change Node.js version from v20 to v18 can fix it.
