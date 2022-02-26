+++
title = "使用 Docker Nginx"
date = 2022-02-17T00:00:00+08:00
lastmod = 2022-02-26T21:22:42+08:00
tags = ["技术", "Nginx", "Docker"]
draft = false
+++

```sh
docker run -d --name nginx -p 80:80 -p 443:443 -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf -v /etc/letsencrypt:/etc/letsencrypt -v /home/www/public:/home/www/public nginx:stable
```