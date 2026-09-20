---
title: 'Hide Nginx version'
date: 2021-11-21
tags: ['技术']
---

`/etc/nginx/nginx.conf`:

```
    http {
      server_tokens off;
    }
```
