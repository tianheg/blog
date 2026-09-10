#!/usr/bin/env node
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
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

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
