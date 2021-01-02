---
title: Hexo 本地渲染一切正常，传到 github 上 js,css404 更换主题无法解决
date: 2020-05-10T17:47:03+08:00
tags: ["Hexo"]
slug: Hexo local rendering everything is normal
---

这是因为 hexo 本地的 url 设置不正确，如果 GitHub 仓库名不是 username.github.io，而是 abc，那么在生成 Git Pages 生成的静态网址即为 `htttps://username.github.io/abc`。

如果没有更改位于 hexo 本地blog 根目录的 _config.yml 中的：

```yml
url: http://yoursite.com
root: /
```

就会出现标题错误，因为它引用资源的路径出错了。正确的配置为：

```yml
url: htttps://username.github.io/abc
root: /abc
```

这样就能够使用 GitHub 子目录进行部署了

参考：

码云Pages：<https://gitee.com/help/articles/4136#article-header1>
