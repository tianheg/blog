---
title: '使用 Cloudflare Tunnel 将本地网页暴露在公网中'
date: 2023-05-17T10:14:00+08:00
tags: ['技术', Cloudflare]
---

记录自己的配置过程。参考文章：[Setting up a Cloudflare Tunnel on the Raspberry Pi - Pi My Life Up](https://pimylifeup.com/raspberry-pi-cloudflare-tunnel/)

---

树莓派3b闲了很长时间，想把它利用起来。重装了 Ubuntu 22.04 LTS。

所有依次执行的命令：

```bash
sudo apt update
sudo apt upgrade
sudo apt install curl lsb-release
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee  /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install cloudflared
cloudflared tunnel login # 点击出现的链接，选择域名
cloudflared tunnel create TUNNELNAME
cloudflared tunnel route dns TUNNELNAME DOMAINNAME
cloudflared tunnel run --url localhost:PORT TUNNELNAME
```

设置 systemd 服务，使得开机自启：

```bash
sudo vim ~/.cloudflared/config.yml
sudo cloudflared --config ~/.cloudflared/config.yml service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

~/.cloudflared/config.yml:

```yaml
tunnel: [TUNNELNAME]
credentials-file: /home/[USERNAME]/.cloudflared/[UUID].json

ingress:
    - hostname: [HOSTNAME]
      service: [PROTOCOL]://localhost:[PORT]
    - service: http_status:404
```
