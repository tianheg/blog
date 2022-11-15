+++
title = "为 MDN 网站设置代理"
date = 2022-08-09T11:13:00+08:00
lastmod = 2022-08-09T12:38:52+08:00
tags = ["技术"]
draft = false
+++

MDN 全称 Mozilla Developer Network，这是它第二个名字[^fn:1]。

现在它的全称是 MDN Web Docs，简写为 MDN。它是 Web 技术文档，由开发人员撰写，开发人员使用。它的网址：<https://developer.mozilla.org/en-US/> 。

上个月有一次，无论我怎么找办法，都不能访问 `developer.mozilla.org` ，还好过了半天可以访问了。从那以后，我就有了为 MDN 网站设置代理的念头。

什么是为网站设置代理？

换句话说，就是把这个网站克隆下来（也就是做一个镜像）。

我找到两个办法来做这件事：Cloudflare Workers 和 Vercel Serverless Functions。


## Cloudflare Workers {#cloudflare-workers}

新建一个服务，设置名字，选择 `HTTP handler` ，在 Resources 标签页下有一个 Quick edit，选中后进入一个编辑器页面，将以下代码敲入其中，保存并部署即可访问。

```js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  url.hostname = 'developer.mozilla.org';
  const data = await fetch(url.toString(),request);
  return data;
}
```

但是，直接使用 \*.pages.dev 域名访问在我这里还是很慢，所以我加了自己的域名，访问速度稍微快了些。

不懂的地方可以读文档[^fn:2]，写得很详细。


## Vercel Serverless Functions {#vercel-serverless-functions}

用到了 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) 和 [Express](https://expressjs.com/)，代码的主要部分。

```js
const express = require("express");
const { legacyCreateProxyMiddleware } = require("http-proxy-middleware");
const PORT = process.env.PORT || 8080;

const app = express();

const apiProxy = legacyCreateProxyMiddleware({
    target: "https://developer.mozilla.org",
    changeOrigin: true,
    logger: console,
});

app.use("/", apiProxy);

app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
```

vercel.json 文件是 Express 能够在 Vercel 运行的原因。它的内容如下。

```json
{
  "builds": [
    {
      "src": "./index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

完整代码在「[这里](https://github.com/tianheg/demo-proxy-server)」。

一些文档：

-   Express：<https://expressjs.com/en/5x/api.html>
-   http-proxy-middleware：<https://github.com/chimurai/http-proxy-middleware>
-   Vercel Serverless Functions：<https://vercel.com/docs/concepts/functions/serverless-functions>

[^fn:1]: [MDN Web Docs - Wikipedia](https://en.wikipedia.org/wiki/MDN_Web_Docs)
[^fn:2]: [Home · Cloudflare Docs](https://developers.cloudflare.com/)