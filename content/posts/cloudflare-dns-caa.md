+++
title = "Cloudflare DNS 添加 CAA 记录"
date = 2022-08-18T19:48:00+08:00
lastmod = 2022-08-18T19:59:55+08:00
tags = ["技术"]
draft = false
+++

什么是 CAA[^fn:1]？

> DNS Certification Authority Authorization (CAA) is designed to allow a DNS domain name holder (a website owner) to specify one or more Certificate
> Authorities (CAs) the authority to issue certificates for that domain or website, according to a definition in IETF draft RFC 6844.

为自己的域名指定证书机构。

Cloudflare 上关于 CAA 的 FAQ：[地址](https://support.cloudflare.com/hc/en-us/articles/115000310832-Certification-Authority-Authorization-CAA-FAQ)。

Cloudflare 有一个 [Certificate Transparency Monitoring](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/certificate-transparency-monitoring) 功能。如果不使用 Cloudflare 提供的 Universal SSL，而使用其他证书提供服务（部署在 Netlify 的网站会获得免费证书）。当 Certificate Transparency Monitoring 功能开启时，Cloudflare 就会向用户邮箱发送邮件。

[^fn:1]: [What is Certificate Authority Authorization (CAA)?](https://www.websecurity.digicert.com/security-topics/what-is-certificate-authority-authorization)