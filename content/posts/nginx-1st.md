---
title: 'Nginx 初次使用'
date: 2021-09-19
tags: ['技术', Nginx]
---

## 下载

我使用 Arch Linux

```bash
sudo pacman -S nginx
```

## 初学者指南

<http://nginx.org/en/docs/beginners_guide.html>

介绍 + 一些简单操作：

- 打开关闭 Nginx
- 重新加载配置
- 解释配置文件的结构
- 设置 Nginx 为静态内容提供服务
- 将 Nginx 配置为代理服务器（Nginx 本身是代理服务器还是安装并配置好
  Nginx 的计算机是代理服务器）
- 将它与 FastCGI 应用程序连接

### 打开关闭 Nginx，重新加载配置

```bash
sudo nginx # start
sudo nginx stop # fast shutdown
sudo nginx quit # graceful shutdown

# if modify the configuration file, need reload nginx
sudo nginx -s reload # reload

# list all running nginx processes
ps -ax | grep nginx
```

配置文件的结构

```ini
name {
  key: value;
  # comment
}
```

### 设置 Nginx 为静态内容提供服务

```ini
# edit /etc/nginx/nginx.conf
http {
  server {
    location / {
      root /usr/share/nginx/html;
      index index.html index.htm;
    }
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
      root /usr/share/nginx/html;
    }
  }
}
```

### 将 Nginx 配置为代理服务器

将它与 FastCGI 应用程序连接

```ini
server {
  location / {
    fastcgi_pass  localhost:9000;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param QUERY_STRING    $query_string;
  }

  location ~ \.(gif|jpg|png)$ {
    root /data/images;
  }
}
```

## 使用中的报错

### could not build optimal types_hash

```bash
sudo nginx
2021/09/19 08:55:04 [warn] 33400#33400: could not build optimal types_hash, you should increase either types_hash_max_size: 1024 or types_hash_bucket_size: 64; ignoring types_hash_bucket_size
```

Solution:

```ini
# /etc/nginx/nginx.conf
http {
  types_hash_max_size 4096;
}
```

### Address already in use

```bash
[emerg] 34338#34338: bind() to 0.0.0.0:80 failed (98: Address already in use)
```

Solution:

```bash
sudo pkill -f nginx & wait $!
sudo systemctl start nginx
```

https://wiki.archlinux.org/title/nginx#Configuration_example

https://stackoverflow.com/a/51664874
