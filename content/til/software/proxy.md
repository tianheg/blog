---
title: Proxy
status: draft
date: 2025-06-15T19:22:54+08:00
header: DevOps
---

### Concept
#### PAC(proxy auto-config)
<https://en.wikipedia.org/wiki/Proxy_auto-config> 根据给定访问地址，自动选择代理服务器

### Set up a proxy for these software
#### Shell
```bash
export http_proxy=http://127.0.0.1:1080
export https_proxy=http://127.0.0.1:1080

export http_proxy_user=user
export http_proxy_pass=pass

export https_proxy_user=user
export https_proxy_pass=pass
```

#### pip
=~/.config/pip/pip.conf=

```
[global]
proxy=http://localhost:1087
```

注意不支持socks5

refer <https://pip.pypa.io/en/stable/user_guide/#using-a-proxy-server>

#### Git
1. Clone with ssh

   在文件 =~/.ssh/config= 后添加下面两行：

```bash
   Host github.com
   # Mac下
   ProxyCommand nc -X 5 -x 127.0.0.1:1080 %h %p
   # Linux下
   ProxyCommand nc --proxy-type socks5 --proxy 127.0.0.1:1080 %h %p
```

   注意 Linux 和 Mac 下 ncat/netcat 区别，详见 <https://unix.stackexchange.com/q/368155>

2. Clone with http

```bash
   git config --global http.proxy http://127.0.0.1:1087
```

   建议使用 http，因为 Socks5 在使用 git-lfs 时会报错 `proxyconnect tcp: dial tcp: lookup socks5: no such host`

   refer <https://gist.github.com/laispace/666dd7b27e9116faece6>

#### cargo
Cargo 会依次检查以下位置

1. 环境变量 `CARGO_HTTP_PROXY`

```bash
export CARGO_HTTP_PROXY=http://127.0.0.1:1080
```

1. [任意 config.toml](https://doc.rust-lang.org/cargo/reference/config.html#hierarchical-structure) 中的 `http.proxy`

```bash
[http]
proxy = "127.0.0.1:1080"
```

1. 环境变量 `HTTPS_PROXY` & `https_proxy` & `http_proxy`

```bash
export https_proxy=http://127.0.0.1:1080
export http_proxy=http://127.0.0.1:1080
```

`http_proxy` 一般来讲没必要，除非使用基于 HTTP 的 Crate Repository

Cargo 使用 libcurl，故可接受任何符合 [libcurl format](https://everything.curl.dev/usingcurl/proxies) 的地址与协议

( `127.0.0.1:1080` , `http://127.0.0.1:1080` , `socks5://127.0.0.1:1080` ）均可

refer <https://doc.rust-lang.org/cargo/reference/config.html#httpproxy>

#### apt (apt-get)
在 `/etc/apt/apt.conf.d/` 目录下新增 `proxy.conf` 文件，加入：

```
Acquire::http::Proxy "http://127.0.0.1:8080/";
Acquire::https::Proxy "http://127.0.0.1:8080/";
```

注：无法使用 Socks5 代理。

refer <https://askubuntu.com/a/349765/883355>

#### curl
```bash
socks5 = "127.0.0.1:1080"
```

add to =~/.curlrc=

refer <https://www.zhihu.com/question/31360766>

#### Gradle
=~/.gradle/gradle.properties= ：

```
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=1087
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=1087
```

refer <https://stackoverflow.com/q/5991194/12539782>

#### Maven
`%Maven 安装目录%/conf/settings.xml` ：

```
<!-- proxies
 | This is a list of proxies which can be used on this machine to connect to the network.
 | Unless otherwise specified (by system property or command-line switch), the first proxy
 | specification in this list marked as active will be used.
 |-->
<proxies>
  <!-- proxy
   | Specification for one proxy, to be used in connecting to the network.
   |
  <proxy>
    <id>optional</id>
    <active>true</active>
    <protocol>http</protocol>
    <username>proxyuser</username>
    <password>proxypass</password>
    <host>proxy.host.net</host>
    <port>80</port>
    <nonProxyHosts>local.net|some.host.com</nonProxyHosts>
  </proxy>
  -->
   <proxy>
    <id>proxy</id>
    <active>true</active>
    <protocol>http</protocol>
    <host>127.0.0.1</host>
    <port>1087</port>
  </proxy>
</proxies>
```

refer <https://maven.apache.org/guides/mini/guide-proxies.html>

#### go get
```bash
HTTP_PROXY=socks5://localhost:1080 go get
```

测试了下 `HTTPS_PROXY` 和 `ALL_PROXY` 都不起作用

OR 使用[goproxy.io](https://goproxy.io/)

#### npm
```bash
npm config set proxy http://127.0.0.1:1087
npm config set https-proxy http://127.0.0.1:1087
```

用 Socks5 就报错- -

推荐使用 yarn，npm 是真的慢

refer <https://stackoverflow.com/q/7559648/12539782>

#### yarn
```bash
yarn config set proxy http://XX
yarn config set https-proxy http://XX
```

不支持 socks5

refer <https://github.com/yarnpkg/yarn/issues/3418>

#### rustup
```bash
export https_proxy=http://127.0.0.1:1080
```

#### gem
=~/.gemrc= ：

```
---
# See 'gem help env' for additional options.
http_proxy: http://localhost:1087
```

#### brew
```
ALL_PROXY=socks5://localhost:1080 brew ...
```

#### wget
=~/.wgetrc= ：

```
use_proxy=yes
http_proxy=127.0.0.1:1087
https_proxy=127.0.0.1:1087
```

refer <https://stackoverflow.com/q/11211705/12539782>

#### snap
```bash
sudo snap set system proxy.http="http://127.0.0.1:1087"
sudo snap set system proxy.https="http://127.0.0.1:1087"
```

refer <https://snapcraft.io/docs/system-options>

#### docker
```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo vim /etc/systemd/system/docker.service.d/proxy.conf
```

```
[Service]
Environment="ALL_PROXY=socks5://localhost:1080"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

必须是 Socks5，http 不生效

refer

1. <https://docs.docker.com/network/proxy/>
2. <https://elegantinfrastructure.com/docker/ultimate-guide-to-docker-http-proxy-configuration/>

#### Electron Dev Dependency
设置环境变量

```bash
ELECTRON_GET_USE_PROXY=true
GLOBAL_AGENT_HTTPS_PROXY=http://localhost:1080
```

refer

1. <https://www.electronjs.org/docs/latest/tutorial/installation#proxies>
2. <https://github.com/gajus/global-agent/blob/v2.1.5/README.md#environment-variables>

### Tools for Proxy
#### Clash

##### Clash Verge TUN 模式可能导致 Tailscale 内网 IP 无法访问

**Source:** 个人故障排查经验
**Reflection:** 多 VPN/虚拟网卡工具共存时，从路由表优先级、DNS 接管、流量劫持三条链路排查

开启 Clash Verge 的 TUN 模式后，如果没有针对 Tailscale 配置例外规则，访问 Tailscale 内网 IP（100.64.0.0/10）可能失败。

Tailscale 通过虚拟网卡维护 100.64.0.0/10 网段的路由，实现设备间的私有网络通信。

Clash Verge 的 TUN 模式会创建自己的虚拟网卡并接管系统流量，根据规则决定流量是直连还是代理。

当发往 Tailscale 的流量被 Clash 接管后，可能出现以下问题：

- 100.64.0.0/10 被错误匹配到代理规则
- Clash TUN 抢占了 Tailscale 路由优先级
- Fake-IP DNS 模式干扰 *.ts.net 域名解析

最终表现为：
- 无法访问 Tailscale 设备的 100.x.x.x 地址
- 无法访问 MagicDNS 主机名
- Tailnet 内部服务连接超时

### 解决方法

在 Clash 规则最前面添加：

```yaml
IP-CIDR,100.64.0.0/10,DIRECT,no-resolve
```

如果使用 MagicDNS，再增加：

```yaml
DOMAIN-SUFFIX,ts.net,DIRECT
```

如果开启 Fake-IP：

```yaml
fake-ip-filter:
  - '*.ts.net'
```

必要时在 TUN 配置中排除 Tailscale 网段，避免 Clash 接管对应路由。

#### v2ray-core
#### ssrlocal, sslocal
### 一些资源
- <https://github.com/aglent/autoproxy>
- <https://wiki.archlinux.org/title/Proxy_server>
- <https://github.com/FelisCatus/SwitchyOmega/wiki/GFWList>
- <https://en.wikipedia.org/wiki/SOCKS>
- <https://github.com/tianheg/open-network>
- <https://github.com/comwrg/package-manager-proxy-settings>
