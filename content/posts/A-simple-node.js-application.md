---
title: "一个 Node.js 简单应用"
date: 2020-04-03T17:52:09+08:00
description: "记录一个 Node.js 的简单应用"
tags: ["Node.js"]
keywords: ["Node.js"]
---

一个 Node.js 应用由哪几部分组成：

- 引入 required 模块：我们可以使用 require 指令来载入 Node.js 模块
- 创建服务器：服务器可以监听客户端的请求
- 接收请求与响应请求：服务器很容易创建，客户端可以使用浏览器或终端发送 HTTP 请求，服务器接收请求后返回响应数据。

下面开始创建 Node.js 应用：

（1）引入 require 模块

我们使用 require 指令来载入 http 模块，并将实例化的 http 赋值给变量 http，实例如下：

```js
var http = require("http");
```

（2）创建服务器

接下来我们使用 `http.creatServer()` 方法创建服务器，并使用 `listen()` 方法绑定 8080 端口。函数通过 request，response 参数来接收和响应数据。实例如下：

```js
var http = require('http');

http.createServer(function (request, response){
    //发送HTTP头部
    //HTTP状态值：200：OK
    //内容类型：text/plain
    response.writeHead(200, {'Content-Type': 'text/plain'});
    
    //发送响应数据“Hello World”
    response.end('Hello World\n');
}).listen(8080);

//终端打印如下信息
console.log('Server running at http://127.0.0.1:8080/');
```

注：该 `server.js` 文件以括号（`{}`、`()`）进行分块，直观上的美观与否并不影响程序运行（已测试）。

使用 Node 命令执行以上代码，结果如下：

```sh
$ node server.js
Server running at http://127.0.0.1:8080/
```

在浏览器地址栏键入：`http://127.0.0.1:8080/`或`http://localhost:8080/`。

即可看到结果：`Hello World`。

**注记**：

通过这一笔记，我还是不太明白 Node.js 的应用，暂时记录下来，等到我再次学习它的应用时，应该能有熟悉感。

---

**参考资料**：

1. <https://blog.csdn.net/sinat_20177327/article/details/76152471>
