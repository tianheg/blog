---
title: '使用 Calibre-Web 在线管理本地书籍'
date: 2022-11-05T15:11:00+08:00
tags: ['技术']
---

通过 Docker Compose 方式安装 Calibre-Web：

```yaml
version: "2.1"
services:
  calibre-web:
    image: linuxserver/calibre-web:latest
    container_name: calibre-web
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
    volumes:
      - ./config:/config
      - ./library:/config/Calibre Library
    ports:
      - 8083:8083
    restart: unless-stopped
```

在添加数据库的时候遇到问题：总是无法添加。 `DB Location is not Valid, Please Enter Correct Path` 。上面的配置是修改后的正确配置。

参考资料：

1. [janeczku/calibre-web](https://github.com/janeczku/calibre-web)
2. [使用 calibre 搭建私人书库 | 眈眈探求](https://exp-blog.com/website/calibre-da-jian-si-ren-shu-ku/)
3. [linuxserver/calibre-web](https://docs.linuxserver.io/images/docker-calibre-web)
