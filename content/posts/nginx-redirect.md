+++
title = "Nginx Redirect"
date = 2021-12-03T00:00:00+08:00
lastmod = 2022-04-30T09:33:02+08:00
tags = ["Nginx"]
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

## References {#references}

- [How to Redirect NON-WWW &amp; WWW with Nginx - LinuxCapable](https://www.linuxcapable.com/how-to-redirect-non-www-www-with-nginx/)
- [How to redirect non-www to www domain in Nginx | Linode Questions](https://www.linode.com/community/questions/18987/how-to-redirect-non-www-to-www-domain-in-nginx)
