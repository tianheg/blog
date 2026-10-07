#!/usr/bin/env node
/**
 * check.mjs — 闸门模块（单一入口；2026-10-07 由 5 个文件合并）
 *
 * 合并件：check-links.mjs + check-unicode.mjs + check-external-links.mjs
 *         + test-check-unicode.sh（移植为 unicode-selftest）+ test-photo-guard.mjs
 * 实现体是原文件原文内联在 case 块作用域里，行为/退出码逐一等价；
 * process.argv 先重映射，子命令体仍按原文件的 `process.argv.slice(2)` 解析参数。
 *
 * 用法:
 *   node scripts/check.mjs links                站内链接 / 未解析 wikilink 闸门（读 Hugo 构建日志）
 *   node scripts/check.mjs unicode              伪 ASCII / 全角标点闸门（--strict/--list/--content 照用）
 *   node scripts/check.mjs unicode-selftest     闸门自测（fixture：漏报 / 误报 / 退出码）
 *   node scripts/check.mjs photos               photo-guard 白名单闸单测
 *   node scripts/check.mjs external [flags]     站外链接死链扫描（--limit/--host/--json/...）
 *   node scripts/check.mjs --help
 *
 * 退出码：0 通过；1 检出问题（卡发布）；2 用法/执行错误。
 * npm 名字不变：npm run check-links / check-unicode / check-external-links / test-unicode。
 *
 * 数据账本（2026-10-07 迁 scripts/data/）：external-link-ignore.txt、
 * external-links-verified.txt、photos-allowlist.json（worker 同源读取同一份）。
 */

import { PHOTO_KEY_RE, resolvePhotoKey } from './photo-guard.js';
import { spawnSync, execFile, execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';


const argvAll = process.argv.slice(2);
const SUB = argvAll[0];
const HELP = `check.mjs — blog 闸门模块
用法: node scripts/check.mjs <子命令> [参数...]

  links                 站内链接 / 未解析 wikilink（发布闸门，读 Hugo 构建日志，可加 --warn-only）
  unicode               伪 ASCII / 全角标点检查（ERROR 退出 1；--strict --list --content 照用）
  unicode-selftest      unicode 闸门的自测（fixture：能否抓到真 bug、有没有误报）
  photos                photo-guard 白名单闸单测
  external [flags]      站外链接死链扫描（--limit --host --json --warn-only --no-cache ...）

  -h, --help            显示本帮助

退出码: 0=通过 1=检出问题(卡发布) 2=用法/执行错误`;

if (!SUB || SUB === "-h" || SUB === "--help" || SUB === "help") {
  console.log(HELP);
  process.exit(SUB ? 0 : 2);
}
const KNOWN = new Set(["links", "unicode", "unicode-selftest", "photos", "external"]);
if (!KNOWN.has(SUB)) {
  console.error(`✗ 未知子命令: ${SUB}\n`);
  console.log(HELP);
  process.exit(2);
}
// 重写 argv：子命令体沿用原文件的 argv 解析方式，flags 语义不变
process.argv = [process.argv[0], process.argv[1], ...argvAll.slice(1)];

switch (SUB) {
  case "links": {
/**
 * check-links.mjs — 链接健康检查 / 发布闸门
 *
 * 跑一次 Hugo 构建（渲染到内存，不落盘），从构建日志里取出两类问题：
 *
 *   1. 未解析的 wikilink —— [[名字]] 在站内找不到对应笔记
 *      （Hugo 只报名字，脚本再回内容目录里 grep 出是哪几篇用了它）
 *   2. 失效的内链 —— [文字](/path/) 指向不存在的页面或静态文件
 *
 * 有任何一条就退出码 1，用来卡发布流程：
 *
 *   npm run check-links              # 独立检查
 *   npm run check-links -- --warn-only   # 只报告，不失败
 *
 * 注意：判定逻辑只有一份——Hugo 模板（layouts/_partials/content/render-content.html、
 * layouts/_markup/render-link.html）。这个脚本不重新实现解析规则，只读构建结果，
 * 避免两套规则各说各话。
 */

const ROOT = process.cwd();
const warnOnly = process.argv.includes("--warn-only");

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

// ── 1. 构建并收集警告 ────────────────────────────────────────────────
const res = spawnSync("hugo", ["--buildFuture", "--renderToMemory"], {
  cwd: ROOT,
  encoding: "utf8",
});

if (res.error) fail(`跑不了 hugo：${res.error.message}`);
const log = `${res.stderr || ""}\n${res.stdout || ""}`;

if (/ERROR/.test(log) && !/^WARN/m.test(log)) {
  console.error("构建过程中出现 ERROR，先修构建：");
  console.error(log.split("\n").filter((l) => l.includes("ERROR")).slice(0, 10).join("\n"));
  process.exit(2);
}

const unresolved = [
  ...new Set(
    // 宽松匹配到行尾再剥掉固定后缀：畸形内容（如表格里被切成
    // [[x</td><td>别名]] 的链接）不会因为没有以 ]] 结尾而漏检
    [...log.matchAll(/^WARN\s+wikilink: unresolved \[\[(.*)$/gm)].map((m) =>
      m[1]
        .replace(/\s+—\s+站内没有.*$/, "")
        .replace(/\]\]$/, "")
        .trim()
    )
  ),
];
const deadLinks = [...log.matchAll(/WARN\s+link: unresolved internal link "([^"]+)" on (\S+)/g)]
  .map((m) => ({ href: m[1], page: m[2] }));

// ── 2. 定位是哪些文件用了没解析成功的 wikilink ───────────────────────
const contentFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".md")) contentFiles.push(p);
  }
})(join(ROOT, "content"));

function usagesOf(target) {
  const base = target.split("|")[0].split("#")[0].trim();
  const needles = [`[[${target}]]`, `[[${base}]]`, `[[${base}|`, `[[${base}#`];
  return contentFiles
    .filter((f) => {
      const text = readFileSync(f, "utf8");
      return needles.some((n) => text.includes(n));
    })
    .map((f) => relative(ROOT, f));
}

// ── 3. 报告 ─────────────────────────────────────────────────────────
const total = unresolved.length + deadLinks.length;

if (total === 0) {
  console.log("✓ 链接检查通过：没有未解析的 wikilink，也没有失效内链。");
  process.exit(0);
}

console.log(`链接检查：发现 ${total} 个问题\n`);

if (unresolved.length) {
  console.log(`✗ 未解析的 wikilink（${unresolved.length}）`);
  for (const target of unresolved) {
    console.log(`  · [[${target}]]`);
    for (const file of usagesOf(target)) console.log(`      在 ${file}`);
  }
  console.log("");
}

if (deadLinks.length) {
  console.log(`✗ 失效的内链（${deadLinks.length}）`);
  for (const { href, page } of deadLinks) {
    console.log(`  · ${href}\n      在 ${page}`);
  }
  console.log("");
}

if (warnOnly) {
  console.log("（--warn-only：仅报告，不影响退出码）");
  process.exit(0);
}

console.log("失败：修掉上面这些问题再发布（或先跑 npm run dev 看渲染效果）。");
process.exit(1);

    break;
  }
  case "unicode": {
/**
 * check-unicode.mjs — 伪 ASCII / 全角标点检查 / 发布闸门
 *
 * 背景：content/ 里混入「看着像 ASCII、码位却不是」的字符。最狠的一类是
 * 全角括号落在 Markdown 的**语法位置**上 —— Goldmark 只按 ASCII `[` `]` `(` `)`
 * 认链接，全角括号它当普通文字，于是链接静默失效，而且失败方式是**吞并相邻链接**：
 *
 *   - [A］(https://a.example) 说明文字［B](https://b.example)
 *     └─ 整行变成一个指向 b 的链接，[[A]] 的地址当文字裸露在页面上
 *
 * 2026-09 实测命中 content/online-reading/2025.md:9，线上丢了 nesslabs 那条链接。
 *
 * 检查分两级：
 *
 *   ERROR（退出码 1，卡发布）—— 全角括号出现在链接语法位置、零宽字符混入正文
 *   WARN （默认只报告）      —— 仿冒 ASCII 字符、NBSP/细空格、部首/兼容汉字
 *                              --strict 时 WARN 也算失败
 *
 * 用法：
 *   node scripts/check.mjs unicode                 # 检 content/，ERROR 失败 WARN 提示
 *   npm run check-unicode -- --list       # WARN 也打全部明细
 *   npm run check-unicode -- --strict     # WARN 也当失败（CI 上更严）
 *   npm run check-unicode -- --content /path/to/dir
 *
 * 跳过：围栏代码块（``` / ~~~）与 <script>/<style> 块 —— 里面是字面量，不参与
 * Markdown 解析。行内代码 `` `x` `` 对 WARN 视而不见（文档页会故意写这些符号）。
 * 仍嫌吵就在那一行加 `<!-- unicode-ok -->`，整行跳过。
 *
 * 自测：node scripts/check.mjs unicode-selftest（用 fixture 断言能否抓到真 bug、有没有误报）
 */

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const optOf = (f, d) => {
  const i = argv.indexOf(f);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const ROOT = process.cwd();
const CONTENT = resolve(ROOT, optOf("--content", "content"));
const LIST = has("--list");
const STRICT = has("--strict");

// 白名单：本来就该是全角的中文/日文标点，不算问题。
// ①-⑩ 也收进来 —— 中文行文里当序号用属惯例，不在正文序号上刷屏；
// ⑪ 以上（sex.md 里被拿来当 11-20 的列表序号）仍会 WARN。
// 注意 ～ ｜ ・ 是中文排版惯例（范围号、分隔号），特意不报
const LEGIT = new Set([
  ..."，。、；：？！（）【】《》〈〉「」『』〔〕“”‘’·…—–～｜・",
]);
for (let cp = 0x2460; cp <= 0x2469; cp++) LEGIT.add(String.fromCodePoint(cp));
// 上下标：mc²、m³、×10¹²/L、Ca²⁺、H₂S 是正常的单位/化学式记法，不报
for (const r of [[0x2070, 0x209f], [0x00b2, 0x00b3], [0x00b9, 0x00b9]]) {
  for (let cp = r[0]; cp <= r[1]; cp++) LEGIT.add(String.fromCodePoint(cp));
}

const RULES = {
  // ── ERROR ───────────────────────────────────────────────────────
  // 中间不允许出现 [ ] （ ］ 等括号：否则 `（见 [参考](url)）` 这种
  // 「中文括号 + 正常链接」会被误判
  // E1: 全角括号当链接开头 —— ```［文字](url)``` / ```（文字](url)```
  E1: {
    re: /[［（]([^［（］）\[\]\n]{1,200})\]\((?=[^\s)]*(?:https?:|\/|#|mailto:))/g,
    msg: "全角开括号当链接开头，链接整条失效（文字会裸露）",
  },
  // E2: 全角闭合括号紧接 (url) —— ```[文字］(url)```
  E2: {
    re: /\[([^\[\]\n]{1,200})[］）]\s*\((?=[^\s)]*(?:https?:|\/|#|mailto:))/g,
    msg: "全角闭括号当链接结尾，链接整条失效，并会吞并相邻链接",
  },
  // E3: 图片同款
  E3: {
    re: /!\[([^\[\]\n]{1,200})[］）]\s*\(/g,
    msg: "全角闭括号当图片链接结尾",
  },
};

// ── WARN 分类 ─────────────────────────────────────────────────────
const CJK_RADICALS = (cp) => cp >= 0x2e80 && cp <= 0x2ef3; // ⻄ 部首
const COMPAT_PUNCT = (cp) => cp >= 0xfe30 && cp <= 0xfe4f; // ﹏ ︵ 等兼容形式
const ARABIC_DIGITS = (cp) => cp >= 0x06f0 && cp <= 0x06f9; // ۰ 阿拉伯-印数字
const COMPAT_CJK = (cp) => cp >= 0xf900 && cp <= 0xfaff; // 兼容汉字
const SPACES = new Set([0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000]);
const ZERO_WIDTH = new Set([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff]);

function foldToAscii(ch) {
  const n = ch.normalize("NFKC");
  return n !== ch && /^[\x20-\x7e]+$/.test(n) ? n : null;
}

let EMOJI;
try {
  EMOJI = /\p{Extended_Pictographic}/u;
} catch {
  EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u; // 老 node 兜底
}

// ── 遍历 content/ ────────────────────────────────────────────────
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".md")) files.push(p);
  }
})(CONTENT);

const errors = [];
const warns = [];
const warnByKind = new Map();

function addWarn(kind, file, line, ch, ctx) {
  warns.push({ kind, file, line, ch, ctx });
  const key = `${kind}|${ch}`;
  warnByKind.set(key, (warnByKind.get(key) ?? 0) + 1);
}

function stripInlineCode(line) {
  // `code` 里的内容不参与 WARN；用等长空白替换，保持列号/上下文对齐
  return line.replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length));
}

for (const file of files) {
  // 检的是 <cwd>/content 时显示相对路径；--content 指到别处（如测试 fixture）就显示绝对路径
  const rel = file.startsWith(ROOT + "/") ? relative(ROOT, file) : file;
  const lines = readFileSync(file, "utf8").split("\n");
  let fence = null;
  let raw = null; // <script> / <style> 块

  lines.forEach((line, i) => {
    const ln = i + 1;
    const t = line.trim();

    const f = t.match(/^(```+|~~~+)/);
    if (f) {
      if (fence === null) fence = f[1][0];
      else if (t.startsWith(fence)) fence = null;
      return;
    }
    if (/^<(script|style)\b/i.test(t)) raw = t.match(/^<(\w+)/i)[1].toLowerCase();
    else if (raw && new RegExp(`^</${raw}>`, "i").test(t)) raw = null;
    if (fence !== null || raw !== null) return; // 字面量区，两种检查都跳过
    // 行内开关：文档页要故意写这些符号时，在该行加 `<!-- unicode-ok -->`
    if (line.includes("<!-- unicode-ok -->")) return;

    // ── ERROR：语法位上的全角括号 ──────────────────────────────
    for (const [code, rule] of Object.entries(RULES)) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        errors.push({ code, file: rel, line: ln, msg: rule.msg, hit: m[0].slice(0, 90), ctx: t.slice(0, 110) });
      }
    }

    // ── ERROR：零宽字符 ────────────────────────────────────────
    // 按码点遍历：emoji 是代理对，用 UTF-16 下标取 prev/next 会切到半个字符
    const cps = Array.from(line);
    cps.forEach((one, idx) => {
      const cp = one.codePointAt(0);
      if (cp === 0x200d) {
        const prev = cps[idx - 1] ?? "";
        const next = cps[idx + 1] ?? "";
        if (!(EMOJI.test(prev) && EMOJI.test(next))) {
          errors.push({ code: "E4", file: rel, line: ln, msg: "ZWJ 不在 emoji 序列里（ZWJ 只能用于拼接 emoji）", hit: "ZWJ", ctx: t.slice(0, 110) });
        }
      } else if (ZERO_WIDTH.has(cp)) {
        errors.push({ code: "E4", file: rel, line: ln, msg: "零宽字符混入正文", hit: `U+${cp.toString(16).toUpperCase()}`, ctx: t.slice(0, 110) });
      }
    });

    // ── WARN ──────────────────────────────────────────────────
    const scan = stripInlineCode(line);
    for (const ch of scan) {
      const cp = ch.codePointAt(0);
      if (cp < 0x80) continue;
      if (CJK_RADICALS(cp)) addWarn("部首/CJK 部首补充", rel, ln, ch, t);
      else if (COMPAT_PUNCT(cp)) addWarn("兼容形式标点", rel, ln, ch, t);
      else if (COMPAT_CJK(cp)) addWarn("兼容汉字", rel, ln, ch, t);
      else if (ARABIC_DIGITS(cp)) addWarn("阿拉伯-印数字", rel, ln, ch, t);
      else if (SPACES.has(cp)) addWarn("非标准空格(NBSP/细空格/全角空格)", rel, ln, ch, t);
      else if (LEGIT.has(ch)) continue;
      else if (foldToAscii(ch) !== null || /[\u{2460}-\u{24ff}\u{2160}-\u{217f}\u{2070}-\u{209f}\u{1d400}-\u{1d7ff}]/u.test(ch)) {
        addWarn("仿冒 ASCII（全角/带圈/罗马/上下标/数学字母）", rel, ln, ch, t);
      }
    }
  });
}

// ── 报告 ─────────────────────────────────────────────────────────
if (errors.length) {
  console.log(`✗ 伪 ASCII 检查：${errors.length} 个 ERROR（会破坏 Markdown 结构）\n`);
  for (const e of errors) {
    console.log(`  [${e.code}] ${e.file}:${e.line}  ${e.msg}`);
    console.log(`        命中「${e.hit}」`);
    console.log(`        行：${e.ctx}`);
  }
  console.log("");
}

if (warns.length) {
  console.log(`⚠ 伪 ASCII 检查：${warns.length} 个 WARN（不影响渲染，但复制/搜索/正则踩坑）\n`);
  const byKind = new Map();
  for (const w of warns) {
    if (!byKind.has(w.kind)) byKind.set(w.kind, new Map());
    const m = byKind.get(w.kind);
    m.set(w.ch, (m.get(w.ch) ?? 0) + 1);
  }
  for (const [kind, chars] of byKind) {
    const top = [...chars.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    console.log(`  ${kind}`);
    console.log(`    共 ${[...chars.values()].reduce((a, b) => a + b, 0)} 处：` + top.map(([c, n]) => `${c}×${n}`).join(" "));
  }
  const byFile = new Map();
  for (const w of warns) byFile.set(w.file, (byFile.get(w.file) ?? 0) + 1);
  const topFiles = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`\n  最多的文件：`);
  for (const [f, n] of topFiles) console.log(`    ${n} 处  ${f}`);
  if (LIST) {
    console.log(`\n  全部明细：`);
    for (const w of warns) console.log(`    ${w.file}:${w.line}  「${w.ch}」  ${w.ctx.slice(0, 90)}`);
  } else {
    console.log(`\n  （--list 看全部明细，--strict 让 WARN 也失败）`);
  }
  console.log("");
}

if (errors.length) {
  console.log("失败：先修 ERROR。全角括号要换成 ASCII '[' ']' '(' ')'，链接才能被解析。");
  process.exit(1);
}
if (warns.length && STRICT) {
  console.log("失败（--strict）：WARN 也需要处理。");
  process.exit(1);
}
console.log(
  warns.length
    ? `✓ 没有 ERROR；${warns.length} 个 WARN 见上（不阻断发布）。`
    : "✓ 伪 ASCII 检查通过：没有全角括号破坏链接，也没有零宽字符。"
);
process.exit(0);

    break;
  }
  case "unicode-selftest": {
    /**
     * check-unicode 的自测（原 scripts/test-check-unicode.sh 移植为内联 Node 版）：
     * 一个检查脚本最怕两件事——抓不到真问题（漏报）、把正常内容当问题（误报）。
     * 两组 fixture 断言这两件事，顺手断言退出码——因为它是发布闸门。
     */
    const TMP = mkdtempSync(join(tmpdir(), "check-selftest-"));
    process.on("exit", () => { try { rmSync(TMP, { recursive: true, force: true }); } catch {} });

    const BAD = join(TMP, "bad"), OK = join(TMP, "ok");
    mkdirSync(BAD, { recursive: true });
    mkdirSync(OK, { recursive: true });

    // 坏的：复刻 2026-09 线上真实故障（content/online-reading/2025.md:9）的字面形态
    writeFileSync(join(BAD, "broken.md"),
      "---\ntitle: bad\n---\n\n" +
      "- [The Alchemy of Generative Questions\uff3d(https://nesslabs.com/x) :star: 说明 \uff3bAsking Better Questions](https://tandf.example/y)\n" +
      "- [\u53e6\u4e00\u6761\uff3d(https://example.com/a)\n" +
      "- ![\u56fe\uff3d(/images/x.png)\n" +
      "\u8fd9\u4e00\u884c\u6709\u96f6\u5bbd\u200c\u5b57\u7b26\u3002\n" +
      "emoji 👨‍🌾 不该报。\n");

    // 好的：中文标点、～｜・、①、上下标、NBSP、围栏里的全角括号、行内代码、行内开关
    writeFileSync(join(OK, "good.md"),
      "---\ntitle: good\n---\n\n" +
      "\u4e2d\u6587\uff0c\u6807\u70b9\u3002\u5e94\u5f53\uff1a\u5168\u89d2\u3010\u6b63\u5e38\u3011\u300c\u5f15\u53f7\u300d\uff5e\u8303\u56f4\u300c \uff5c \u5206\u9694 \u00b7 \u95f4\u9694 \u2460\u5e8f\u53f7 E=mc\u00b2 \u00d710\u00b9\u00b2 \u03bc\u00b1\u00b0\u00e9\n" +
      "\u6b63\u5e38\u94fe\u63a5\uff08[\u53c2\u8003](https://example.com/x)\uff09\u4e0d\u8b66\u544a\n" +
      "emoji 👨‍🌾 👨‍🎓 不警告\n" +
      "\uff3b\u8fd9\u884c\u6709\u5168\u89d2\u62ec\u53f7\u4f46\u6807\u4e86\u5f00\u5173\uff3d(https://example.com/z) <!-- unicode-ok -->\n" +
      "\n```text\n\uff3b\u56f4\u680f\u91cc\u7684\u4e0d\u7b97\uff3d(https://example.com/w)\n```\n\n" +
      "\u884c\u5185\u4ee3\u7801 `\uff05 \uff31 \uff51` \u4e0d\u7b97\n");

    let fail = 0;
    const pass = (m) => console.log(`  \u2713 ${m}`);
    const nope = (m) => { console.log(`  \u2717 ${m}`); fail = 1; };
    const run = (args) => {
      try {
        const out = execFileSync(process.execPath, [process.argv[1], "unicode", ...args],
          { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        return { code: 0, out };
      } catch (e) {
        return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
      }
    };

    console.log("\u2500\u2500 check-unicode \u81ea\u6d4b \u2500\u2500");

    // 1. 坏样本：退出码 1，E1-E4 都点到文件名，零宽字符点出码位，ZWJ 不误报
    const bad = run(["--content", BAD]);
    bad.code === 1 ? pass("\u574f\u6837\u672c\u9000\u51fa\u7801 1") : nope(`\u574f\u6837\u672c\u9000\u51fa\u7801 ${bad.code}\uff08\u5e94\u4e3a 1\uff09`);
    for (const c of ["E1", "E2", "E3", "E4"]) {
      new RegExp(`\\[${c}\\].*broken\\.md`, "m").test(bad.out) ? pass(`\u6293\u5230 ${c}`) : nope(`\u6f0f\u62a5 ${c}`);
    }
    /ZWNJ|U\+200C/.test(bad.out) ? pass("\u96f6\u5bbd\u5b57\u7b26\u88ab\u70b9\u51fa\u7801\u4f4d") : nope("\u96f6\u5bbd\u5b57\u7b26\u6ca1\u70b9\u51fa\u7801\u4f4d");
    /broken\.md:6.*ZWJ/.test(bad.out) ? nope("emoji \u91cc\u7684 ZWJ \u88ab\u8bef\u62a5") : pass("emoji \u91cc\u7684 ZWJ \u6ca1\u8bef\u62a5");

    // 2. 好样本：干净 + 退出码 0，且 --strict 下也干净
    const good = run(["--content", OK, "--strict"]);
    if (good.code === 0) pass("\u597d\u6837\u672c --strict \u9000\u51fa\u7801 0");
    else { nope(`\u597d\u6837\u672c --strict \u9000\u51fa\u7801 ${good.code}`); console.log(good.out.split("\n").slice(0, 6).join("\n")); }
    if (/\u4e2a ERROR/.test(good.out)) { nope("\u597d\u6837\u672c\u51fa\u73b0 ERROR"); console.log(good.out.split("\n").slice(0, 6).join("\n")); }
    else pass("\u597d\u6837\u672c 0 ERROR");
    /^\s*\u2713/m.test(good.out) ? pass("\u597d\u6837\u672c\u8f93\u51fa\u901a\u8fc7\u6807\u8bb0") : nope("\u597d\u6837\u672c\u6ca1\u8f93\u51fa\u901a\u8fc7\u6807\u8bb0");

    // 3. 真实 content/：必须 0 ERROR（WARN 不阻断）
    const real = run([]);
    if (real.code === 0) pass("\u771f\u5b9e content/ \u9000\u51fa\u7801 0\uff08\u65e0 ERROR\uff09");
    else { nope(`\u771f\u5b9e content/ \u9000\u51fa\u7801 ${real.code}`); console.log(real.out.split("\n").filter(l => l.includes("ERROR")).slice(0, 8).join("\n")); }

    console.log("");
    console.log(fail === 0 ? "\u5168\u90e8\u901a\u8fc7\u3002" : "\u6709\u65ad\u8a00\u5931\u8d25\u3002");
    process.exit(fail);
  }
  case "photos": {
/**
 * photo-guard 白名单闸单测（本地 node 直接跑，不需要 wrangler）：
 *   node scripts/check.mjs photos
 *
 * 守的是用户硬约束：只有 allowlist 里的 key 能放行，其余全 404。
 */

const dir = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname);
const allow = new Set(JSON.parse(readFileSync(resolve(dir, 'data/photos-allowlist.json'), 'utf8')));
const sample = [...allow][0] ?? null;

// 1. 空清单 = 全拒（上线兜底窗口不存在）
if (allow.size === 0) {
  assert.equal(resolvePhotoKey('/photos/2026/20261005_Shenzhen_1.webp', allow), null);
  assert.equal(resolvePhotoKey('/photos/t/2026/20261005_Shenzhen_1.webp', allow), null);
  console.log('ok: 空清单全拒');
} else {
  // 2. 清单内三档全放行
  assert.equal(resolvePhotoKey(`/photos/${sample}`, allow), sample);
  assert.equal(resolvePhotoKey(`/photos/t/${sample}`, allow), `t/${sample}`);
  assert.equal(resolvePhotoKey(`/photos/h/${sample}`, allow), `h/${sample}`);
  // 3. 中文/空格/全角 key 的百分号编码往返
  const cjk = sample;
  if (/[^\x00-\x7f]/.test(cjk)) {
    assert.equal(resolvePhotoKey(`/photos/${encodeURIComponent(cjk)}`, allow), cjk);
  }
  console.log(`ok: 清单内 ${allow.size} key 三档放行`);
}

// 4. 清单外的一切必须拒（前缀像也没用）
const outside = [
  '/photos/2026/20260926_Shenzhen_9.webp', // 同年份、未点名
  '/photos/t/2026/20260926_Shenzhen_9.webp',
  '/photos/h/2025/20250101_Shenzhen_1.webp', // 别的年份
  '/photos/2019/20190424_Fushun.jpg',
  '/photos/net/文森· 威廉·梵高 - 雷云下的麦田.webp', // net/ 不在放行范围
  '/photos/_index.json', // 桶里其它对象
  '/photos/t/../2026/20261005_Shenzhen_1.webp', // 路径穿越
  '/photos/2026/../../etc/passwd',
  '/photos/', // 空
  '/photos', // 无前缀
  '/photos/2026', // 目录形态
];
for (const p of outside) {
  assert.equal(resolvePhotoKey(p, allow), null, `应拒绝: ${p}`);
}
console.log(`ok: ${outside.length} 条越权路径全拒`);

// 4b. 编码/归一化层 —— 审计后补的向量（2026-10-07线��全审计）：
//     resolvePhotoKey 拿到的是 WHATWG 归一化后的 pathname，但这里故意喂
//     未归一化/编码过的形态，验证 guard 自身的防御深度（不依赖归一化）。
const encoded = [
  `/photos/t/2026/%2e%2e/2026/${sample.split('/')[1]}`,          // 编码穿越：decode 后含 ../，regex 拒
  `/photos/t/2026/${sample.split('/')[1]}`.replace(/\.webp$/, '.WEBP'), // 大小写变体：Set 精确匹配拒
  `/photos/t/${sample}%00.jpg`,                    // NUL 拖挂：Set 精确匹配拒
  `/photos/t/${sample}%20`,                        // 空格拖挂：regex 结尾拒
  `/photos//${sample}`,                            // 双斜杠：rest 以 / 开头拒（线上靠归一化归到正牌）
  '/photos/t/%2e%2e%2f%2e%2e%2fwrangler.jsonc',     // 嵌套解码穿越
  '/photos/%252e%252e%252fetc%252fpasswd',          // 双重编码（只解一次，不猜测）
];
for (const p of encoded) {
  assert.equal(resolvePhotoKey(p, allow), null, `编码变体应拒绝: ${p}`);
}
console.log(`ok: ${encoded.length} 条编码/归一化变体全拒`);

// 5. key 形态守卫
assert.ok(PHOTO_KEY_RE.test('2026/20261005_Shenzhen_1.webp'));
assert.ok(!PHOTO_KEY_RE.test('2026/nested/20261005.webp')); // 不许子目录
assert.ok(!PHOTO_KEY_RE.test('t/2026/20261005_Shenzhen_1.webp')); // 前缀由外层剥
console.log('ok: key 正则');

console.log('photo-guard: all passed');
    process.exit(0);
    break;
  }
  case "external": {
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
 *   node scripts/check.mjs external                  # 全量扫描（首次约 1h，之后走缓存很快）
 *   node scripts/check.mjs external --limit 50       # 只探前 50 个（试水）
 *   node scripts/check.mjs external --host github.com
 *   node scripts/check.mjs external --json /tmp/ext.json
 *   node scripts/check.mjs external --no-cache --warn-only
 *   node scripts/check.mjs external --refresh-dead   # 强制复核上次判死的
 *   node scripts/check.mjs external --list           # 只列 URL 不探测
 *   node scripts/check.mjs external --no-wayback     # 跳过 Wayback 存档查询
 *   node scripts/check.mjs external --recheck-verified  # 连账本里的也重探
 *
 * 已确认非死链账本：scripts/data/external-links-verified.txt
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
 * 忽略名单：scripts/data/external-link-ignore.txt，一行一条（# 注释，子串匹配），
 * 用来压掉已知被 WAF 挡死、或有意保留的历史链接。
 *
 * 退出码：0 = 没有死链；1 = 有死链/服务端错（--warn-only 时恒为 0）
 */

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const CACHE_FILE = join(ROOT, ".hermes/external-links/cache.json");
const IGNORE_FILE = join(ROOT, "scripts/data/external-link-ignore.txt");
const VERIFIED_FILE = join(ROOT, "scripts/data/external-links-verified.txt");

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
// scripts/data/external-links-verified.txt：一行一条 `YYYY-MM-DD <URL>`，
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

    break;
  }
}

console.error("✗ 子命令未显式退出");
process.exit(2);
