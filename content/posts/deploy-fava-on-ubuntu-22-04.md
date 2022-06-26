+++
title = "在 Ubuntu 22.04 上部署 fava（beancount 记账软件的 Web 版本）"
date = 2022-06-26T13:23:00+08:00
lastmod = 2022-06-26T14:12:31+08:00
tags = ["技术", "beancount", "Python"]
draft = false
+++

主要参考资料：[How To Serve Flask Applications with Gunicorn and Nginx on Ubuntu 22.04 | DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-gunicorn-and-nginx-on-ubuntu-22-04)

[fava](https://github.com/beancount/fava) 本质是一个 Flask 应用，所以可以按照 Flask 应用的部署方式来。


## 1. 更新系统环境，并安装依赖 {#1-dot-更新系统环境-并安装依赖}

```sh
sudo apt update
sudo apt install python3-pip python3-dev build-essential libssl-dev libffi-dev python3-setuptools python3-venv
```


## 2. 创建虚拟环境 {#2-dot-创建虚拟环境}

```sh
mkdir ~/fava-site && cd $_
python3 -m venv venv --upgrade-deps
. venv/bin/activate
```


## 3. 安装 Python 依赖 {#3-dot-安装-python-依赖}

```sh
pip install wheel
pip install gunicorn fava
```


## 4. 配置 fava {#4-dot-配置-fava}

```sh
vim app.py
sudo ufw allow 5000
sudo vim /etc/systemd/system/fava-site.service
sudo systemctl start fava-site
sudo systemctl enable fava-site
sudo systemctl status fava-site
```

`app.py`

```python
"""fava wsgi application"""
from __future__ import annotations

from fava.application import app as application

application.config["BEANCOUNT_FILES"] = [
  "ABSOLUTE_PATH_TO_BEANCOUNT_FILE",
]
```

`fava-site.service`

```cfg
[Unit]
Description=Gunicorn instance to serve myproject
After=network.target

[Service]
User=user
Group=www-data
WorkingDirectory=/home/user/fava-site
Environment="PATH=/home/user/fava-site/venv/bin"
ExecStart=/home/user/fava-site/venv/bin/gunicorn --workers 3 --bind unix:fava-site.sock -m 007 app

[Install]
WantedBy=multi-user.target
```


## 5. Nginx 配置反向代理 {#5-dot-nginx-配置反向代理}

```sh
sudo apt update
sudo apt install nginx
sudo ufw app list
sudo ufw allow 'Nginx HTTP'

sudo vim /etc/nginx/sites-available/fava-site
sudo ln -s /etc/nginx/sites-available/fava-site /etc/nginx/sites-enabled
sudo nginx -t # 检查是否运行正常
sudo systemctl restart nginx

sudo ufw delete allow 5000
sudo ufw allow 'Nginx Full'
```

一个注意事项：

如果 Nginx 无法获取 gunicorn 的 socket 文件，会返回 HTTP 502 网关错误。这通常是因为用户的家目录不允许其他用户访问里面的文件。如果 socket 文件位于家目录，确保家目录的权限号码至少为 755。如果不是，修改方法：

```sh
sudo chmod 755 /home/user
```

`fava-site`

```cfg
server {
  listen 80;
  server_name your_domain www.your_domain;

  location / {
    include proxy_params;
    proxy_pass http://unix:/home/user/fava-site/fava-site.sock;
  }
}
```


## 6. 支持 HTTPS {#6-dot-支持-https}

```sh
sudo apt install python3-certbot-nginx

sudo certbot --nginx -d your_domain

sudo ufw delete allow 'Nginx HTTP'
```