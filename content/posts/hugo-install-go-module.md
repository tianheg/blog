---
title: 'Hugo 安装 Go 模块'
date: 2023-05-31T07:51:00+08:00
tags: ['技术', Hugo]
---

梳理如何为 Hugo 安装 Go 模块

---

```bash
hugo mod init github.com/tianheg/blog
# add below content to config.toml/hugo.toml
```

```toml
[module]
[[module.imports]]
path = "github.com/gohugoio/hugo-mod-bootstrap-scss/v5"
```
