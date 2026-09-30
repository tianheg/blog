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
`~/.config/pip/pip.conf`

```
[global]
proxy=http://localhost:1087
```

注意不支持socks5

refer <https://pip.pypa.io/en/stable/user_guide/#using-a-proxy-server>

#### Git
1. Clone with ssh

   在文件 `~/.ssh/config` 后添加下面两行：

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

add to `~/.curlrc`

refer <https://www.zhihu.com/question/31360766>

#### Gradle
`~/.gradle/gradle.properties` ：

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
`~/.gemrc` ：

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
`~/.wgetrc` ：

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

##### TUN 下 git over SSH 被拒：直连规则要按 IP 写，并限定端口

**Source:** 个人故障排查经验
**Reflection:** 规则引擎只能匹配它**看得到**的字段 —— SSH 连接里没有域名，只有 IP，所以再正确的域名规则在这条路径上也是空转

开着 TUN 时，`git clone` / `git push` 走 SSH 会失败：

```text
Connection closed by <服务器 IP> port 22
fatal: Could not read from remote repository.
```

`ssh -vv` 能走到 `Connection established.`，紧接着就是 `kex_exchange_identification: Connection closed by remote host` —— TCP 建得起来，SSH 版本号交换被掐断；同一台服务器的 HTTPS 却完全正常。

三个叠加的原因：

1. **规则表里没有这台服务器的直连规则** —— 流量落到兜底 `MATCH`，交给代理节点
2. **代理节点不放行 22 端口** —— 经代理端口对任意主机打 `:22` 都返回 `502 Bad Gateway`，`:443` 正常 200。所以「让 SSH 走代理节点」这条路本身不存在
3. **域名规则对 SSH 无效** —— SSH 先解析再按 IP 连接，代理内核只看到 IP，`DOMAIN-SUFFIX` 永远匹配不到

### 正确写法

```yaml
rules:
  - AND,((IP-CIDR,<服务器 IP>/32,no-resolve),(DST-PORT,22)),DIRECT
```

`AND` / `OR` / `NOT` 逻辑规则 mihomo 1.14+ 支持，嵌套条件用括号包住，整条当普通规则放在规则表最前面（先于订阅规则与兜底 `MATCH`）。官方文档：<https://wiki.metacubex.one/config/rules/#and-or-not>。

**必须限定 `DST-PORT,22`。** 只写 `IP-CIDR,<服务器 IP>/32,DIRECT` 会把同一个 IP 上的 443 一起拖成直连 —— 实测同一个 6.9M 的仓库：直连 111s（≈62KB/s），走代理节点 3s（≈2.3MB/s），差 36 倍。SSH 只能直连（节点不放行 22），HTTPS 不必陪着一起慢。改完的收益是「SSH 从不可用变为可用」，不是变快 —— SSH 的耗时由那条直连线路决定。

### 两条容易踩的组合

- **`fake-ip-filter` 与域名规则互斥**：把某个域名豁免出 fake-IP（DNS 直接返回真实 IP）之后，代理内核就只看得到 IP，针对它的 `DOMAIN-SUFFIX` 规则永远不生效；反过来，只有域名仍走 fake-IP（内核能把假地址反查回域名）时，域名规则才好用。两者二选一，别一口气都写上。
- **扩展脚本里规则写错位置会静默失效**：规则字符串落在上一行注释的末尾（`// …… 'DOMAIN-SUFFIX,example.com,DIRECT'` 后面接 `const prependRules = [];`），数组永远是空的，规则一条都没进规则表，而且没有任何报错 —— 表面看「配置都写了」，实际什么都没生效。

### 怎么验

只看运行时的生成产物，不看源文件（Clash Verge 的配置目录里 100KB+ 的 `clash-verge.yaml` 才是真规则表）：

```bash
# 规则表首条
awk '/^rules:/{f=1;next} f&&/^- /{print; exit}' clash-verge.yaml
# SSH 通路
git ls-remote git@<你的域名>:<owner>/<repo>.git
# HTTPS 通路没被误伤（计时应仍是秒级）
time git clone --depth=1 https://<你的域名>/<owner>/<repo>.git /tmp/x
```

`git clone` 计时必须配落盘校验（`du -sh /tmp/x`）：被 `timeout` 收掉的挂死连接也会返回 0（那是管道末端的退出码，不是 git 的），只有目录真的落地才算通过。

改配置文件的写法对照见 [[git-proxy|git-proxy]]。

#### v2ray-core
#### ssrlocal, sslocal
### 一些资源
- <https://github.com/aglent/autoproxy>
- <https://wiki.archlinux.org/title/Proxy_server>
- <https://github.com/FelisCatus/SwitchyOmega/wiki/GFWList>
- <https://en.wikipedia.org/wiki/SOCKS>
- <https://github.com/tianheg/open-network>
- <https://github.com/comwrg/package-manager-proxy-settings>


相关：[[create-proxy-server|create-proxy-server]]

相关：[[git-proxy|git-proxy]]