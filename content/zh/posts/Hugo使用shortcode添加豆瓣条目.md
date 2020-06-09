---
title: Hugo 使用 shortcode 添加豆瓣条目
date: 2020-06-09T07:45:38+08:00
categories: ["技术"]
tech: ["Hugo"]
plantuml: true
slug: Hugo use shortcode add douban
---

{{< douban 26862829 >}}

{{< douban 9787532132263 >}}

暂时无法实现

url:baseUrl+'/v2/movie/top250'  
//https://douban.uieee.com/v2/movie/top250

methods:'get'
请求参数：
params:{
    start:1, //开始
    count:10,//一页展示多少条
}

```
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
Alice -> Bob: Another authentication Request
Alice <-- Bob: Another authentication Response
@enduml
```

---

[文章内显示豆瓣条目](https://immmmm.com/post-show-douban-item/)
[豆瓣看过的电影](https://mufeng.me/post/have-seen-the-film)

---

参考链接：

[https://www.xianmin.org/post/hugo-shortcode-douban-item/](https://www.xianmin.org/post/hugo-shortcode-douban-item/)

