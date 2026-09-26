#!/usr/bin/env node
/**
 * check-external-links.mjs — 站外链接死链扫描
 *
 * 与 check-links.mjs 正交：那个管站内链接和未解析的 wikilink（发布闸门，
 * 读 Hugo 构建日志），这个管 content/ 里指向站外的 http(s) 链接。
 *
 * 做法：
 *   1. 扫 content/ 下所有 .md，抽出外链（Markdown 链接 + 裸 URL），
 *      跳过 fenced code block、缩进代码块、inline code、HTML 注释
 *   2. 去重后并发探测（默认 10 并发，同域名最多 2 个并发，别把人家当爬虫打）
 *   3. HEAD 先行；HEAD 不干净或结果为 4xx 时再用 GET 复核。不少服务器对
 *      HEAD 直接甩 404/403/405/501，只用 HEAD 判死会大面积误报
 *   4. 请求带真实 Chrome（Windows）指纹：完整 UA + Sec-CH-UA / Sec-Fetch-* /
 *      Accept-Language / Referer，避免被 WAF 一眼当机器人
 *   5. 缓存落 .hermes/external-links/cache.json（已在 .gitignore）：
 *      正常的 URL 缓存 30 天、异常的 3 天 —— 重复跑只探没探过的
 *
 * ⚠ 传输层用 curl 而不是 Node 内置 fetch：本机（PVE，Tailscale MagicDNS +
 *   CGNAT）跑 undici 会大批 UND_ERR_CONNECT_TIMEOUT，同一批 URL curl 秒开。
 *   curl 自己处理双栈回退、TLS、HTTP/2、gzip，别改回 undici。
 *
 * 用法：
 *   node scripts/check-external-links.mjs                  # 全量扫描（首次约 1h，之后走缓存很快）
 *   node scripts/check-external-links.mjs --limit 50       # 只探前 50 个（试水）
 *   node scripts/check-external-links.mjs --host github.com
 *   node scripts/check-external-links.mjs --json /tmp/ext.json
 *   node scripts/check-external-links.mjs --no-cache --warn-only
 *   node scripts/check-external-links.mjs --refresh-dead   # 强制复核上次判死的
 *   node scripts/check-external-links.mjs --list           # 只列 URL 不探测
 *   node scripts/check-external-links.mjs --no-wayback     # 跳过 Wayback 存档查询
 *   node scripts/check-external-links.mjs --recheck-verified  # 连账本里的也重探
 *
 * 已确认非死链账本：scripts/external-links-verified.txt
 *   探测到 2xx 即自动记账（一行 `YYYY-MM-DD <URL>`），之后默认不再重复探测，
 *   报告末尾单列「✅ 已确认非死链」区。超过 --verified-ttl-days（默认 90 天）
 *   会自动复核并刷新日期；复核发现已死的会从账本里撤掉并照常报警。
 *   要跳过账本写入用 --no-write-verified。
 *
 * 结果分五类 + 账本：
 *   dead        4xx（源站明确说不存在）—— 退出码 1
 *   unreachable 5xx / 代理到不了 —— 不是死链，别乱改
 *   blocked     401/403/429/451 —— WAF 或登录墙
 *   error       DNS/超时/TLS
 *   ok          2xx/3xx
 *   ✅ verified 2xx 且已记账，本次跳过探测
 *
 * 忽略名单：scripts/external-link-ignore.txt，一行一条（# 注释，子串匹配），
 * 用来压掉已知被 WAF 挡死、或有意保留的历史链接。
 *
 * 退出码：0 = 没有死链；1 = 有死链/服务端错（--warn-only 时恒为 0）
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { execFile } from "node:child_process";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const CACHE_FILE = join(ROOT, ".hermes/external-links/cache.json");
const IGNORE_FILE = join(ROOT, "scripts/external-link-ignore.txt");
const VERIFIED_FILE = join(ROOT, "scripts/external-links-verified.txt");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const CONCURRENCY = Number(opt("--concurrency", "10"));
const PER_HOST = Number(opt("--per-host", "2"));
const TIMEOUT_S = Number(opt("--timeout", "20"));
const LIMIT = opt("--limit", null) ? Number(opt("--limit")) : null;
const HOST_FILTER = opt("--host", null);
const JSON_OUT = opt("--json", null);
const WARN_ONLY = flag("--warn-only");
const NO_CACHE = flag("--no-cache");
const NO_WRITE_VERIFIED = flag("--no-write-verified");
let verifiedChanged = false;
const REFRESH_DEAD = flag("--refresh-dead");
const LIST_ONLY = flag("--list");
// --urls-file <path>：不扫 content/，改扫一份外部 URL 清单（每行 `url` 或 `url\t标签`）
// 用途：拿同一套探测逻辑查别处的链接（Linkding 书签等）
const URLS_FILE = opt("--urls-file", null);

const OK_TTL = 30 * 24 * 3600 * 1000;
const BAD_TTL = 3 * 24 * 3600 * 1000;

// ── 真实浏览器指纹（Chrome on Windows 11） ───────────────────────────
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";

/** plain = 去掉内容协商，Accept 只发星号斜杠（有些站的 WAF 拿 Accept 当机器人特征，会甩 405/406） */
function headerArgs(plain = false) {
  return [
    "-A", UA,
    "-H", `accept: ${plain ? "*/*" : BROWSER_ACCEPT}`,
    "-H", "accept-language: zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "-H", `sec-ch-ua: "Chromium";v="140", "Not(A:Brand";v="24", "Google Chrome";v="140"`,
    "-H", "sec-ch-ua-mobile: ?0",
    "-H", 'sec-ch-ua-platform: "Windows"',
    "-H", "sec-fetch-dest: document",
    "-H", "sec-fetch-mode: navigate",
    "-H", "sec-fetch-site: cross-site",
    "-H", "sec-fetch-user: ?1",
    "-H", "upgrade-insecure-requests: 1",
    "-H", "referer: https://tianheg.co/",
  ];
}

// ── 1. 抽链接 ───────────────────────────────────────────────────────
// 允许 URL 里带成对括号（维基/WHO 那种 .../foo-(bar-baz)），其余仍严格排除
// 引号/反引号/尖括号/方括号/空白 —— 放开这些会把正文文字和中文标点吞进 URL，
// 凭空造出几百条假死链（踩过）
const MD_LINK = /(?<!!)\[[^\]\n]*\]\(\s*(https?:\/\/(?:[^\s<>()"'`\]]|\([^()\s]*\))+)/g;
const BARE_URL = /(?<![("\'>=])\b(https?:\/\/(?:[^\s<>()"'`\]]|\([^()\s]*\))+)/g;
// 已经是存档链接的内层原始 URL 不算独立链接：
// https://web.archive.org/web/20130311215851/http://bens.me.uk/xxx → 别再抽一层出来
const ARCHIVE_INNER = /https?:\/\/web\.archive\.org\/web\/\d+\/$/;

const urlFiles = new Map(); // url -> Set(相对路径)

function collect(file) {
  let text = readFileSync(file, "utf8");
  // 去掉代码（示例里的 URL 不是真链接）
  text = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/^(?: {4,}|\t).*$/gm, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const rel = relative(ROOT, file);
  const hits = new Set();
  for (const re of [MD_LINK, BARE_URL]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (ARCHIVE_INNER.test(text.slice(Math.max(0, m.index - 60), m.index))) continue;
      hits.add(m[1]);
    }
  }
  for (let u of hits) {
    u = u.replace(/[.,;:!?。，、；：！？）】》”’]+$/, ""); // 句末标点（含中文）不算 URL 的一部分
    try {
      const parsed = new URL(u);
      if (parsed.hostname === "tianheg.co" || parsed.hostname.endsWith(".tianheg.co")) continue;
    } catch {
      continue;
    }
    if (HOST_FILTER && !u.includes(HOST_FILTER)) continue;
    if (!urlFiles.has(u)) urlFiles.set(u, new Set());
    urlFiles.get(u).add(rel);
  }
}

if (URLS_FILE) {
  // 外部 URL 清单模式：每行 `url` 或 `url\t标签`
  for (const line of readFileSync(URLS_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [u, ...rest] = t.split("\t");
    if (!/^https?:\/\//.test(u)) continue;
    if (!urlFiles.has(u)) urlFiles.set(u, new Set());
    urlFiles.get(u).add(rest[0] || "list");
  }
} else {
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) collect(p);
    }
  })(CONTENT);
}

// 忽略名单：已知被 WAF 挡死 / 有意保留的历史链接
const ignored = [];
if (existsSync(IGNORE_FILE)) {
  for (const line of readFileSync(IGNORE_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#")) ignored.push(t);
  }
}
const isIgnored = (u) => ignored.some((pat) => u.includes(pat));

// ── 已确认非死链账本 ────────────────────────────────────────────────
// scripts/external-links-verified.txt：一行一条 `YYYY-MM-DD <URL>`，
// 2xx 探测成功即自动记账（机器判定），之后默认不再重复探测。
// 账本超期（默认 90 天）或 --recheck-verified 会重新探一次并刷新日期，
// 免得一条链接在这里躺着、实际早就死了。
const VERIFIED_TTL_DAYS = Number(opt("--verified-ttl-days", "90"));
const REVERIFY = flag("--recheck-verified");
const verified = new Map(); // url -> 'YYYY-MM-DD'
// --urls-file 模式（查外部清单）不碰 blog 的账本：既不读也不写
if (!URLS_FILE && existsSync(VERIFIED_FILE)) {
  for (const line of readFileSync(VERIFIED_FILE, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^(\d{4}-\d{2}-\d{2})\s+(\S+)$/);
    if (m) verified.set(m[2], m[1]);
    else verified.set(t, "1970-01-01"); // 老格式（纯 URL）视为过期，下次探测刷新
  }
}

const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD，本地时区
const isVerifiedFresh = (u) => {
  const d = verified.get(u);
  if (!d || REVERIFY) return false;
  return Date.now() - Date.parse(d) < VERIFIED_TTL_DAYS * 24 * 3600 * 1000;
};

let targets = [...urlFiles.keys()].filter((u) => !isIgnored(u));
const ignoredCount = urlFiles.size - targets.length;
// 账本里还有效的、且内容里仍在引用的 —— 本次不探，报告里单列
const skippedVerified = targets.filter(isVerifiedFresh);
targets = targets.filter((u) => !isVerifiedFresh(u));
targets.sort();
if (LIMIT) targets = targets.slice(0, LIMIT);

if (LIST_ONLY) {
  for (const u of targets) console.log(`${u}\t${[...urlFiles.get(u)].join(",")}`);
  console.log(`\n共 ${targets.length} 个 URL（忽略 ${ignoredCount}）`);
  process.exit(0);
}

// ── 2. 缓存 ─────────────────────────────────────────────────────────
let cache = {};
if (!NO_CACHE && existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {
    cache = {};
  }
}

function cached(url) {
  const c = cache[url];
  if (!c || NO_CACHE) return null;
  if (Date.now() - (c.checkedAt || 0) > (c.kind === "ok" ? OK_TTL : BAD_TTL)) return null;
  if (c.kind !== "ok" && REFRESH_DEAD) return null;
  // 老缓存里的 kind 是按老规则判的（4xx 一律 dead）—— 按状态码重算，
  // 免得 405/406/412 这类反爬响应继续背着「死链」的名声
  if ((c.kind === "dead" || c.kind === "blocked") && c.status) c.kind = classifyStatus(c.status);
  return c;
}

// ── 3. 探测（curl transport） ────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hostActive = new Map();

async function acquire(host) {
  while ((hostActive.get(host) || 0) >= PER_HOST) await sleep(120);
  hostActive.set(host, (hostActive.get(host) || 0) + 1);
}
const release = (host) => hostActive.set(host, Math.max(0, (hostActive.get(host) || 1) - 1));

/** curl 探测，返回 {status, finalUrl} 或 {err} */
function curlProbe(url, method, { noproxy = false, plain = false } = {}) {
  return new Promise((resolve) => {
    const args = [
      "-sS", "-o", "/dev/null", "-L", "--compressed",
      "--max-time", String(TIMEOUT_S),
      "--connect-timeout", "10",
      "--retry", "0",
      "-w", "%{http_code}\t%{url_effective}\t%{errormsg}",
      ...headerArgs(plain),
    ];
    if (noproxy) args.push("--noproxy", "*");
    if (method === "HEAD") args.push("-I");
    args.push(url);
    execFile("curl", args, { timeout: (TIMEOUT_S + 5) * 1000, maxBuffer: 1 << 20 }, (err, stdout) => {
      const line = String(stdout || "").trim().split("\n").pop() || "";
      const [code, finalUrl, errmsg] = line.split("\t");
      if (err && !code) return resolve({ err: errmsg || err.code || "curl failed" });
      const status = Number(code) || 0;
      if (!status) return resolve({ err: errmsg || "no response" });
      resolve({ status, finalUrl: finalUrl || url });
    });
  });
}

// 502/503 是网关层报错：本机出口走 mihomo（192.168.8.11:7892），代理到不了
// 上游时会直接吐 502，跟源站死活无关 —— 这类不能判死，只能算「到不了」
const GATEWAY_STATUS = new Set([502, 503]);
// 反爬专门用 405/406/412 打发非浏览器客户端（doi.org、searchfox 都这样）——
// 换个朴素 Accept 再试一次，别冤枉活链
const ANTIBOT_STATUS = new Set([405, 406, 412]);
const isOk = (s) => s >= 200 && s < 400;

/** 状态码 → 结论。只有 404/410 算真死链 —— 其余 4xx 一律归「被挡」，
 *  宁可让人多看一眼，也不要把活链判死（判死的成本是去改文章，误报的代价更大） */
function classifyStatus(s) {
  if (s === 404 || s === 410) return "dead";
  if (s >= 500) return "unreachable";
  if (s >= 400) return "blocked";
  return "error";
}

async function check(url) {
  const host = new URL(url).hostname;
  await acquire(host);
  try {
    const head = await curlProbe(url, "HEAD");

    // HEAD 干净就直接过 —— 绝大多数链接走这条路
    if (head.status && isOk(head.status)) {
      return { kind: "ok", status: head.status, finalUrl: head.finalUrl };
    }

    // 其余一律 GET 复核：HEAD 被 WAF / 服务器误伤太常见
    await sleep(250);
    let get = await curlProbe(url, "GET");

    if (get.status && isOk(get.status)) {
      const note = head.status && head.status !== get.status ? `HEAD ${head.status} → GET ${get.status}` : null;
      return { kind: "ok", status: get.status, finalUrl: get.finalUrl, note };
    }

    // 网关错 / 429 / 5xx 再给两次机会：先原路重试，再绕开代理直连
    if (get.status && (GATEWAY_STATUS.has(get.status) || get.status === 429 || get.status >= 500)) {
      await sleep(2000);
      const retry = await curlProbe(url, "GET");
      if (retry.status && isOk(retry.status)) return { kind: "ok", status: retry.status, finalUrl: retry.finalUrl };
      if (retry.status) get = retry;

      if (get.status && GATEWAY_STATUS.has(get.status)) {
        await sleep(500);
        const direct = await curlProbe(url, "GET", { noproxy: true });
        if (direct.status && isOk(direct.status))
          return { kind: "ok", status: direct.status, finalUrl: direct.finalUrl, note: "代理 502 → 直连 OK" };
        return { kind: "unreachable", status: get.status, reason: "网关/代理到不了（直连也不通）" };
      }
    }

    // 405/406/412：换个朴素 Accept 头再试，过了就是反爬误伤
    if (get.status && ANTIBOT_STATUS.has(get.status)) {
      await sleep(300);
      const plain = await curlProbe(url, "GET", { plain: true });
      if (plain.status && isOk(plain.status))
        return { kind: "ok", status: plain.status, finalUrl: plain.finalUrl, note: `反爬 ${get.status} → 朴 header 通过` };
      if (plain.status) get = plain;
    }

    if (!get.status) {
      const direct = await curlProbe(url, "GET", { noproxy: true });
      if (direct.status && isOk(direct.status))
        return { kind: "ok", status: direct.status, finalUrl: direct.finalUrl, note: "代理不通 → 直连 OK" };
      return { kind: "error", reason: get.err || head.err || "unknown" };
    }

    const s = get.status;
    const kind = classifyStatus(s);
    if (kind === "dead") return { kind, status: s };
    if (kind === "unreachable")
      return { kind, status: s, reason: "源站 5xx（非死链，多半是临时故障或反爬）" };
    if (kind === "blocked")
      return { kind, status: s, reason: `HTTP ${s}（非 404/410，多半是反爬或登录墙）` };
    return { kind: "error", reason: `unexpected ${s}` };
  } finally {
    release(host);
  }
}

/** 死链的 Wayback 兜底：有没有存档可以替换 */
async function wayback(url) {
  return new Promise((resolve) => {
    execFile(
    "curl",
    [
    "-sS", "--max-time", "25", "-L",
    // archive.org 的 availability API 不带浏览器 UA 一律超时，别去掉 -A
    "-A", UA,
    "-w", "\t%{http_code}",
    `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    ],
      { timeout: 25000, maxBuffer: 1 << 20 },
      (err, stdout) => {
        if (err) return resolve(null);
        const [body, code] = String(stdout).trim().split("\t");
        if (Number(code) !== 200) return resolve(null);
        try {
          const snap = JSON.parse(body)?.archived_snapshots?.closest;
          return resolve(snap?.available ? snap.url : null);
        } catch {
          return resolve(null);
        }
      }
    );
  });
}

// ── 4. 调度 ─────────────────────────────────────────────────────────
const results = [];
let done = 0;
const started = Date.now();

function saveCache() {
  if (NO_CACHE) return;
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
}

// 保留用户自己写在账本开头的注释块，只重写条目部分
const VERIFIED_HEADER = existsSync(VERIFIED_FILE)
  ? readFileSync(VERIFIED_FILE, "utf8")
      .split("\n")
      .filter((l) => l.trim().startsWith("#") || l.trim() === "")
      .join("\n")
      .trim() ||
    `# 已确认非死链账本 — 由 scripts/check-external-links.mjs 自动维护`
  : [
      "# 已确认非死链账本 — 由 scripts/check-external-links.mjs 自动维护",
      "# 格式：YYYY-MM-DD <URL>，日期 = 最后一次探测到 2xx 的日期",
      "# 2xx 即自动记账（机器判定）；已记账的默认不再重复探测，",
      "# 超过 --verified-ttl-days（默认 90 天）自动复核并刷新日期。",
      "# 想让它重新探测：删掉那一行。想手工加：照格式写一行。",
    ].join("\n");

function saveVerified(force = false) {
  if (NO_WRITE_VERIFIED || URLS_FILE) return;
  if (!force && !verifiedChanged) return;
  const entries = [...verified.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  writeFileSync(
    VERIFIED_FILE,
    `${VERIFIED_HEADER}\n\n${entries.map(([u, d]) => `${d}\t${u}`).join("\n")}\n`
  );
}

async function worker(queue) {
  while (queue.length) {
    const url = queue.shift();
    const hit = cached(url);
    if (hit) {
      results.push({ url, ...hit, cached: true });
      // 缓存里就是 2xx 的，同样算「已确认非死链」，直接补进账本
      if (hit.kind === "ok" && !NO_WRITE_VERIFIED) {
        const d = new Date(hit.checkedAt || Date.now()).toLocaleDateString("sv-SE");
        if (verified.get(url) !== d) {
          verified.set(url, d);
          verifiedChanged = true;
        }
      }
    } else {
      const r = await check(url);
      results.push({ url, ...r });
      if (r.kind === "ok") {
        cache[url] = { kind: "ok", status: r.status, finalUrl: r.finalUrl, checkedAt: Date.now() };
        if (!NO_WRITE_VERIFIED && verified.get(url) !== today) {
          verified.set(url, today); // 2xx = 已确认非死链，记账
          verifiedChanged = true;
        }
      } else {
        cache[url] = {
          kind: r.kind,
          status: r.status || null,
          reason: r.reason || null,
          checkedAt: Date.now(),
        };
        // 复核后确认已死/不见了：从账本撤下，别让它继续被当「已确认」
        if (verified.delete(url) && !NO_WRITE_VERIFIED) verifiedChanged = true;
      }
    }
    done++;
    if (done % 100 === 0) {
      const rate = done / ((Date.now() - started) / 1000);
      const eta = (targets.length - done) / Math.max(rate, 0.01);
      process.stderr.write(
        `  … ${done}/${targets.length}  ${rate.toFixed(1)}/s  剩 ${Math.round(eta)}s\n`
      );
      saveCache(); // 增量落盘：全量跑要一小时，中途 Ctrl-C 不该丢结果
      saveVerified();
    }
  }
}

const queue = [...targets];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue)));

// ── 5. 落缓存 + 报告 ─────────────────────────────────────────────────
saveCache();
saveVerified(true); // 汇总时整体重写一次，保证排序和去重

const byKind = (k) => results.filter((r) => r.kind === k);
const dead = byKind("dead").sort((a, b) => a.status - b.status);
const unreachable = byKind("unreachable");
const blocked = byKind("blocked");
const errors = byKind("error");
const ok = byKind("ok");

// 本次新确认的（探测到 2xx 且此前不在账本里）
const newlyVerified = ok.filter((r) => !skippedVerified.includes(r.url)).map((r) => r.url);
// 账本里仍然有效、且内容里还在引用的（本次跳过没探）
const verifiedList = skippedVerified.sort();

// 死链查一下 Wayback 有没有存档，便于换成存档链接
if (dead.length && !flag("--no-wayback")) {
  process.stderr.write(`  查 ${dead.length} 条死链的 Wayback 存档…\n`);
  await Promise.all(
    dead.map(async (r) => {
      r.wayback = await wayback(r.url);
    })
  );
}

const fmt = (r) => {
  const files = [...(urlFiles.get(r.url) || [])];
  const shown = files.slice(0, 3);
  const more = files.length > 3 ? ` 等 ${files.length} 处` : "";
  const extra = [];
  if (r.note) extra.push(r.note);
  if (r.reason) extra.push(r.reason);
  if (r.wayback) extra.push(`Wayback: ${r.wayback}`);
  else if (r.kind === "dead" && !flag("--no-wayback")) extra.push("无 Wayback 存档");
  return `  · [${r.status ?? r.reason}] ${r.url}\n      引用于 ${shown.join(", ")}${more}${
    extra.length ? `\n      ${extra.join(" | ")}` : ""
  }`;
};

console.log(`\n站外链接扫描 — 探测 ${results.length} 个 URL（共 ${urlFiles.size} 个，忽略 ${ignoredCount}）`);
console.log(
  `耗时 ${((Date.now() - started) / 1000).toFixed(0)}s，缓存命中 ${results.filter((r) => r.cached).length}\n`
);
console.log(`  ok            ${ok.length}`);
console.log(`  dead (4xx)    ${dead.length}   ← 真死链`);
console.log(`  unreachable   ${unreachable.length}   （5xx / 代理到不了，不是死链）`);
console.log(`  blocked       ${blocked.length}   （WAF/登录墙，非死链，需人工看一眼）`);
console.log(`  error         ${errors.length}   （DNS/超时/TLS）`);
console.log(
  `  ✅ 已确认非死链 ${verifiedList.length + newlyVerified.length}   （账本 ${VERIFIED_FILE.replace(`${ROOT}/`, "")}，本次新确认 ${newlyVerified.length}）`
);

for (const [title, list] of [
  ["✗ 死链 (4xx，源站明确的回应)", dead],
  ["⚠ 到不了（5xx 或代理绕不过，非死链）", unreachable],
  ["⚠ 被挡（401/403/429/451）", blocked],
  ["⚠ 连不上（DNS/超时/TLS）", errors],
]) {
  if (!list.length) continue;
  console.log(`\n${title} — ${list.length}`);
  for (const r of list) console.log(fmt(r));
}

// ✅ 已确认非死链（2xx）—— 账本里的 + 本次新探到的，都标出来
{
  const all = [
    ...verifiedList.map((u) => ({ url: u, status: 200, wasSkipped: true })),
    ...newlyVerified.map((u) => {
      const r = ok.find((x) => x.url === u);
      return { url: u, status: r?.status ?? 200, finalUrl: r?.finalUrl, wasSkipped: false };
    }),
  ].sort((a, b) => a.url.localeCompare(b.url));

  if (all.length) {
    console.log(`\n✅ 已确认非死链 — ${all.length}（2xx）`);
    for (const r of all) {
      const files = [...(urlFiles.get(r.url) || [])];
      const shown = files.slice(0, 2);
      const more = files.length > 2 ? ` 等 ${files.length} 处` : "";
      const tag = r.wasSkipped ? "账本" : "本次确认";
      const moved = r.finalUrl && r.finalUrl !== r.url ? ` → ${r.finalUrl}` : "";
      console.log(
        `  · ✅ [${r.status}|${tag}] ${r.url}${moved}\n      引用于 ${shown.join(", ")}${more}`
      );
    }
  }
}

// 账本里已经没有对应内容的条目（内容删了/改了链接）—— 提示一下，不自动删，避免误伤
const orphanVerified = [...verified.keys()].filter((u) => !urlFiles.has(u));
if (orphanVerified.length) {
  console.log(
    `\nℹ 账本里 ${orphanVerified.length} 条 URL 已不在 content/ 中出现（内容改过或删了），可手工清理：`
  );
  for (const u of orphanVerified.slice(0, 20)) console.log(`  · ${u}`);
  if (orphanVerified.length > 20) console.log(`  …… 另有 ${orphanVerified.length - 20} 条`);
}

if (JSON_OUT) {
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: results.length,
        counts: {
          ok: ok.length,
          dead: dead.length,
          unreachable: unreachable.length,
          blocked: blocked.length,
          error: errors.length,
          verified: verifiedList.length + newlyVerified.length,
        },
        newlyVerified,
        verified: verifiedList,
        results: results.map((r) => ({ ...r, files: [...(urlFiles.get(r.url) || [])] })),
      },
      null,
      2
    )
  );
  console.log(`\nJSON 已写入 ${JSON_OUT}`);
}

if (dead.length && !WARN_ONLY) process.exit(1);
