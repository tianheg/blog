+++
date = '2021-09-21T22:20:34+08:00'
title = '部署 Hugo 博客到 Ubuntu 服务器'
tags = ['Hugo', 'Web Server', 'Nginx']
slug = 'deploy-hugo-blog-to-ubuntu-server'
+++

## 安装 Hugo

```sh
export HUGO_VERSION="0.88.1"
wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.deb
sudo apt-get install ./hugo_extended_${HUGO_VERSION}_Linux-64bit.deb
```

## 克隆仓库，本地预览

```sh
cd ~
git clone https://github.com/tianheg/blog.git
cd blog
hugo server --bind 0.0.0.0 --baseURL http://ip:1313
```

## 安装并配置 Nginx 服务器

```sh
sudo apt-get install nginx
```

修改 `/etc/nginx/nginx.conf`:

```sh
http {
  server {
      listen 443 ssl;
      server_name domain;
      ssl_certificate /etc/nginx/ssl/domain.crt;
      ssl_certificate_key /etc/nginx/ssl/domain.key;
      ssl_session_timeout 5m;
      ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
      ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
      ssl_prefer_server_ciphers on;
      location / {
          root /var/www/hugo;
          index  index.html index.htm;
      }
  }
  server {
          listen 80;
          server_name domain;
          rewrite ^(.*) https://$server_name$1 permanent; # 重定向 80 端口为 https
  }
}
```

## 从云服务商下载 HTTPS 证书

证书压缩文件里包含了很多服务器的文件夹，找到 Nginx 的文件夹，重命名两个文件为 `domain.crt`，`domain.key`。并将两个文件放到 `/etc/nginx/ssl/` 文件夹下（如果不存在 ssl 文件夹，需要新建）。

## Shell 脚本快速更新博客

制作了一个很简单的脚本 `update-blog.sh`：

```sh
#!/usr/bin/env bash

cd ~/blog
export BLOG_PATH=/home/ubuntu/blog/config.toml
git restore $BLOG_PATH
git pull
sed -i 's/blog/weblog/g' $BLOG_PATH
sudo hugo -d /var/www/hugo
```

## 迁移博客到服务器

把以上过程中的域名换为 `blog.yidajiabei.xyz`。更新博客的脚本改为：

```sh
#!/usr/bin/env bash

cd ~/blog
git pull
sudo rm -rf /var/www/hugo ~/blog/public # 如果内容被删除，则需要使用新的 hugo build 文档
sudo hugo -d /var/www/hugo
```

遇到 Git 子模块无法更新的情况，于是还需要在以上脚本中添加以下命令：

```sh
rm -rf themes/tianheg
git clone --depth 1 https://github.com/tianheg/hugo-theme-tianheg.git themes/tianheg
```

完整命令如下：

```sh
#!/usr/bin/env bash

cd ~/blog
rm -rf themes/tianheg
git clone --depth 1 https://github.com/tianheg/hugo-theme-tianheg.git themes/tianheg
git pull
sudo rm -rf /var/www/hugo ~/blog/public # 如果内容被删除，则需要使用新的 hugo build 文档
sudo hugo -d /var/www/hugo
```

## 参考资料

1. <https://gideonwolfe.com/posts/sysadmin/hugonginx/>
2. <http://www.withpy.com/hugo博客部署到腾讯云服务器/>
