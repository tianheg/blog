---
title: 'Cloudflare Access 接入自托管 Forgejo 登录（generic OIDC）'
status: draft
date: 2026-10-01T12:34:39+08:00
---

Cloudflare Access 除内置的邮箱 OTP、GitHub、Google 等登录方式外，还支持 **generic OIDC** ——任何实现了 OIDC discovery 的服务都能当身份源。自托管 Forgejo（Gitea 的 fork）自带 OAuth2/OIDC provider，所以可以拿它当 Access 的登录方式。

## Forgejo 侧：建 OAuth2 应用

访问 `<forgejo-host>/user/settings/applications`，建一个应用：

- **Redirect URI**：`https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`（精确匹配，多一个斜杠都会 mismatch）
- **勾选 Confidential client**：谁持有 secret 决定客户端类型。Access 的授权流程跑在 Cloudflare 服务端，secret 不下发到浏览器 —— 所以是 confidential client。不勾就变成 public client，Forgejo 只认 PKCE，不给你 secret，Access 表单里的 client_secret 那格没法填。

Client secret 只在创建时显示一次，直接粘进 Cloudflare 那个表单。

## Cloudflare 侧：加 OpenID Connect 身份源

Zero Trust → Integrations → Identity providers → Add new → OpenID Connect，填三组值：

| 字段 | 值 |
|---|---|
| Auth URL | `https://<forgejo-host>/login/oauth/authorize` |
| Token URL | `https://<forgejo-host>/login/oauth/access_token` |
| Certificate URL | `https://<forgejo-host>/login/oauth/keys` |

这三个值都从 `<forgejo-host>/.well-known/openid-configuration` 里取。两个注意点：

- **Certificate URL 要填 `jwks_uri`**（`/login/oauth/keys`），不是 `.well-known` 那个地址 —— 它用来验 id_token 签名
- Access 这个表单**没有**单独的 issuer / discovery URL 字段，只有这三个 URL，别自己拼一个塞进去

其余选项：

- **Scopes**：`openid email profile`。`openid` 必需，`email` 给 Access 认人，`profile` 带上 `name` / `preferred_username` / `picture`。要用组织/团队成员限定才加 `groups`，且必须与自定义 claim 列表配对（只填一边不生效）
- **PKCE**：不勾。confidential client 已经有 secret 兜底，PKCE 是 public client 的替代路径，勾上等于走一条 IdP 侧覆盖较少的支路
- **SCIM**：关。SCIM 要求 IdP 提供 SCIM server 端点，Forgejo 没有实现，开了只会多一个同步失败面
- **Email claim**：留空走默认的 `email`
- **OIDC Claims（自定义 claim 列表）**：填 `preferred_username`

最后一条是关键。Access 的普通选择器里**没有 username 这一项**（只有 email、IdP group、OIDC Claim），想按用户名限定用户，就必须先把 `preferred_username` 加进自定义 claim 列表，政策里才会出现对应的 OIDC Claim 选择器。

## 政策：限定登录用户

Access 的语义：同一条政策里 `include` 内部是 **OR**，`require` 是**政策级 AND**。两种落地姿势：

- **合并进现有 allow 政策**：`include` 里再加一条 `OIDC Claim: preferred_username = <你的用户名>`。只要只配了一个 generic OIDC IdP，claim 不会被其他登录方式凭空产生，合并是安全的。**代价**：该政策从此不能再加 `require`（会连带判死 email / GitHub 那几条）。
- **拆独立政策**：新增一条 allow（各条 allow 之间是 OR），可单独绑 `require: Login method = 该 OIDC IdP`，语义更显式，以后加条件不牵连旧规则。

⚠️ 别忘了**把新 IdP 加进应用的 Authentication / Login methods**，否则登录页不会出现这个选项。另外注意 email 是否对得上：如果现有政策写的是 email 规则，而 Forgejo 账号的邮箱是另一个地址，那条规则不会生效 —— 只勾登录方式不够，得靠 claim 规则才进得来。

## 坑：源站 WAF / PoW 会吞掉服务端的 token 交换

配好之后点 Test，报的是：

```
OIDC ERROR: Failed to exchange code for token. Make sure the client secret is correct.
undefined
```

这句报错**指向 secret，但问题不在 secret**。真因：源站前面挂了 PoW 防护（Anubis 这类），它把 Cloudflare 后端持授权码换 token 的那个 `POST /login/oauth/access_token` 挑战住了 —— CF 收到的不是 JSON 而是挑战页，于是判定「拿不到 token」。

浏览器那一腿（`/login/oauth/authorize` → 用户点授权 → `POST /login/oauth/grant` → 303 回 CF 回调）是通的，Anubis 只挡了机器这一腿。而且这条请求的 UA 就是 `cloudflare-access`，看着人畜无害，但一样被挑战。

**判据：拿两边的日志对账，别猜。**

```bash
# 源站日志：完全没有这条 POST（只有自己 curl 的）
docker logs --since 20m forgejo | grep 'login/oauth/access_token'
# WAF 日志：有 challenge，来源是 Cloudflare 的边缘 IP
docker logs --since 20m anubis | grep access_token
```

对照实验：同一个 UA、同一个 method，从别的源 IP 打同一个端点却能到源站 ⇒ 触发条件跟来源有关，不是 UA 也不是 method。

**修法：反代层做路径级 bypass**（不是给 WAF 加 UA 允许规则 —— UA 谁都能伪造，按路径放行才不会把 PoW 对所有爬虫打开）。Caddy 里插在代理到 WAF 的那段**之前**：

```caddyfile
	@oidc_machine path /login/oauth/access_token /login/oauth/keys
	reverse_proxy @oidc_machine localhost:3000 {
		header_up Host {host}
		header_up X-Real-IP {remote_host}
		header_up X-Forwarded-For {remote_host}
		header_up X-Forwarded-Proto {scheme}
	}
```

只放行换 token 与取 jwks 这两个端点，`authorize` / `grant` 仍过 WAF（那是浏览器腿，真人能过）。这两个端点本来就是要裸露给互联网的 API，靠 client secret 鉴权，和 git smart HTTP 同一待遇。

改 Caddyfile 的两个既有坑（bind mount 单文件）：写完先 `caddy validate`，落盘必须**原地 `cp`** （`mv` 换 inode，bind mount 里还指旧文件，reload 等于没改）。

## 验证：用对照组确认「放行的是路径，不是把 WAF 关了」

挑一个 WAF 明确会拦的 UA 做对照，比「能登录了」更有说服力：

```bash
# 对照组：同一个 UA，普通路径应被拦
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -A 'GPTBot/1.0' https://<forgejo-host>/
# → 200 text/html，内容是挑战/拦截页

# 放行路径：应拿到源站的 JSON
curl -s -A 'GPTBot/1.0' https://<forgejo-host>/login/oauth/keys
# → application/json

# 模拟 CF 的服务端调用
curl -s -A 'cloudflare-access' -X POST \
  -d 'grant_type=authorization_code&client_id=x&code=y' \
  https://<forgejo-host>/login/oauth/access_token
# → 源站的 400 JSON（invalid_client），不是挑战页
```

任何 accept 了 code 却能换到 `email` 与 `preferred_username` 的返回，就说明链路通了。

## 另一个隐患：CSP 的 form-action

如果源站 enforce 了 `form-action 'self'`，Forgejo 授权页 POST `/login/oauth/grant` 之后 303 跳到 `https://<team>.cloudflareaccess.com/...` 是跨源跳转，CSP 规范要求逐跳校验，Chrome 系会拦掉整条链。实测这条跳转暂时没被拦，但收紧 CSP 或换浏览器时值得回头看 —— 这个坑跟本地 loopback OAuth helper（凭据助手回调到 `127.0.0.1`）是同一类问题，任何「表单提交后跨源回跳」的登录流程都会踩。

## 验证拒绝路径

写完规则记得验一次**别人进不来**：用一个非目标用户名的账号走一遍，或临时把 claim 值改错点 Test。claim 规则写错一个字符的表现是「你能进、别人也能进」，这不会自己暴露。

## 参考

- [Cloudflare Docs: Generic OIDC](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/generic-oidc/)
- [Cloudflare Docs: Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
- [Forgejo Docs: OAuth2 provider](https://forgejo.org/docs/latest/user/authentication/oauth2-provider/)
