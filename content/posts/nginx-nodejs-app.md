---
title: 'Nginx 通过代理部署 Node.js 应用'
date: 2022-11-14T14:19:00+08:00
tags: ['技术']
---

https://dev.to/jsstackacademy/deploy-nodejs-application-using-nginx-3jhh

1. 确保 Node.js 应用能够生成最终要部署的静态页面。
2. 配置好 pm2；并安装 Nginx
3. `sudo vim  /etc/nginx/sites-available/default`

```ini
    server {
     location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
```

3000 是本地运行的端口号，根据需要更改。

这样完成后，可以使用 `http://ip` 访问，而不需要加上端口号，例如
`http://ip:3000` 。
