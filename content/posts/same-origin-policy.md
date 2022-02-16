+++
title = "同源策略"
date = 2021-12-12T00:00:00+08:00
lastmod = 2022-02-16T15:13:58+08:00
tags = ["技术", "Web"]
draft = false
+++

1.  <https://www.anquanke.com/post/id/86078>
2.  <https://lightless.me/archives/review-SOP.html>
3.  [Same-origin policy - MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)


## 什么是源和同源策略 {#什么是源和同源策略}

源就是主机、协议和端口名的一个三元组。

同源策略是一个重要的安全机制，它能约束由一个源加载的文档或脚本和其他源交互的机会。这种机制帮助隔离了含有潜在病毒的文档或脚本。


## 可继承的源 {#可继承的源}

从 `about:blank` 或 `javascript: URL` 执行的脚本继承了包含 URL 的文档源，因为这些 URLs 没有源服务器的信息。