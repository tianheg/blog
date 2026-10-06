---
title: Firefox 报 SEC_ERROR_BAD_SIGNATURE：内网 CA 同名双根与 enterprise_roots
status: draft
date: 2026-10-06T14:38:53+08:00
header: Tools
---

> 同一时刻、同一份证书链字节：Firefox 判「签名无效」且不给加例外，OpenSSL、NSS certutil、签发端自己全判通过。追到底是 Firefox 把 **Windows 系统证书库里一张同名不同钥的旧根**当成了信任锚，拿旧钥匙去验新签的中间证书。根治动作只有两条命令：系统库里删旧根、导新根，Firefox 侧零改动。

## 症状

- 环境：Windows 11 + 自编译 Firefox 158（Developer Edition 通道），内网服务由反向代理用本地 CA 签发证书（占位域名 `search.lan`）。同机 Edge 打开正常。
- Firefox 报 `SEC_ERROR_BAD_SIGNATURE`，展开只有一句「Peer's certificate has an invalid signature」。
- 这个错误**不给「添加例外」入口**——它被归在不可覆盖的错误类里，没法靠点「继续访问」绕过（同类语境见 [Bug 1611381](https://bugzilla.mozilla.org/show_bug.cgi?id=1611381)，讨论的就是 BAD_SIGNATURE 与 INADEQUATE_KEY_USAGE 不可 override 的问题）。
- 错误码换算：`-8182` = `SEC_ERROR_BASE(-8192) + 10` = `SEC_ERROR_BAD_SIGNATURE`（`security/nss/lib/util/secerr.h`）。

## 第一步：证明服务端无罪——抓包解出真实证书链

在反代网关机上抓 `tcpdump`，写了个最小 TLS 1.3 解密器（`SSLKEYLOGFILE` 拿 traffic secret，HKDF 扩展 + AES-GCM 解 Application Data），把 ServerHello → Certificate 这段 flight 原样解出来。

链解开后是两张证书：叶子 448B + 中间 459B，**921/921 字节精确闭合**，逐张与本地 CA 目录里的文件比对一致。`openssl verify -CAfile <现行根> -untrusted <中间> <叶子>` 返回 OK。

### 这里栽的跟头：解密器自己的三个 bug 才是真正的「坏帧」

过程中解密器一度报「服务端发了畸形证书帧」——**那是错误的结论，三个 bug 全在我自己的解析器里**：

| bug | 症状 | 修法 |
|-----|------|------|
| ClientHello random 偏移差 2 字节 | derived key 永远和 keylog 对不上，全程解密失败 | TLS Handshake 帧内 random 从 `hs[6:38]` 取（有 type + 3 字节长度头，不是 `hs[4:36]`） |
| `HkdfLabel` 结构拼错 | GCM 一开就 tag 校验失败 | 严格按 RFC 8446：`!H(length) + label_len8 + "tls13 "+label + context_len8 + context` |
| **CertificateEntry 漏读 2 字节 extensions** | 中间证书长度解析成 0，看起来像「乱码帧」 | 每个 CertificateEntry 的尾部还有 2 字节扩展长度字段，跳过才能闭合 |

**校准方法**：拿一段已知良好、OpenSSL 验得过的握手（Python `ssl` 客户端现场跑一遍）喂给同一套解密器——它同样报「坏帧」。这一步把「服务端有问题」的假设整个推翻，定位到解析器自身。**自写协议解析器在投入「定罪」用途前，必须先跑一个已知良品做阳性对照。**

## 第二步：对照矩阵——同一段字节，五个验证者

服务端排除后，把「验证者」本身当实验变量：

| 验证者 | 结果 | 备注 |
|--------|------|------|
| OpenSSL（Linux 侧） | ✅ OK | `verify return code: 0` |
| NSS `certutil -V`（**同一版本 NSS、同一 profile 的 cert9.db**） | ✅ certificate is valid | 与 Firefox 共用底层库，结论却相反 |
| .NET `SslStream` 探针 | ⚠️ 通过但**是伪对照** | 事后核实其证书回调恒返回 true，根本没做验证——差点当成「又一个通过」的证据 |
| Edge（同机） | ✅ 正常（用户实测） | Chromium 自身的处理未逐行核实，此处只记录事实 |
| **Firefox 运行时** | ❌ 每次 1/1 复现 `-8182` | 仅 Firefox 失败 |

分叉点由此锁定：**certutil 走 NSS 的 `CERT_VerifyCert` 通道，Firefox 运行时走的是自己的 `mozilla::pkix`（mozpkix）验证器**——`SSLServerCertVerificationJob::Run` → `CertVerifier::VerifySSLServerCert`，同版本 NSS、同一批字节，两条代码路径给出相反结论。

顺着源码树全量搜 `SEC_ERROR_BAD_SIGNATURE` 的发射点：`ssl3con.c` 里只有一处（把错误翻译成 TLS alert），mozpkix 库里只有 4 处真正会抛它——`pkixder.cpp`（签名字节段 BIT STRING 解析失败）、`pkixnss.cpp` 两处（ECDSA 内层 DER / r,s 越界）、`pkixocsp.cpp` 两处（叶子证书没有 OCSP AIA，这两处到不了）。也就是说：**运行时是 mozpkix 在验签时判的失败，而 certutil 用同样字节验得通过**。

## 第三步：根因——企业信任注入 × 同名双根

关键事实取证（全部只读，未动系统）：

1. **`security.enterprise_roots.enabled` 默认为 true**：Firefox 在 Windows 上自动把**系统证书库**并进信任锚集合（偏好未显式写入 prefs.js = 走默认开）。
2. **Windows 系统根证书库里躺着一张旧根**：`CN=Caddy Local Authority - 2026 ECC Root`，但指纹前缀 `a658c8`、NotAfter 2036-07-22——是本地 CA **上一个世代**的产物（重建 CA 时沿用了同一个 CN，只有年份没有区分标记）。
3. **现行根**（反代机 CA 目录里那份）：同一 CN，指纹前缀 `21f696`、NotAfter 2036-08-10。**同名、不同钥**。
4. Firefox 的 cert9.db 里存的恰是现行根（trust `CT,,`），网络上收到的中间证书由现行根签发。

于是运行时的完整链路：mozpkix 找锚 → 池子里有**两张同 subject 的根** → 命中系统库那张旧根 → **拿旧公钥验新中间证书的签名 → 不匹配 → `ERROR_BAD_SIGNATURE`** → 映射回 `-8182` → 不可覆盖 → 死胡同页面。全程没走到 cert9.db 里那张对的根。

这解释了全部现象差异：系统库里无辜的 Edge 不做这套注入（具体机制未核实）；同一 profile 的 certutil 只见 cert9.db 所以通过；而「恰好多了一张同名旧根」这个前提一旦被删掉，错误随即改变形态（系统库清空后错误转为 `SEC_ERROR_UNKNOWN_ISSUER`——「找不到签发者」，从「验签错」退到「无锚」，方向向好且变为可人工 Proceed）。

## 定案实验（A/B）

同一份 profile 克隆，唯一变量是那一行偏好：

- **对照组**（默认配置）：访问即报错，`-8182` 计数 1/1，每轮必现。
- **实验组**：追加一行 `user_pref("security.enterprise_roots.enabled", false);` → 重跑探针：**`-8182` 计数 0**，页面主文档与全部静态资源 `status=0` 正常加载。

排除项：期间还顺带证伪了两个中途假设——DNS HTTPS/SVCB（type 65）记录作祟（dig 实测两台 DNS 均无该记录）、Tailscale 子网路由劫持（那是同期发现的**另一个**独立故障，见文末）。事实是这两个和证书错误完全无关。

## 修复：走系统信任路线（FF 零改动）

选定路线：证书统一进 Windows 系统库管，Firefox 靠 enterprise_roots 默认行为自动采纳。**顺序有硬要求——先删旧根，再导新根**，绝不允许两代同名根共存（那正是病灶）：

```text
:: 管理员 PowerShell
certutil -delstore root a658c81c314912ace6c4955557981fd95df723a6   :: 旧根，按指纹定位
certutil -addstore root <现行根.der>                               :: 现行根（DER 更稳，certutil 直吃）
```

完成后用 sha1 指纹回读确认新根在库、旧根不在。Firefox 侧**什么都不用改**；cert9.db 里那张现行根可以留着（与系统库同源，无害）。

诊断速查：

```text
certutil -store root | findstr /i <CA 关键词>   :: 系统库里这个 CA 有几张、指纹与有效期
certutil -L -d sql:<profile 目录>               :: Firefox cert9.db 清单
openssl verify -CAfile <根> -untrusted <中间> <叶子>   :: 与浏览器无关的独立裁决
about:config → security.enterprise_roots.enabled        :: 系统根注入开关
```

判定树一句话：**同机别的浏览器正常 + Firefox 报 BAD_SIGNATURE 且无例外入口 → 先数系统库里同 subject 根的张数，再看 enterprise_roots**。

## 排查方法论

1. **自写协议解析器先用已知良品校准**。本次三个解析 bug 全靠「拿一段 OpenSSL 已验收的握手喂同一套解码」这一步暴露；没做阳性对照的话，会拿着自己工具的 bug 去「证明」服务端有罪。
2. **「同一字节、不同验证者结论不同」是定位分叉的最强信号**——把验证者当实验变量摆成矩阵（OpenSSL / certutil / 浏览器 / 各语言运行时），分叉落在哪一列，问题就在那一列的实现里。
3. **错误码要回源码核实语义**。`BAD_SIGNATURE` 听上去在指控服务端，实际是客户端「选错了锚、验不过」——语义错位会让你往完全错误的方向查一整晚。
4. **多浏览器不一致，先查信任来源注入路径，再查密码学**。密码学层错在同一份字节上是自相矛盾的；「谁把哪张根放进了信任池」才是每台机器都可能不同的变量。
5. **识别伪对照**。探针返回「握手成功」不等于「验证通过」——校验回调恒真的客户端给出的绿灯毫无信息量，检视对照代码本身和读结果同样重要。
6. **诊断探针绝不碰 live 配置**。这场排障自己制造过一次衍生故障：探针轮次在真实 profile 的 `profiles.ini` 里把默认 profile 指到实验目录，实验目录清理后浏览器直接打不开（`Profile Missing`）。探针一律用克隆 profile，且清理时回查所有被指过的注册文件。

## 同场顺带清掉的三个连环故障

这轮「打不开」是四个独立故障叠在一起，逐个对症后一起消失：

1. **Tailscale 子网路由劫持内网流量**：`accept-routes` 开着时内网域名被绕进 tunnel。`tailscale set --accept-routes=false`，`tracert` 恢复单跳直达。
2. **`profiles.ini` 探针污染** → 启动即弹 Profile Missing。归位 `[Profile0] Path`、删掉指向已清理实验目录的 Install 段、清孤儿 `parent.lock`；顺带删掉排障期间自动新建的空白 profile 段。
3. **HTTPS-Only Mode 拦截纯 http 内网站**（弹 Secure Site Not Available）。`about:config` → `dom.security.https_only_mode` 改 `false`。

## 参考

- [Bug 1611381 — Cannot bypass SEC_ERROR_INADEQUATE_KEY_USAGE or SEC_ERROR_BAD_SIGNATURE](https://bugzilla.mozilla.org/show_bug.cgi?id=1611381)
- [secerr.h — 错误码定义（SEC_ERROR_BASE + 10）](https://github.com/mozilla-firefox/firefox/blob/beta/security/nss/lib/util/secerr.h)
- [pkixnss.cpp — mozpkix 的验签实现](https://github.com/mozilla-firefox/firefox/blob/beta/security/nss/lib/mozpkix/lib/pkixnss.cpp)
- [pkixder.cpp — 签名字段的 DER 解析](https://github.com/mozilla-firefox/firefox/blob/beta/security/nss/lib/mozpkix/lib/pkixder.cpp)
- [Result.h — mozpkix 错误码到 NSS 错误的映射](https://github.com/mozilla-firefox/firefox/blob/beta/security/nss/lib/mozpkix/include/pkix/Result.h)

相关：[[firefox]]