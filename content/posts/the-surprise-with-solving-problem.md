+++
title = "解决问题的路上永远都伴随着意外和惊喜"
date = 2021-07-20T00:00:00+08:00
lastmod = 2022-02-16T10:54:31+08:00
tags = ["技术"]
draft = false
+++

解决问题的路上永远都伴随着意外和惊喜。在我的 Cloudflare 账户能够使用 Web Analytics 后，就开始用它了。界面没有 Google Analytics 那么复杂，部署很方便。

很长时间以来，我都通过 Wappalyzer 这个 Chrome 扩展看到我的网站同时使用了以上两种浏览量统计工具。

我觉得很奇怪：我的代码里已经没有 Google Analytics 相关的内容了，为什么还会提示已经使用呢？

于是我搜索了一番，在 Cloudflare 社区找到一个问答，里面提到了 Cloudflare App。我没有在意。

我把所有其他可能性排除后，决定仔细查看 Cloudflare 的每一个设置，当我查看到 App 时，我惊讶地发现：我居然安装了 Google Analytics！而且 track ID 和我在 Console 里看到的一样。这个 App 是一年前安装的，因为时间太过久远，所以就忘记卸载了。

于是，我确定这是问题所在。于是卸载了这个 Cloudflare app。

---

图一是博客的 console 显示的和 Google Analytics 有关的内容；图二则是个人主页下的 Google Analytics 的文件路径，可以清楚的看到 cdn-cgi（这是 Cloudflare 存放各种文件的虚拟路径）下的 App 里的 Google Analytics。

![](https://static-1258637336.cos.ap-shanghai.myqcloud.com/cf-ga-0.png)

![](https://static-1258637336.cos.ap-shanghai.myqcloud.com/cf-ga-1.png)

ref:

1.  [Added cdn-cgi script on my pages](https://community.cloudflare.com/t/added-cdn-cgi-script-on-my-pages/3342)
