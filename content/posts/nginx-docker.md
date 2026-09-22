---
title: '使用 Docker Nginx'
date: 2022-02-17
tags: ['技术']
---

```bash
    docker run -d --name nginx -p 80:80 -p 443:443 -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf -v /etc/letsencrypt:/etc/letsencrypt -v /home/www/public:/home/www/public nginx:stable
```
