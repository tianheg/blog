---
title: '通过 Netlify function 随机展示 Unsplash 上的图片'
date: 2023-02-26T21:52:00+08:00
tags: ['技术']
---

我本意是想通过 [Netlify function](https://www.netlify.com/products/functions/) 在线获取网易云音乐中“我喜欢”歌单，然后生成网页的，后来发现行不通。但是，又想温习一下 Netlify function 的用法。于是，就有了如题所说的内容。现在你可以通过 <https://tianheg.co/.netlify/functions/unsplash> 体验。

## 完整配置

`netlify.toml` ：

```toml
[build]
functions = "functions"

[context.production.environment]
  NODE_VERSION = "18.12.1"

[functions]
  node_bundler = "esbuild"

[[plugins]]
package = "@netlify/plugin-functions-install-core"
```

`functions/unsplash.js` ：

```javascript
import serverless from "serverless-http"
import { createApi } from "unsplash-js";
import nodeFetch from 'node-fetch';
import express from 'express'

const unsplash = createApi({ accessKey: process.env.ACCESS_KEY, fetch: nodeFetch })

const app = express()
const PORT = 3000

app.get('/.netlify/functions/unsplash/', (req, res) => {
  unsplash.photos.getRandom()
    .then(json => {
      let imageUrl = json.response.urls.regular;
      res.send(`<img src="${imageUrl}">`)
    })
})

app.listen(PORT, () => {
  console.log(`Unsplash app listening on port ${PORT}`)
})

exports.handler = serverless(app)
```

在 Web 端要添加环境变量 `ACCESS_KEY` 。如何获取 ACCESS_KEY？答案在[这里](https://unsplash.com/developers)。

参考资料

- [functions/react-express-ssr.js](https://github.com/netlify-labs/netlify-functions-express/blob/master/functions/react-express-ssr.js)
- [unsplash/unsplash-js](https://github.com/unsplash/unsplash-js)
- Netlify build error log
- [Netlify functions docs](https://docs.netlify.com/functions/overview/)
- [functions.netlify.com](https://functions.netlify.com/)
- [Runtime.ImportModuleError Cannot find module - Support - Netlify Support Forums](https://answers.netlify.com/t/runtime-importmoduleerror-cannot-find-module/68307)
- [Modern, faster Netlify Functions: New bundler and JavaScript features](https://www.netlify.com/blog/2021/04/02/modern-faster-netlify-functions/)
