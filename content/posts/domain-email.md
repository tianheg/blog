+++
title = "域名邮箱"
date = 2021-12-17T00:00:00+08:00
lastmod = 2022-04-27T14:25:15+08:00
tags = ["技术"]
draft = false
+++

<https://antfu.me/posts/domain-email>

一直以来都很想要一个域名邮箱，现在终于有了。域地址名：me@yidajiabei.xyz。

使用 <https://forwardemail.net/en>（支持 GitHub 登录），只需要添加 3 条 DNS 记录：

```text
MX   @  mx1.forwardemail.net  10
MX   @  mx2.forwardemail.net  10
TXT  @  forward-email=me:youremail@example.com
```

10 是优先级，me 则表示 `me@yidajiabei.xyz` ，当向该域名邮箱发送邮件时，邮件会被转发至 `youremail@example.com` 。

2022-01-13 更新：

Cloudflare 提供一种名为 [Email Routing](https://blog.cloudflare.com/introducing-email-routing/) 的服务，很久之前加入内测，今天可以使用了。它的作用和 Forward Email 一样，就是把域名邮箱转发到另一个邮箱。

2022-04-27 更新：

使用了 Mailgun 的付费服务。
