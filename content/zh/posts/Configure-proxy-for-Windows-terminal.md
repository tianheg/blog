---
title: 给Windows的终端配置代理
toc: true
date: 2020-04-03T22:34:17+08:00
categories: ["技术"]
tags: ["Win10"]
---
给 Win10 终端配置代理这个问题，以前遇到过几次，但都略过了。就连这篇文章都拖了很久。我把参考链接那篇文章总结下来，我觉得自己以后一定会用到。

命令和 **Linux** 下没什么区别。

```bash
set http_proxy=http://127.0.0.1:1080

set https_proxy=http://127.0.0.1:1080

set http_proxy_user=user
set http_proxy_pass=pass

set https_proxy_user=user
set https_proxy_pass=pass

# 恢复
set http_proxy=

set https_proxy=

# Ubuntu 下命令为 export
# export http_proxy=http://127.0.0.1:1080
```

</br>

### 要点

1. 一定要加 `http://`，直接写域名或者 IP 不行。
2. **http** 和 **https** 都要设置。

然后如果想验证是否成功配置了代理的话，用 `ping` 命令是不可以的

### ping 还是不行的原因

ping 的协议不是 http，也不是 https，是 ICMP 协议。

### 验证方式

使用 `curl -vv http://www.google.com` 验证，如果返回如下结果表示代理设置成功。

未完待续

---

参考链接：

给 Windows 的终端配置代理：[https://zcdll.github.io/2018/01/27/proxy-on-windows-terminal/](https://zcdll.github.io/2018/01/27/proxy-on-windows-terminal/)