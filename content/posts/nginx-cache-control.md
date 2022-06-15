+++
title = "Nginx(with nginx-proxy) 设置 Cache-Control"
date = 2022-06-15T12:13:00+08:00
lastmod = 2022-06-15T12:57:20+08:00
tags = ["技术", "Nginx", "Docker"]
draft = false
+++

-   Nginx：Web 服务器，[官网](http://nginx.org/)
-   nginx-proxy：使用 [docker-gen](https://github.com/nginx-proxy/docker-gen) 为 Docker Nginx 提供代理，[官网](https://github.com/nginx-proxy/nginx-proxy)
-   Cache-Control：HTTP 请求头，用于控制缓存，[文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)


## 第一步：根据 nginx-proxy 文档设置 nginx.conf {#第一步-根据-nginx-proxy-文档设置-nginx-dot-conf}

我需要设置单个 `VIRTUALHOST` 网站的配置，选择通过文件而不是环境变量设置，后者不够自由，可设置的选项有限。


### 1 修改 nginx-proxy compose 文件 {#1-修改-nginx-proxy-compose-文件}

`~/nginx-proxy/docker-compose.yml`

```diff
- vhost:/etc/nginx/vhost.d
+ /etc/nginx/vhost.d:/etc/nginx/vhost.d

volumes:
-  vhost:
```


### 2 写入配置 {#2-写入配置}

```bash
sudo mkdir /etc/nginx/vhost.d
sudo vim /etc/nginx/vhost.d/www.yidajiabei.xyz
sudo ln -s /etc/nginx/vhost.d/www.yidajiabei.xyz /etc/nginx/vhost.d/yidajiabei.xyz
```

`/etc/nginx/vhost.d/www.yidajiabei.xyz`

```cfg
server_tokens off;
add_header Cache-Control max-age=31536000;
```


## 第二步：重启 nginx-proxy 容器以及 Nginx 博客实例 {#第二步-重启-nginx-proxy-容器以及-nginx-博客实例}

```bash
cd /path/to/nginx-proxy
docker-compose down && docker-compose up -d
cd /path/to/docker-blog
docker-compose down && docker-compose up -d
```

---

参考资料：

1.  [Serve static assets with an efficient cache policy](https://web.dev/uses-long-cache-ttl/)
2.  [Prevent unnecessary network requests with the HTTP Cache](https://web.dev/http-cache/)
3.  [How to Configure Cache-Control Headers in NGINX](https://www.howtogeek.com/devops/how-to-configure-cache-control-headers-in-nginx/)