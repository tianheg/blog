---
title: '导出网易云歌单，生成网页'
date: 2023-02-26T21:22:00+08:00
tags: ['技术']
---

完成的结果：[我的歌单](/listen)

1. 获取 likelist.json
2. 生成 content/listen.org

## 一、获取 likelist.json

使用 GitHub 仓库 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) 提供的 API——获取歌单所有歌曲：

> 接口地址： `/playlist/track/all`
>
> 调用例子： =/playlist/track/all?id=24381616=

id 后的数字是歌单的 id。在浏览器输入 `https://music.163.com` ，登录后进入“个人主页”，在“我创建的歌单”下会有“XX喜欢的音乐”，点击后地址栏是这样的： =https://music.163.com/#/playlist?id=967686417= 。最后的这串数字，就是上面调用例子中需要的数字。

按照文档部署运行在本地后，要先二维码登录，然后才能获取到列表；否则，会提示操作过于频繁之类的话语。我本想部署在在线平台——Vercel 或者腾讯云 Serverless。最后都不能像在本地一样正常工作。[http://localhost:3000/playlist/track/all?id=967686417](http://localhost:3000/playlist/track/all?id=967686417) 是我要请求的本地地址，一切正常的话，页面会出现类 JSON 数据，保存到本地就是 likelist.json。

我打算，每隔一段时间，手动获取一次列表。
## 二、生成 content/listen.org

我通过 [phind](https://phind.com/)（为开发者服务的 AI 搜索引擎），知道可以用 [ejs](https://ejs.co/) 这样的模板语言，将类 JSON 数据转为 HTML 网页。

实现代码：

```javascript
/// music.js
const fs = require('fs')
const ejs = require('ejs')

// http://localhost:3000/playlist/track/all?id=967686417
// 获取我喜欢歌单全部歌曲详情
let songs = []
fs.readFile('./scripts/likelist.json', 'utf8', (err, data) => {
  if (err) console.log(err)
  const jsonData = JSON.parse(data)
  songs = jsonData.songs.map(song => {
    if (song.ar.length == 2) {
      return {
        name: song.name,
        artists: `${song.ar[0].name}, ${song.ar[1].name}`
      }
    }
    if (song.ar.length == 3) {
      return {
        name: song.name,
        artists: `${song.ar[0].name}, ${song.ar[1].name}, ${song.ar[2].name}`
      }
    }
    return {
      name: song.name,
      artists: song.ar[0].name
    }
  })
  // console.log(songs)
  ejs.renderFile('./scripts/template.ejs', { songs }, { "rmWhitespace": true }, function (err, org) {
    if (err) throw err;
    fs.writeFile('./content/music.org', org, function (err) {
      if (err) throw err;
      console.log('Org-mode file generated!');
    });
  });
})
```

```ejs
/// template.ejs
#+TITLE: 我的歌单

<% for(let i=0; i<songs.length; i++) { %>
- <%= songs[i].name %> - <%= songs[i].artists -%>
<% } %>
```
