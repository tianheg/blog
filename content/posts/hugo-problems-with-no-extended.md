+++
date = '2020-05-10T17:51:21+08:00'
description = '记录 Hugo 没有安装扩展版产生的问题'
keywords = ['Hugo']
tags = ['Hugo']
title = 'Hugo 没有安装扩展版产生的问题'

+++

如果没有安装 Hugo 扩展版，在执行 `hugo server` 命令时，会报如下错误：

```markdown
Building sites … Total in 303 ms
Error: Error building site: TOCSS: failed to transform "zh/styles/ma
in-rendered.scss" (text/x-scss): resource "scss/scss/main.scss_a059ebc49e8302e6cfbf0e02020b9d85" not found in file cache
```

解决办法：

下载 [Hugo 扩展版](https://github.com/gohugoio/hugo/releases)。在 releases 中，有形如 `hugo_extended_0.70.0_Windows-64bit.zip` 的，即为扩展版本
