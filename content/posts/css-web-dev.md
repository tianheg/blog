+++
title = "学习《web.dev CSS 教程》"
date = 2022-02-20T00:00:00+08:00
lastmod = 2022-02-20T20:14:12+08:00
tags = ["技术", "CSS"]
draft = false
+++

<https://web.dev/learn/css/>


## Box Model 盒子模型 {#box-model-盒子模型}

> 盒子模型是 CSS 的核心。


### 内容和大小 {#内容和大小}

`display` 的值不同，盒子的状态不同。盒子中有更多内容，比如更多盒子。这些盒子由子元素或纯文本生成。即使没有子元素，内容本身就会改变盒子的大小。

自定义盒子大小 extrinsic sizing vs 使用浏览器默认大小 intrinsic sizing

当内容太多，以至于盒子无法放下时，就会出现溢出。要处理这种情况就要用到 `overflow` 属性。


### 盒子模型是如何划分区域的 {#盒子模型是如何划分区域的}

![](/web-dev-css-box-model-1.svg "from https://web.dev/learn/css/box-model/")