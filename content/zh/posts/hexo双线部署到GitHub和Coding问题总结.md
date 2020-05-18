---
title: Hexo双线部署到GitHub和Coding问题总结
date: 2020-05-18T14:25:57+08:00
categories: ["技术"]
series: ["Hexo"]
slug: hexo deploy GitHub and Coding
keywords: ["deploy","hexo","blog"]
description: "记录了部署到 GitHub 和 Coding 的部分过程"
---

| 记录类型 | 主机记录 | 解析线路 | 记录值                  | MX优先级 | TTL值 | 状态(暂停/正常) | 备注 |
| -------- | -------- | -------- | ----------------------- | -------- | ----- | --------------- | ---- |
| A        | @        | 默认     | 185.199.111.153         |          | 600   | 正常            |      |
| A        | @        | 默认     | 185.199.110.153         |          | 600   | 正常            |      |
| A        | @        | 默认     | 185.199.109.153         |          | 600   | 正常            |      |
| A        | @        | 默认     | 185.199.108.153         |          | 600   | 正常            |      |
| CNAME    | @        | 海外     | gaotianhe.github.io     |          | 600   | 正常            |      |
| CNAME    | www      | 百度     | nz41rt.coding-pages.com |          | 600   | 正常            |      |

从该网址 [静态网站列表](https://yidajiabei.coding.net/p/yidajiabei/cd/website/static) 进入 网址https://www.yidajiabei.xyz 时，没有 css、js、html等的渲染，只有空白和蓝色的文字。刷新一次后无法访问，显示：

```
This site can’t be reached
www.yidajiabei.xyz’s server IP address could not be found.
Try running Windows Network Diagnostics.
DNS_PROBE_FINISHED_NXDOMAIN
```

当我的解析记录改为这个状态时：

| 记录类型 | 主机记录   | 解析线路 | 记录值                  | MX优先级 | TTL值 | 状态(暂停/正常) | 备注 |
| -------- | ---------- | -------- | ----------------------- | -------- | ----- | --------------- | ---- |
| CNAME    | b8ehz5xgcm | 默认     | ziyuan.baidu.com        |          | 600   | 正常            |      |
| A        | @          | 默认     | 124.156.193.111         |          | 600   | 正常            |      |
| A        | @          | 默认     | 185.199.111.153         |          | 600   | 暂停            |      |
| A        | @          | 默认     | 185.199.110.153         |          | 600   | 暂停            |      |
| A        | @          | 默认     | 185.199.109.153         |          | 600   | 暂停            |      |
| A        | @          | 默认     | 185.199.108.153         |          | 600   | 暂停            |      |
| CNAME    | @          | 海外     | gaotianhe.github.io     |          | 600   | 正常            |      |
| CNAME    | www        | 百度     | nz41rt.coding-pages.com |          | 600   | 正常            |      |

从该网址 [静态网站列表](https://yidajiabei.coding.net/p/yidajiabei/cd/website/static) 进入 网址https://www.yidajiabei.xyz 时，无法访问。

从 GitHub 那里访问 https://yidajiabei.xyz 也不正常，显示如下信息：

```
Your connection is not private
Attackers might be trying to steal your information from yidajiabei.xyz (for example, passwords, messages, or credit cards). Learn more
NET::ERR_CERT_COMMON_NAME_INVALID
advanced:
yidajiabei.xyz normally uses encryption to protect your information. When Google Chrome tried to connect to yidajiabei.xyz this time, the website sent back unusual and incorrect credentials. This may happen when an attacker is trying to pretend to be yidajiabei.xyz, or a Wi-Fi sign-in screen has interrupted the connection. Your information is still secure because Google Chrome stopped the connection before any data was exchanged.

You cannot visit yidajiabei.xyz right now because the website uses HSTS. Network errors and attacks are usually temporary, so this page will probably work later.
```

最终当我能够正常访问时，我的 DNS 解析设置如下所示：

域名 www.yidajiabei.xyz 的解析设置：

| 记录类型 | 主机记录 | 解析线路 | 记录值                  | MX优先级 | TTL值 | 状态(暂停/正常) | 备注 |
| -------- | -------- | -------- | ----------------------- | -------- | ----- | --------------- | ---- |
| CNAME    | @        | 默认     | gaotianhe.github.io     |          | 600   | 正常            |      |
| CNAME    | @        | 百度     | nz41rt.coding-pages.com |          | 600   | 暂停            |      |



域名 yidajiabei.xyz 的解析设置：

| 记录类型 | 主机记录    | 解析线路 | 记录值                                                       | MX优先级 | TTL值 | 状态(暂停/正常) | 备注 |
| -------- | ----------- | -------- | ------------------------------------------------------------ | -------- | ----- | --------------- | ---- |
| TXT      | alidnscheck | 默认     | 91a9b96c8d9a4c7a95e6c85e4a8b793d                             |          | 600   | 正常            |      |
| TXT      | @           | 默认     | google-site-verification=PYcQ3OCdNw3V4S9mA4oesqV7wPGXSC10PavQJRlg_ek | 600      | 正常  |                 |      |
| CNAME    | b8ehz5xgcm  | 默认     | ziyuan.baidu.com                                             |          | 600   | 正常            |      |
| A        | @           | 默认     | 124.156.193.111                                              |          | 600   | 暂停            |      |
| A        | www         | 默认     | 185.199.111.153                                              |          | 600   | 正常            |      |
| CNAME    | www         | 百度     | nz41rt.coding-pages.com                                      |          | 600   | 暂停            |      |

可以看出，我用了一个二级域名，来指向 gaotianhe.github.io .

再为二级域名 www.yidajiabei.xyz 在 yidajiabei.xyz 的解析列表里，添加 TXT 文本记录。

目前能够通过 https://www.yidajiabei.xyz 访问博客，也能通过 https://www.yidajiabei.xyz/knowledge 访问知识库

---

无法在 [谷歌站长](https://search.google.com/search-console?resource_id=sc-domain%3Ayidajiabei.xyz) 添加站点地图 https://www.yidajiabei.xyz/sitemap.xml



---

Github Pages 对应的 ip ：

| ip 地址         |
| --------------- |
| 185.199.111.153 |
| 185.199.110.153 |
| 185.199.109.153 |
| 185.199.108.153 |

---

暂时不管 Coding 这边的部署了，先确保我自己能够访问自己的博客。