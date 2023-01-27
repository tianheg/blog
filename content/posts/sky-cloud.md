+++
title = "Draw Sky, Cloud"
date = 2021-12-04T00:00:00+08:00
lastmod = 2022-02-16T15:02:56+08:00
tags = ["技术"]
draft = false
+++

<https://css-tricks.com/drawing-realistic-clouds-with-svg-and-css/>

主要使用了 SVG。它是基于 XML 的标记语言，用来描绘二维向量图形。下面会列出本次练习使用的元素或属性，并解释作用。

- svg 一个容器，用于定义新的坐标系和视图
- filter 通过对原始图形进行原子级别的分组，来自定义过滤效果
- feTurbulence 使用 Perlin 湍流函数生成图像，可以合成云或大理石
- type 通用属性，基于不同元素表达不同含义
  - 对于 feTurbulence 来说，它指示滤波器应该执行噪声还是湍流函数，type 的值：fractalNoise | turbulence
- baseFrequency 表示 feTurbulence 噪声函数的基准频率
- numOctaves 定义了噪声函数的八度数
- seed 表示伪随机数生成器的起始数
- feDisplacementMap The &lt;feDisplacementMap&gt; SVG filter primitive uses the pixel values from the image from in2 to spatially displace the image from in（完全不理解这句的含义）
- in 标识输入
- scale 定义了位移缩放因子
