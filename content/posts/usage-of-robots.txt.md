+++
date = '2020-05-17T10:33:48+08:00'
description = '记录 robots.txt 的用法'
tags = ['SEO']
title = '使用 robots.txt'

+++

## robots.txt 文件是什么

robots.txt 是一个简单的以 .txt 结尾的文本文件，是搜索引擎 Robot 程序抓取网页时要访问的第一个文件。

## robots.txt 文件有什么作用

通过 robots.txt 可以引导搜索引擎机器人抓取你推荐的网页，避免一些意义不大的无用网页，在一定程度上能够节约网站资源。另外，robots.txt 对 SEO 也有重要意义，可以很好地避免重复、相似网页，以及一些关键字权重流失。

## robots.txt 文件写法

1. 内容以 User-agent 开始，包含一行或多行 Disallow 或 Allow 记录；
2. 在 robots.txt 中可以用 “#” 进行注释

例子：

```txt
User-agent: *  # 对所有搜索引擎 Robot 开放
Disallow: /categories/ # 禁止访问 categories 目录下任何内容
```

### 关于 robots.txt 文件函数的说明

#### User-agent

该项的值用于描述搜索引擎 Robot 的名称，至少要有一条 User-agent 记录；如果 User-agent 的值为 `*`，则表示该协议对所有搜索引擎 Robot 都有效；在 robots.txt 文件中 `User-agent: *` 只能有一条，可以同时出现 `User-agent: Baiduspider` 和 `User-agent: Googlebot` 的情况。

**注**：常见搜索引擎蜘蛛 Robots 名称

```txt
Baiduspider http://www.baidu.com
ia_archiver http://www.alexa.com
Googlebot http://www.google.com
Scooter http://www.altavista.com
FAST-WebCrawler http://www.alltheweb.com
Slurp http://www.inktomi.com
MSNBOT http://search.msn.com
```

#### Disallow

该项的值用于描述不希望被 Robot 访问到的一个 URL，这个 URL 可以是一条完整的路径，也可以是部分的，任何以 Disallow 开头的 URL 均不会被 Robot 访问到；

注意“Disallow: /test”和“Disallow: /test/”的区别。

“Disallow: /test”表示可以禁止的 URL 包括：“/test、/testabc.html、/test/abc”这三种形式；

“Disallow: /test/”则允许 Robot 访问：“/test、/testabc.html”，禁止访问：“/test/abc”这种形式。

如果 Disallow 记录的值为空，即“Disallow:”格式，则说明该网站的所有内容可以被任何搜索引擎 Robot 抓取；在 robots.txt 文件，如果有声明 User-agent ，至少要有一条 Disallow 记录。

#### Allow

该项和 Disallow 对立，表示允许搜索引擎 Robot 访问指定内容。

### robots.txt 文件用法实例

1. 允许所有搜索引擎 Robot 访问

   ```txt
   User-agent: *
   Disallow:
   ```

   或者 robots.txt 文件为空，什么也不写，也能达到同样的效果。

2. 禁止所有搜索引擎 Robot 访问网站的任何内容

   ```txt
   User-agent: *
   Disallow: /
   ```

3. 禁止所有搜索引擎 Robot 访问网站的指定内容（如下例中的 aaa、bbb、ccc 目录）

   ```txt
   User-agent: *
   Disallow: /aaa/
   Disallow: /bbb/
   Disallow: /ccc/
   ```

4. 禁止指定搜索引擎 Robot 访问如下例中的 Google 机器人：Googlebot）

   ```txt
   User-agent: Googlebot
   Disallow: /
   ```

5. 只允许指定搜索引擎 Robot 访问（如下例中的百度机器人：Baiduspider）

   ```txt
   User-agent: Baiduspider
   Disallow:
   User-agent: *
   Disallow: /
   ```

---

**参考链接**：

1. [robots.txt 文件配置和使用方法详解](https://www.cnblogs.com/Gbeniot/p/4088980.html)
