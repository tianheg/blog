---
title: '通过 Cloudflare Worker 生成特定域名的全部 CNAME DNS 记录网页'
date: 2023-05-03T10:31:00+08:00
tags: ['技术']
---

通过 Cloudflare 的 Worker 和 API，得到域名 `tianheg.org` 全部 CNAME DNS 记录，并生成网页。

---

最终页面：[tianheg.org](https://tianheg.org/)，代码：[tianheg/cloudflare-domain-cname](https://github.com/tianheg/cloudflare-domain-cname)

我前后进行了几次发布（publish），其中有一次我发现自己把通过 API 获得的全部信息都暴露到网页的 &lt;script&gt; 标签下，这样做不安全。错误代码：

```javascript
const end_point = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/?type=cname`;
const response = await fetch(end_point, {
  headers: {
    'X-Auth-Email': AUTH_EMAIL,
    'Authorization': `Bearer ${AUTH_KEY}`,
    'Content-Type': 'application/json',
  },
});

const results = await response.json();
const records = results.result;

const html = records => `
  <script>
    window.projects = ${JSON.stringify(records)}
  </script>
`
```

修改后的代码：

```javascript
const end_point = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/?type=cname`;
const response = await fetch(end_point, {
  headers: {
    'X-Auth-Email': AUTH_EMAIL,
    'Authorization': `Bearer ${AUTH_KEY}`,
    'Content-Type': 'application/json',
  },
});

const results = await response.json();
const records = results.result;

const domainList = records
  .map(
    (project) =>
      `<li><a href="https://${project.name}" target="_blank">${project.name}</a></li>`
  )
  .join('');
```
