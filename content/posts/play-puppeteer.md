---
title: '用 Puppeteer 下载网页 pdf 版本'
date: 2021-12-10
tags: ['技术']
---

```bash
    mkdir play_puppeteer && cd $_
    yarn add puppeteer
    emacs main.js
    node main.js
```

`main.js` ：

```
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
