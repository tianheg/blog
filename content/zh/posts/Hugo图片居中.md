---
title: Hugo图片居中
date: 2020-05-10T17:49:41+08:00
categories: ["技术"]
series: ["Hugo"]
slug: Hugo center picture
keywords: ["Hugo","center","picture"]
description: ""
---

一般插入图片使用这样的格式： `![]()`

但是，这样无法控制图片的大小和位置，所以需要使用 HTML 的语法来改变图片的样式，如下面的样式所示：

```html
<div align=center>  <!-- 可选的项：right，left，center -->
	<img src="url" width="" height="">  <!-- src处填写路径（本地或网络） width 和 height 就是控制图片的大小的-->
</div>
```

