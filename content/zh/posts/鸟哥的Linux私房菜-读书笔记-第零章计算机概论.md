---
title: 鸟哥的Linux私房菜-第零章计算机概论
date: 2020-05-12T17:55:02+08:00
categories: ["技术"]
series: ["读书笔记"]
slug: Bird Linux 0 introduction to computer
keywords: ["Linux","computer"]
description: "人与人学习方式有很大差异，这取决于每个人的成长环境，我原想按照目录的结构设计学习这本 Linux 书。现在发现，这样学习没有趣味。我理解的学习应该是充满趣味的、成就满满的，而不是枯燥乏味的。"
---

## CPU 的种类

CPU 内部含有一些指令集，我们所使用的软件都要经过 CPU 内部的微指令集进行处理运行。这些指令集有两种设计理念，而这也是常见的 CPU 的种类：精简指令集(RSIC)与复杂指令集(CISC)。

### 精简指令集(Reduced Instruction Set Computer, RISC)

单个指令的运行时间很短，完成的任务很简单，指令的执行效能较佳；若是要做复杂的事情，就要由多个指令来完成。

### 复杂指令集(Complex Instruction Set Computer, CISC)

CISC 在微指令集的每一个小指令可以执行一些较低阶的硬件操作，指令数目多且复杂，每条指令的长度并不相同。因为指令执行较为复杂，所以每条指令花费的时间较长，但每条个别指令可以处理的工作较为丰富。