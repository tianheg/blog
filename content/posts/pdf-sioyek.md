+++
title = "Sioyek - 跨平台 PDF 阅读软件"
author = ["Tianhe Gao"]
date = 2022-09-03T15:10:00+08:00
lastmod = 2022-09-03T18:31:52+08:00
tags = ["技术", "Software"]
draft = false
+++

生词介绍：

-   KDE（Kool Desktop Environment）：具有多个含义，在这里用作 KDE 社区开发的自由软件。
-   跨平台：可在 Windows, macOS and Linux 系统上使用。

我在最初使用 Ubuntu Linux 时，因为安装的是 Gnome（和 KDE 一样，是一种 Linux 桌面环境），所以使用的是 Gnome 社区开发的 PDF 软件——Evince；后来使用 Arch Linux 安装 KDE 桌面环境，用的是 KDE 社区开发的 Okular。

两三个月以前，我知道了 Sioyek，最初因为它宣传的是针对论文阅读，当然还有技术书籍，但我没太在意。带着这种淡淡的好奇，我安装使用。

![](/images/pdf-sioyek-0.png "Sioyek 教程第 1 页")
![](/images/pdf-sioyek-1.png "按下 t 键，打开目录")
![](/images/pdf-sioyek-2.png "按下 F8 键，切换到黑暗模式")

在使用一段时间后，我觉得使用它作为我的 PDF 阅读器。

下面介绍使用方法。


## 基础 {#基础}

-   小写 o 打开新文档，Shift + o 打开之前打开过的文档
-   上下箭头翻页
-   Ctrl + PageUp / Ctrl + PageDown 到前一页/下一页
-   Space / Shift + Space 到下一屏/上一屏（距离等于电脑显示器宽度的一半），也可以用 PageDown/PageUp
-   数字 0 旁边的 - 用于缩小，+ （按 Shift 和 = 得到）用于放大
-   F11 全屏
-   F10 放缩到文档宽度与屏幕宽度一致（忽略空白部分）
-   F9 放缩到文档宽度与屏幕宽度一致（包含空白部分）
-   F8 切换黑暗模式
-   按下两次字母 g 来到第一页，数字 + 两次 g 可以去往想去的页数；也可以按下 Home 键，输入想去的页码
-   按下 Shift + g（G） 或者 End 来到最后一页
-   按下 t 显示目录（如果有）
-   backspace 键回到上一次所在位置，Ctrl + 左右箭头在历史记录前后切换
-   当选中某些文本时，按下两次字母 s 在谷歌学术中搜索，s + l 在 library genesis 中搜索


## 搜索 {#搜索}

-   Ctrl + f 或者 / 用于搜索
-   n / Shift + n 搜索匹配下一个/前一个
-   通过 10 + n 跳到第 10 次匹配的文本


## 标记 {#标记}

-   按下字母 m 标记当前位置，在输入字母保存为 u
-   在其他位置，输入 `` `u `` 会跳到开始保存的位置
-   标记是永久的，即使关掉 Sioyek 也可存留。小写标记仅对当前文件有效，大写则对所有文件有效
-   m + 右键单击某个位置——会高亮当前区域的同时进行标记，这样回到该区域时就会出现高亮
-   还可通过 j 和 k 移动标记。通过 F7 开启 visual scroll 模式后，还可通过鼠标滚轮移动可视标记


## 书签 {#书签}

-   按下字母 b 在当前位置创建书签
-   gb 在当前文件搜索书签，gB 搜索所有文件的书签
-   删除书签，先到要删除的位置，按下 db 删除（这会删除最近的书签）
-   如果选中一片文字，按下字母 b，选中文本会被自动作为书签名字


## 高亮 {#高亮}

-   按下 hh 创建名为 h 的高亮
-   gh 在当前文件搜索高亮，gH 搜索所有高亮
-   删除高亮：点击高亮文本，按下 dh


## 智能跳跃 {#智能跳跃}

-   如果文章段落中有对图片和文献的引用，中键（鼠标滚轮）点击段落中的引用数字，就可跳到对应的图片或参考文献
-   中键点击文献名字，可以在谷歌学术中搜索，Shift + 中键 可在 library genesis 中搜索
-   右键单击段落中的文献引用数字，可以预览参考文献里的样子


## 传送门（Portals） {#传送门-portals}

-   按 F12 打开帮助窗口
-   按下 p 选定传送门起点，选定当前文档/其他文档中的某一位置或参考文献链接按下 p，一个传送门就创建好了，按下 F12 就可以查看了
-   dp 删除最近的传送门
-   P 修改传送门，然后按下 backspace 回到原来位置


## 配置 {#配置}

-   有四个文件，两个用户不能修改（keys.config 和 prefs.config），另两个可修改（keys_user.config, prefs_user.config）
-   修改配置以前要备份，如果你在 MacOS、Linux 环境下，在命令行环境下输入 `cp file{,.bak}` 就在当前目录下创建了该文件的备份
-   默认没有 \*_user 配置文件，所以要先复制默认的两个文件，然后修改
-   按下 Shift + ;（:）输入 prefs，点击，默认的编辑器会打开 prefs.config 文件（Linux 的文件位置在 `/etc/sioyek` ）


## Synctex {#synctex}

最后一个可以查看文本对应的 LaTex 版本（我的推测），目前不感兴趣。在线文本在[这里](https://sioyek-documentation.readthedocs.io/en/latest/usage.html#synctex)。

参考资料：

1.  [官方文档](https://sioyek-documentation.readthedocs.io/en/latest/index.html)
2.  [Using Language Models to (probably) Read Faster](https://ahrm.github.io/jekyll/update/2022/04/14/using-languge-models-to-read-faster.html)