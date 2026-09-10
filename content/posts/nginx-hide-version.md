---
title: 'Hide Nginx version'
date: 2021-11-21
tags: ['技术', Nginx]
---

`/etc/nginx/nginx.conf`:

```
    http {
      server_tokens off;
    }
```
