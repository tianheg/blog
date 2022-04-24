+++
title = "C 语言中 printf 与 puts 的区别"
date = 2021-12-15T00:00:00+08:00
lastmod = 2022-04-22T15:12:59+08:00
tags = ["技术", "C"]
draft = false
+++

<https://pediaa.com/what-is-the-difference-between-printf-and-puts/>

`printf` 是一个 C 函数用于打印一个格式化的字符串到标准输出流，也就是计算机屏幕；

与之对应的 `puts` 则是一个 C 标准库函数，用于将一个字符串写入计算机屏幕。

`printf` 在输出时默认不换行，所以要在输出的内容最后添加 `\n` 换行符；

`puts` 则默认换行。
