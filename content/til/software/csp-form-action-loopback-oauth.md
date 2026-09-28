---
title: CSP form-action 会掐断 loopback 回调的 OAuth 登录
status: draft
date: 2026-09-28T22:51:45+08:00
header: Web
---

给站点加 `Content-Security-Policy: form-action 'self'` 之后，所有走 **loopback 回调**的 OAuth 授权流会当场坏掉 ——
包括 `git-credential-oauth`、Git Credential Manager 这类凭据助手。报错看着像同源请求被拦，实际拦的是表单提交之后的那一跳。

## 机制：`form-action` 检查的是整条跳转链，不只是表单目标

CSP 规范要求对表单提交引发的导航**逐个检查** `form-action`，跳转的目标也算。
浏览器实现不一致：**Chrome 自 63 起会拦跳转后的地址，Firefox 57 不拦**
（MDN 明确标注这条分歧，所以只有 Chrome 系能复现）。

OAuth 授权码流程的最后一跳正是跨 origin 的：

```
[浏览器] POST https://example.com/login/oauth/grant     ← 同源，CSP 放过
   ↓ 302
         http://127.0.0.1:54321/?code=…                 ← 不是 'self' → 整条链被拒
```

Chrome 报的违例 URL 是**链首那个同源 POST**，这是最容易误判的地方：

```
Sending form data to 'https://example.com/login/oauth/grant'
violates the following Content Security Policy directive: "form-action 'self'".
```

看到「同源地址违反 `'self'`」的正常反应是「CSP 配错了 / 浏览器抽风 / 应用没装好」，
于是往凭据助手、服务端 OAuth 配置这些方向查 —— 全都查不出来，因为问题在 CSP 的语义上。

**判据**：报错 URL 与表单所在页面**同源** ⇒ 拦的必然是链后面的跳转（表单目标同源时 `'self'` 不可能违规）。

## 影响面：一切 loopback 回调

loopback redirect（`http://127.0.0.1:<port>`）是 RFC 8252 给原生应用推荐的回调方式。
它天然跨 origin，所以下列都会一起坏：

- `git-credential-oauth`（GitHub / GitLab / Gitea / Forgejo 通吃）
- Git Credential Manager —— 同样是 loopback，**换工具不解决问题**
- 各类 CLI 的浏览器登录（`gh auth login` 的浏览器模式、`wrangler login` 等）

坑上加坑：**端口是随机的**（`git-credential-oauth` 用 Go 的 `httptest.NewServer`，监听 `127.0.0.1:0`），
所以不能靠放行某个固定端口绕过，只能按主机放行。

## 修法

```
Content-Security-Policy: …; form-action 'self' http://127.0.0.1:* http://localhost:*
```

- 端口用通配 `:*`（host-source 允许 `*` 作端口）
- `127.0.0.1` 与 `localhost` 两种写法都要留 —— 客户端可能显式配置成 `localhost`
- **代价**：允许表单 POST 到任意本地端口。一个 XSS 能借表单向本机服务发 CSRF 请求（读不到响应，但能触发写操作）。
  这是所有支持 loopback OAuth 的站点都要付的账，不是自托管独有的弱点
- 反面方案更差：整条删掉 `form-action` 连外站表单也放开；只留 `'self'` 则等于禁用所有 loopback 登录

## 实测（2026-09-28）

自托管 Forgejo 15 + Caddy 反代，`form-action 'self'` 于 09-26 上线，09-28 发现掐断 `git-credential-oauth`。

| 检查项 | 结果 |
|---|---|
| 改前：Chrome 报违例 | `/login/oauth/grant` 同源 POST 被拒 |
| 服务端是否接受随机端口 | `GET /login/oauth/authorize?redirect_uri=http://127.0.0.1:54321/…` → **303**（未被拒）⇒ 障碍只在 CSP |
| 改后：`curl -sI` 线上头 | `form-action 'self' http://127.0.0.1:* http://localhost:*` 已生效 |
| 改后：页面健康 | 登录页 200，字节数与改前一致；API/SSH 正常 |

复现（在任意页面看 CSP header）：

```bash
curl -sI https://example.com/ | grep -i content-security-policy
```

## 方法论：同源报错不等于同源问题

这次的教训比修复命令寿命长 —— **浏览器消息里的 URL 是「导航链的起点」，不是被拒的那个地址**。
遇到「同源地址违反 `'self'`」这类自相矛盾的报错，先在脑子里补出完整跳转链（`curl -sI -X POST` 追 `Location`），
再决定查哪一层。同理，`form-action` 的坑只在 Chrome 系出现，**Firefox 复现不了不代表问题不存在**。

## 参考

- [MDN: Content-Security-Policy: form-action](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action) —— 含「是否应拦跳转存在争议、浏览器实现不一致」的警告
- [W3C WebAppSec CSP: form-action 与跳转](https://github.com/w3c/webappsec-csp/issues/8) —— 争议本身
- [RFC 8252: OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252) —— loopback 回调的规范依据
