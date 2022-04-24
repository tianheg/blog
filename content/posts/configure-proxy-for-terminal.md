+++
title = "为终端配置代理"
date = 2020-04-03T00:00:00+08:00
lastmod = 2022-04-22T18:08:10+08:00
tags = ["技术", "CLI"]
draft = false
+++

## Zshrc {#zshrc}

```sh
export http_proxy=http://127.0.0.1:1080
export https_proxy=http://127.0.0.1:1080

export http_proxy_user=user
export http_proxy_pass=pass

export https_proxy_user=user
export https_proxy_pass=pass
```
