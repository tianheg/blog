+++
date = '2020-05-12T17:55:02+08:00'
description = '读《鸟哥的 Linux 私房菜》记的笔记'
keywords = ['阅读']
tags = ['阅读']
title = '鸟哥《鸟哥的 Linux 私房菜》'
+++

## CPU 的种类

CPU 内部含有一些指令集，我们所使用的软件都要经过 CPU 内部的微指令集进行处理运行。这些指令集有两种设计理念，而这也是常见的 CPU 的种类：精简指令集(RSIC)与复杂指令集(CISC)。

### 精简指令集(Reduced Instruction Set Computer, RISC)

单个指令的运行时间很短，完成的任务很简单，指令的执行效能较佳；若是要做复杂的事情，就要由多个指令来完成。

### 复杂指令集(Complex Instruction Set Computer, CISC)

CISC 在微指令集的每一个小指令可以执行一些较低阶的硬件操作，指令数目多且复杂，每条指令的长度并不相同。因为指令执行较为复杂，所以每条指令花费的时间较长，但每条个别指令可以处理的工作较为丰富。

---

知乎提问：

- [Intel 和 AMD 与 x86， ARM， MIPS 有什么区别](https://www.zhihu.com/question/63627218)

先说 AMD 和 Intel：

Intel 和 AMD 是两家公司。一开始，Intel 先自己研发出 x86 架构，后来，AMD 也拿到了 x86 架构的授权。此时，Intel 向 64 位过渡，研发出 ia64(64 架构)，但是因为和 x86 架构不兼容导致市场反应极差。AMD 率先研发出 x86 的 64 位兼容(32 和 64 位的混合架构)，也就是后来的 x86_64，后来 Intel 也拿到了 x86_64 的生产授权（这两家专利交叉很严重）。但是因为是 AMD 率先研发，所以，x86_64 也叫 amd64。

目前，AMD 和 Intel 是世界上最大的两家 x86 和 x86_64 的 CPU 厂家（其中，Intel 占了 3/4 的市场份额）。

再说 x86，ARM 和 MIPS：

CPU 有两种：CISC 和 RISC。

x86 目前泛指：x86 和 x86_64。早期的 x86 是 CISC 的代表，后来的发展中逐渐引入了 RISC 的部分理念，将内部指令的实现大量模块化，准确来说是一个 CISC 外加 RISC 部分技术的架构。

目前 x86 的主要产品有 Intel 的至强、酷睿，奔腾、赛扬和凌动，AMD 的锐龙，APU 等。上文提到的纯 x64 架构目前只有 Intel 的安腾且已经放弃产品线。

到目前为止，Intel 和 AMD 的 x86 架构 CPU 虽然在指令集上有很大差别了，但还是相互兼容的，所以软件可以运行在这两家生产的相同架构的 CPU 上。

ARM 是 RISC 的典型代表，不过在 ARM 的发展过程中引入了部分复杂指令（完全没有复杂指令的话，操作系统运行困难），所以 ARM 是一个 RISC 基础外加 CISC 技术的 CPU。ARM 的主要专利技术在 ARM 公司手中。

MIPS 是另一个典型的 RISC 类处理器。它是一个学院派 CPU，授权门槛极低，因此很多厂家都在做 MIPS 或者 MIPS 衍生架构。我们平时接触到的 MIPS 架构 CPU 主要用在嵌入式领域，比如路由器。

目前最活跃的 MIPS 是中国的龙芯，其 loongisa 架构其实是 MIPS 的扩展。

目期无论 MIPS 还是 ARM，性能和主流 x86 差距都很大，不过 ARM 好在便宜低功耗，MIPS 的纯计算能力很强。

该知乎问题于 2017-08-09 回答，其中有些内容可能已经过时。

---

**参考链接**：

1. [Intel 和 AMD 与 x86， ARM， MIPS 有什么区别？](https://www.zhihu.com/question/63627218)