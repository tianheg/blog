+++
title = "安装 intltool"
date = 2021-06-12T10:13:20+08:00
tags = ["Geany", "源码编译", "排错"]
slug = "missing-intltool"
+++

遇到一款想尝试的文本编辑器——[Geany](https://www.geany.org/)，我使用 Ubuntu20.04，官方没有制作好的 deb 文件，所以需要自己下载源码进行编译。

在第一步 `./configure` 提示缺少 `intltool`，查阅资料发现可以通过 `sudo apt-get install intltool` 安装，但 apt 中没有这一工具包。所以，我找到 `intltool` 的源码，对它进行编译。因此，Geany 源码编译的第一步成功执行。
