---
title: '使用 Cloudflare 产品，了解其公司'
date: 2022-11-06T14:59:00+08:00
tags: ['技术']
---

1. [Home · Cloudflare Docs](https://developers.cloudflare.com/)
2. [Learning Center Home | Cloudflare](https://www.cloudflare.com/learning/)
3. [Open Positions at Cloudflare | Cloudflare](https://www.cloudflare.com/careers/jobs/) 通过 Cloudflare 的招聘看它的发展。

## Workers & Pages
### Deploy a Web app

```javascript
npm create cloudflare
```

### 配置

1.安装Workers CLI

```bash
pnpm add -g wrangler
```

2.Hello World 程序

```javascript
    addEventListener("fetch", (event) => {
      event.respondWith(handleRequest(event.request))
    })

    async function handleRequest(request) {
      return new Response("Hello World")
    }
```

### Workers 如何工作

[How Workers works · Cloudflare Workers docs](https://developers.cloudflare.com/workers/learning/how-workers-works/)

基于 V8 引擎，利用 V8 的沙箱功能提高安全性，直接在 V8 上运行 JS 函数提高执行效率。

在[这篇文章](https://www.cloudflare.com/learning/serverless/glossary/client-side-vs-server-side/)中，解释了 client/server 和 frontend/backend：

Client-side 仅指进程运行的位置在客户端；Frontend 指在客户端运行的进程的类型。

Server side 指一切发生在服务器的事情。在过去，几乎全部的业务逻辑都在服务端执行，比如，渲染动态页面、连接数据库、身份授权和推送通知。

Server-side 指进程运行的位置在服务器；Backend 指在服务器运行的进程的类型。

Workers 与其他应用不同的方面在这三点：隔离、对每个请求进行计算、分布式执行。

#### 隔离

由 V8 提供。内存也隔离。

## CDN

https://github.com/XIU2/CloudflareSpeedTest

```bash
yay -S cloudflarespeedtest
```

https://github.com/XIU2/CloudflareSpeedTest/discussions/71

https://github.com/XIU2/CloudflareSpeedTest/discussions/317
## WARP

```bash
yay -S cloudflare-warp-bin
```
