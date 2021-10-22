+++
date = '2021-10-22T21:53:21+08:00'
title = "在 Ubuntu20.04 配合 Nginx 使用 Let's Encrypt 证书"
tags = ['Nginx', 'Ubuntu', "Let's Encrypt"]
slug = 'install-letsencrypt-with-nginx-on-ubuntu20.04'
+++

进行以下步骤的前提：

1. 有一台已经初始安装的 Ubuntu20.04 服务器，包括一个能够 sudo 的非 root 的用户和防火墙
2. 一个已注册的域名
3. 域名已经和当前服务器 IP 绑定
4. [Nginx 已经安装并能够正常使用](/posts/first-use-nginx/)

## 安装 Certbot

```sh
sudo apt install certbot python3-certbot-nginx
```

## 配置 Nginx

我已经通过 Nginx 部署了一个站点——blog.yidajiabei.xyz，现在部署的是第二个站点——til.yidajiabei.xyz。我没有使用 server block[^2]，即新建 `/etc/nginx/sites-available/til.yidajiabei.xyz` 文件，并通过 `sudo ln -s /etc/nginx/sites-available/til.yidajiabei.xyz /etc/nginx/sites-enabled/` 命令链接至 `sites-enabled` 文件夹下。而是直接将配置写在 `/etc/nginx/nginx.conf` 文件中。

```conf
http {
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    server {
        listen 443 ssl;
	server_name til.yidajiabei.xyz;
	ssl_session_timeout 5m;
	location / {
	    root /var/www/til;
	    index index.html index.htm;
	}
    }
    server {
        listen 80;
	server_name til.yidajiabei.xyz;
	rewrite ^(.*) https://$server_name$1 permanent;
    }
}
```

你可以看到有两个 server，前一个是配置 HTTPS 的，后一个是把 HTTP 重定向至 HTTPS。而且，第一个 server 中缺少 SSL 证书和密匙，这两个配置是由 Certbot 自动添加的。

## 获取一个 SSL 证书

```sh
sudo certbot --nginx -d til.yidajiabei.xyz
```

按照提示一步步操作，如果没有异常，就能够获得 SSL 证书，位置在 `/etc/letsencrypt/live/til.yidajiabei.xyz/`，此时 `/etc/nginx/nginx.conf` 文件也会发生变化：

```conf
http {
    ...
    server {
        listen 443 ssl;
        server_name til.yidajiabei.xyz;
	ssl_certificate /etc/letsencrypt/live/til.yidajiabei.xyz/fullchain.pem; # managed by Certbot
	ssl_certificate_key /etc/letsencrypt/live/til.yidajiabei.xyz/privkey.pem; # managed by Certbot
        ssl_session_timeout 5m;
        ...
    }
    ...
}
```

## 验证 Certbot 自动更新

```sh
sudo systemctl status certbot.timer
● certbot.timer - Run certbot twice daily
     Loaded: loaded (/lib/systemd/system/certbot.timer; enabled; vendor preset: enabled)
     Active: active (waiting) since Fri 2021-10-22 09:38:04 CST; 6h ago
    Trigger: Sat 2021-10-23 04:10:06 CST; 12h left
   Triggers: ● certbot.service

Oct 22 09:38:04 VM-4-5-ubuntu systemd[1]: Started Run certbot twice daily.
```

Certbot 自动更新正常运行。还可以通过以下命令测试「更新证书」这一过程：

```sh
sudo certbot renew --dry-run
```

[^1]: https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04
[^2]: https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04
