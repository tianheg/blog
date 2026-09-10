---
title: 'JS 从回调函数中获取数据'
date: 2023-01-16T14:18:00+08:00
tags: ['技术', JavaScript]
---

最终 Node.js 代码：

```javascript
whois.lookup(process.env.DOMAIN, (error, data) => {
  async function main() {
    // ...

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `tianheg <${user}>`,
      to: `域名邮箱 <${to}>`, // list of receivers
      subject: `今日 ${year}-${month}-${day} 测试`, // Subject line
      text: data.slice(0, 936), // plain text body
    });

    // ...
  }
  main();
});
```

我想将通过 whois 查到的域名信息 data 作为邮件的文本发送出去。但怎么也不得其道。最开始我是这样写的：

```javascript
async function main() {
  // ...

  // get whois info
  let whoisInfo;

  whois.lookup(process.env.DOMAIN, function(err, data) {
    whoisInfo = data.slice(0, 936);
  });

  console.log(whoisInfo)

  // ...
}

main();
```

但是，怎么都得不到 whoisInfo，总是 undefined。我还找到一些讲异步编程的内容，但看得云里雾里。最终，我突然想到，能不能把主函数放到 whois.lookup 里面，于是就出现了开头的代码。刚好解决了我的需要。
