+++
date = '2021-07-31T11:51:41+08:00'
slug = 'fix-dns-probe-finished-nxdomain'
tags = ['Computer Network']
title = '解决 DNS_PROBE_FINISHED_NXDOMAIN'
+++

如果 DNS 解析域名/地址失败，就会得到 `DNS_PROBE_FINISHED_NXDOMAIN` 提示，无法打开目标网页。

DNS 是域名系统，它是连接域名（URL）和服务器 IP 地址是桥梁。probe 是调查/探查的意思，NXDOMAIN 则表示 non-existent domain，域名不存在。因为，提示的意思是：DNS 探查域名完成，当前域名不存在。

但实际上，域名是存在的。所以，哪里出问题了？

以下是从网络中找到的 8 种解决该问题的办法：

- 释放并更新 IP 地址
- 重启 DNS 客户端服务
- 改变 DNS 服务器
- 重置 Chrome Flags
- 暂时关闭 VPN 和杀毒软件
- 检查本地 hosts 文件
- 检查域名 DNS
- 重启电脑

**我的电脑系统是 Ubuntu20.04.1，以下所有操作都在此系统进行**。

## 释放并更新 IP 地址

```sh
sudo dhclient -r # 释放
sudo dhclient # 更新
```

但是执行 `sudo dhclient` 报错：`RTNETLINK answers: Operation not possible due to RF-kill`，通过[这里](https://bbs.archlinux.org/viewtopic.php?pid=1322377#p1322377)得到一个操作 `rfkill unblock all`。再执行 `sudo dhclient` 不报错了，输出：`RTNETLINK answers: File exists`。文件已存在的话，重新执行即可。

我又执行了一遍代码片段的内容：

```sh
$ sudo dhclient -r
Killed old client process
$ sudo dhclient
```

OK，更新 IP 没有输出，说明正常执行。

## 重启 DNS 客户端服务

```sh
sudo apt install bind9
sudo apt install dnsutils
sudo vim /etc/bind/named.conf.options # add nameservers:8.8.8.8;8.8.4.4;1.1.1.1 to forwarders
sudo systemctl restart bind9.service # open bind9 service
service bind9 status # check bind9 status
```

然后，如果我执行 `sudo service bind9 restart` 就说明 DNS 客户端已被重启。

## 改变 DNS 服务器

在 Ubuntu 有两种修改方式，一种通过 GUI（图形化界面），一种通过 Ubuntu20.04 预装的 netplan 软件。我使用后者，因为它在命令行操作，很方便。

```sh
$ ls -a /etc/netplan
.  ..  01-network-manager-all.yaml
```

查看 01-network-manager-all.yaml 文件，发现还没有进行任何配置：

```yaml
network:
  version: 2
  renderer: NetworkManager
```

它的意思是：让 NetworkManager 接管所有网络设置（默认情况下，一旦检测到运营商，任何以太网设备都将提供 DHCP），NetworkManager 就是 Ubuntu 网络管理的默认 GUI。

根据参考写一个新的能更新 nameserver 的 01-network-manager-all.yaml 文件：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp2s0:
      dhcp4: true
      nameservers:
        addresses:
        - 8.8.8.8
        - 8.8.4.4
```

使用 networkd 作为渲染器不会让设备使用 DHCP 自动出现; 每个接口都需要在 `/etc/netplan` 中的文件中指定，以便编写其配置并在 networkd 中使用。

## 重置 Chrome flags

在 Google Chrome 浏览器中的地址栏输入 `chrome://flags/` 点击右上方的 `Reset all` 即可。这样做是因为 Chrome 会时不时释出一些实验性功能，这些实验性功能可能回使原本正常的 DNS 解析受到影响。

## 暂时关闭 VPN 或杀毒软件

这是因为 VPN 会改变电脑的网络环境，由此会产生诸多问题。杀毒软件会对网络进行严格监控，它会控制进出口流量，甄别可能会对主机/网络产生消极影响的流量。

## 检查本地 hosts 文件

```sh
vim /etc/hosts
```

如果你要修改，就要在 root 下执行：`sudo vim /etc/hosts`。

## 重启电脑

这是最后的万全之策。很多问题可以通过重启解决，这一个也可能不会例外。

ref:

1. <https://support.google.com/chrome/thread/6144098/dns-probe-finished-nxdomain?hl=en&msgid=13374613>
2. <https://kinsta.com/knowledgebase/dns_probe_finished_nxdomain/>
3. <https://www.cyberciti.biz/faq/howto-linux-renew-dhcp-client-ip-address/>
4. <https://ubuntu.com/server/docs/service-domain-name-service-dns>
5. <https://www.cyberciti.biz/faq/restart-named-service-ubuntu-debuan-linux/>
6. <https://netplan.io/>
