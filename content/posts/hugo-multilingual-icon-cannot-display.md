+++
date = '2020-05-10T17:58:56+08:00'
description = '记录 Hugo 移动端不能正常显示多语言图标'
keywords = ['Hugo']
tags = ['Hugo']
title = 'Hugo 移动端不能正常显示多语言图标'

+++

在系统浏览器可以显示语言切换，在 Chrome 却不行。一个人 @[he-sb](https://github.com/he-sb) 也使用 [Hugo-theme-meme](https://github.com/reuixiy/hugo-theme-meme) 。Ta 告诉我，可以编辑一下这个配置 [navHeight](https://github.com/reuixiy/hugo-theme-meme/blob/master/config-examples/en/config.toml#L262) ，把调高一些，我试验了之后，果然好了。

详情看这个 [issue](https://github.com/reuixiy/hugo-theme-meme/issues/128)
