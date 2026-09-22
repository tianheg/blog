---
title: Cloudflare Workers 的 _headers 缓存规则边界
status: draft
date: 2026-09-18T18:25:00+08:00
header: DevOps
---

把博客搬到 Cloudflare Workers 静态资产后，`static/_headers` 里写了一条自认为标准的规则：

```
/*.(css|js|woff2)
  Cache-Control: public, max-age=31536000, immutable
```

它从来没有生效过。

## 一、_headers 只支持 `*` 和 `:placeholder`

CF 的 `_headers` 模式**不支持 `(css|js|woff2)` 这种正则分组**，而且是**静默失效**：不报错、不警告、不匹配任何 URL。同一份文件里的 `/*`（安全头）和 `/*.md`（charset）都正常，说明文件被读取了、前缀也没写错，唯一变量是模式语法。官方示例里只有 `/static/*` 这类纯通配写法。

判别任何 header 规则是否生效，第一条命令：

```bash
curl -sI https://tianheg.co/css/main.<hash>.css | grep -i '^cache-control'
# 返回 public, max-age=0, must-revalidate → 规则没生效，这是 Workers 静态资产的默认值
```

能用的粒度只有目录或前缀，`*` 贪婪跨 `/`：

```
/css/*
  Cache-Control: public, max-age=31536000, immutable
```

## 二、部署即删：旧 hash 文件立刻 404

更反直觉的一条：**CF Workers 每次部署只保留当前版本那一份资产**，上一次部署的 hash 文件立刻消失。

Hugo 的 `fingerprint` 是内容 sha256，所以重建旧 commit 就能拿到当时线上真实用过的文件名：

```bash
cd ~/projects/blog
git worktree add --detach /tmp/blog-old <旧commit>
ln -s ~/projects/blog/node_modules /tmp/blog-old/node_modules
cd /tmp/blog-old && PATH="$PWD/node_modules/.bin:$PATH" hugo --gc --minify -d /tmp/blog-oldout
ls /tmp/blog-oldout/css        # ← 当时线上用过的文件名

curl -s -o /dev/null -w '%{http_code}\n' https://tianheg.co/css/main.<旧hash>.css
curl -sI https://tianheg.co/css/main.<旧hash>.css | grep -i content-type

cd ~/projects/blog && git worktree remove --force /tmp/blog-old
```

实测结果：旧 `main.4324f2c0….css`、旧 `table.min.29f145ea….css` → `404` + `content-type: text/html`；当前 `main.91ab9cf….css` → `200` + `text/css`。

前置自检很重要：先用当前 HEAD 构建一次，产出必须与线上现用 hash 逐字一致，才证明「本地构建等于 CI 构建」，否则 worktree 拿到的名字不能代表线上。

404 返回的是 404 页面（HTML）。浏览器对 `<link rel=stylesheet>` 和 `<script>` 都做严格 MIME 检查，拿到 `text/html` 直接拒绝应用或执行（DevTools 报 MIME type 错误）。症状不是「样式过期」，是「样式加载失败、页面裸奔」。

## 三、所以不要给 /css/* 加长缓存

`_headers` 按**路径**匹配，**与状态码无关**。把 `/css/*` 标记成 `immutable`，那条 404 响应也会被打上一年的 `immutable` —— CF 边缘和浏览器都会记住它。一次「部署瞬间的版本错配」（用户手上的 HTML 是旧版、资源请求落在新部署上）就能把那个用户锁死一年，浏览器侧 purge 无解。

收益只有省一次条件请求，而 CF 边缘本来就对 `/css/*` 返回 `HIT`。

保留 Workers 默认的 `public, max-age=0, must-revalidate` 加 `etag`：它恰好最契合「部署即删旧资产」的语义。

## 四、两条纪律

- **固定名资源一律不能长缓存**：字体（`/fonts/Satoshi-Variable.woff2`）、Pagefind 输出（`/pagefind/pagefind.js`、`pagefind-ui.css`）、`static/` 里直接复制的手写 JS 和 CSS —— 升级后文件名不变，长缓存等于让老用户拿一年旧文件
- **别在外部系统里硬引用带 hash 的 URL**（RSS 模板、别的站点嵌你的 CSS、邮件模板）—— 下次部署必 404

相关：[[til/software/cloudflare|Cloudflare 笔记]]
