+++
title = "Arch Linux 字体配置"
author = ["Tianhe Gao"]
date = 2022-09-06T08:37:00+08:00
lastmod = 2022-09-06T09:48:12+08:00
tags = ["技术", "Arch Linux"]
draft = false
+++

文章基于《[Arch Linux 软件安装和用法](/posts/arch-software-installation-and-usage/)》的字体一节进行扩展。


## 字体概念相关 {#字体概念相关}


### 什么是 Stylistic Sets？ {#什么是-stylistic-sets}

<https://www.typography.com/faq/157>

Stylistic sets 是一种特性，让使用字体的可选字符变得更简单。而不是让用户手动控制字体的字符变换。

对于 Web 字体，可通过 CSS 中的 [font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings) 开启 stylistic set。

```css
.fancystyle {
  font-family: Gabriola;
  font-feature-settings: "ss07";
}
```


### OpenType {#opentype}

<https://en.wikipedia.org/wiki/OpenType>

OpenType 是可伸缩计算机字体的格式。基于 TrueType 构建。由 Microsoft 和 Adobe 开发。


### TrueType {#truetype}

<https://en.wikipedia.org/wiki/TrueType>

TrueType 是苹果在 20 世纪 80 年代末开发的一种大纲字体标准，与 PostScript 中使用的 Adobe Type 1 字体形成竞争。


### Typography {#typography}

<https://en.wikipedia.org/wiki/Typography>

字体设计是一种排字的艺术和技术，它使书面语言在显示时变得清晰、可读和吸引人。


### Web Open Font Format {#web-open-font-format}

<https://en.wikipedia.org/wiki/Web_Open_Font_Format>

网页开放字体格式（WOFF）是一种用于网页的字体格式。WOFF 文件是 OpenType 或 TrueType 字体，应用了特定于格式的压缩，并添加了额外的 XML 元数据。这两个主要目标首先是区分打算用作 web 字体的字体文件和打算通过本地安装在桌面应用程序中使用的字体文件，其次是当字体通过网络连接从服务器传输到客户端时减少 web 字体延迟。


### FreeType {#freetype}

<https://en.wikipedia.org/wiki/FreeType>

FreeType 是一个流行的软件开发库，用于将文本呈现到位图上，并支持其他与字体相关的操作。


### HarfBuzz {#harfbuzz}

<https://en.wikipedia.org/wiki/HarfBuzz>

HarfBuzz 是一个用于文本整形的软件开发库，它是将 Unicode 文本转换为字形索引和位置的过程。