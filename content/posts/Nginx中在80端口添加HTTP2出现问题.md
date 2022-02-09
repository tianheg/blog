+++
date = '2021-11-03T09:05:48+08:00'
title = 'Nginx 中在 80 端口添加 HTTP/2 出现问题'
tags = ['Nginx', 'HTTP/2']
slug = 'nginx-error-with-80-http2'
+++

承接上篇文章[通过 Nginx 让网站支持 HTTP/2](/posts/nginx-http2/)，当我完成文章中的操作时，有一次我好奇网站 HTTP 是否能够自动跳转到 HTTPS，于是我输入 `http://blog.yidajiabei.xyz/`，意外发生了——没有跳转到 HTTPS，还下载了一个名字为 `download` 且文件类型为 `application/octet-stream`。

我很意外，思考这是为什么。把这个问题记下来，过了几个小时，我从网络中找到答案：HTTP2 不需要加密[^1]，当然这只是肤浅的说法，一定还有深层次的理解。

通过这篇文章[^2]，我学到一条检查网站是否支持 HTTP/2 的命令：

```sh
$ curl -I -k --http2 https://blog.yidajiabei.xyz/
HTTP/2 200 
server: nginx/1.18.0 (Ubuntu)
date: Wed, 03 Nov 2021 00:37:29 GMT
content-type: text/html
content-length: 5254
last-modified: Tue, 02 Nov 2021 23:37:46 GMT
etag: "6181cbca-1486"
accept-ranges: bytes
```

在这篇文章中，我找到了 Nginx 配置 HTTP/2 的方法：

```conf
server {
    listen 443 ssl http2 default_server;
    ssl_certificate    /path/to/server.cert;
    ssl_certificate_key /path/to/server.key;
    # ...
    # Copy from the HTTP server
    # ...
}
```

根据这一配置，再联系到 HTTP/2 不需要加密，那么是不是不能在 80 端口配置 HTTP2 呢？也就是说，以下配置会造成无法由 HTTP 跳转到 HTTPS：

```conf
server {
    listen 80 http2;
    # ...
}
```

当这一切都被修正时，HTTP 就能够跳转到 HTTPS 了。

[^1]: https://http2.github.io/faq/#does-http2-require-encryption
[^2]: https://dassur.ma/things/h2setup/