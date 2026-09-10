---
title: '重定向通过 Vercel 部署的网站'
date: 2022-11-14T21:52:00+08:00
tags: ['技术']
---

vercel.json:

```json
    {
      "redirects": [
          { "source": "/life", "destination": "/life/" },
          { "source": "/tech", "destination": "/tech/" }
      ]
    }
```
