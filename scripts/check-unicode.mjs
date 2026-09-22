#!/usr/bin/env node
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
 *   npm run check-unicode                 # 检 content/，ERROR 失败 WARN 提示
 *   npm run check-unicode -- --list       # WARN 也打全部明细
 *   npm run check-unicode -- --strict     # WARN 也当失败（CI 上更严）
 *   npm run check-unicode -- --content /path/to/dir
 *
 * 跳过：围栏代码块（``` / ~~~）与 <script>/<style> 块 —— 里面是字面量，不参与
 * Markdown 解析。行内代码 `` `x` `` 对 WARN 视而不见（文档页会故意写这些符号）。
 * 仍嫌吵就在那一行加 `<!-- unicode-ok -->`，整行跳过。
 *
 * 自测：bash scripts/test-check-unicode.sh（用 fixture 断言能否抓到真 bug、有没有误报）
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

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
