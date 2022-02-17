+++
title = "Hide Nginx version"
date = 2021-11-21T00:00:00+08:00
lastmod = 2022-02-17T12:50:04+08:00
tags = ["技术", "Nginx"]
draft = false
+++

`/etc/nginx/nginx.conf`:

```cfg
http {
  server_tokens off;
}
```