+++
title = "用 Puppeteer 下载网页 pdf 版本"
date = 2021-12-10T00:00:00+08:00
lastmod = 2022-02-16T15:36:15+08:00
tags = ["技术"]
draft = false
+++

```sh
mkdir play_puppeteer && cd $_
yarn add puppeteer
emacs main.js
node main.js
```

`main.js` ：

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.baidu.com/', {
    waitUntil: 'networkidle2',
  });
  await page.pdf({ path: 'baidu.pdf', format: 'a4' });

  await browser.close();
})();
```