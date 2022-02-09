+++
date = '2021-10-22T21:51:37+08:00'
title = 'Nginx Conflicting Server Name 问题'
tags = ['Nginx']
slug = 'nginx-conflicting-server-name'
+++

曾经在执行一些 Nginx 命令时总会出现如下警告：

```sh
sudo nginx -t
time [warn] 15818#15818: conflicting server name "mydomain.com" on 0.0.0.0:80, ignored
```

这只是个警告，所以没有给予更多关注，当时想的主要是保证网站的正常运行。现在网站已经正常运行了一段时间，于是对于这个警告也有了兴趣。在网络中的第一次搜索就找到了答案[^1]，说明这个问题很简单，事实也是如此。

在 Nginx 的站点配置中，有一个叫做 server block 的概念。一个 server block 就是一个站点，它有两个可选位置：`/etc/nginx/nginx.conf` 和 `/etc/nginx/sites-enabled/example.com`。而之所以出现上述警告，是因为我对同一个域名进行了两次配置。我同时使用这两个位置属于重复设置，删除其中一个配置即可。

[^1]: https://www.digitalocean.com/community/questions/conflicting-server-name-mydomain-com-on-0-0-0-0-80-ignored-nginx-error-log-ubuntu-20-04?answer=64571
