+++
title = "Nginx Redirect"
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-06-18T17:07:28+08:00
tags = ["Nginx", "技术", "Docker"]
draft = false
+++

## http to https {#http-to-https}

```cfg
http {
  server {
    listen 443 ssl;
    server_name www.example.com;
    ssl_certificate /path/to/file;
    ssl_certificate_key /path/to/file;
    ...
  }
  server {
    listen 80;
    server_name www.example.com;
    rewrite ^(.*) https://$server_name$1 permanent;
  }
}
```


## example.com to www.example.com {#example-dot-com-to-www-dot-example-dot-com}

```cfg
http {
  server {
    listen 80;
    server_name www.example.com example.com;
    return 301 https://www.example.com$request_uri;
}
```

要记得为根域名添加 DNS 记录，如果不添加的话，怎么改 Nginx 的配置都是不行的。来自我亲身经历的教训：）


## `https://example.com` to `https://www.example.com` {#https-example-dot-com-to-https-www-dot-example-dot-com}

```cfg
http {
  server {
    listen 80;
    server_name www.example.com example.com;
    return 301 https://www.example.com$request_uri;
  }
  server {
    listen 443 ssl http2;
    server_name example.com;
    return 301 https://www.example.com$request_uri;
  }
  server {
    listen 443 ssl http2;
    server_name www.example.com;
    ssl_certificate /path/to/ssl.pem;
    ssl_certificate_key /path/to/ssl-key.pem;
    location / {
      root /home/www/public;
      index index.html;
    }
  }
}
```


## Configure with Docker {#configure-with-docker}

用到了 [nginx-proxy](https://hub.docker.com/r/nginxproxy/nginx-proxy)。

nginx-proxy 的 docker-compose 文件：

```yml
version: "3"

services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs:ro
      - conf:/etc/nginx/conf.d
      - /etc/nginx/vhost.d:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
    restart: always
    environment:
      - VIRTUAL_PROTO=https
      - VIRTUAL_PORT=443

  acme-companion:
    image: nginxproxy/acme-companion
    container_name: nginx-proxy-acme
    depends_on:
      - nginx-proxy
    volumes:
      - /etc/nginx/vhost.d:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - certs:/etc/nginx/certs:rw
      - acme:/etc/acme.sh
      - /var/run/docker.sock:/var/run/docker.sock:ro
    network_mode: bridge
    environment:
      - DEFAULT_EMAIL=me@tianheg.xyz
      - NGINX_PROXY_CONTAINER=nginx-proxy
    restart: always

volumes:
  conf:
  html:
  certs:
  acme:

networks:
  default:
    name: nginx-proxy
```

博客的 docker-compose 文件：

```yml
version: "3.9"

services:
  nginx:
    image: nginx:stable
    restart: always
    volumes:
      - /home/www/public:/usr/share/nginx/html
    expose:
      - 80
      - 443
    environment:
      - VIRTUAL_HOST=www.yidajiabei.xyz,yidajiabei.xyz
      - LETSENCRYPT_HOST=www.yidajiabei.xyz,yidajiabei.xyz

  blog:
    image: tianheg/hugo:0.99.1
    volumes:
      - ...
      - ...
    environment:
      - HUGO_BASEURL=https://www.yidajiabei.xyz/

networks:
  default:
    name: nginx-proxy
```

在 vhost.d 中创建 yidajiabei.xyz 文件：

```cfg
return 301 $scheme://www.yidajiabei.xyz$request_uri;
```

`$scheme` 包含了 http 和 https。


## References {#references}

-   [How to Redirect NON-WWW &amp; WWW with Nginx - LinuxCapable](https://www.linuxcapable.com/how-to-redirect-non-www-www-with-nginx/)
-   [How to redirect non-www to www domain in Nginx | Linode Questions](https://www.linode.com/community/questions/18987/how-to-redirect-non-www-to-www-domain-in-nginx)
-   [how to redirect no-www to www under jwilder/nginx-proxy?](https://stackoverflow.com/questions/35973947/how-to-redirect-no-www-to-www-under-jwilder-nginx-proxy)