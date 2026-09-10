#!/usr/bin/env python3
"""把 content/ 里指向站内笔记的 Markdown 链接改造成 wikilink。

源：content/ 下所有 .md（含 posts/、til/、以及根目录独立页面如 start.md / watch.md）
目标：只能是 posts/til 笔记（wikilink-map 的解析范围）；指向 section 页、tag 页、
      静态文件、外站的链接原样保留。

规则：
  [文字](/til/software/git-rebase/)        → [[git-rebase|文字]]
  [文字](/til/life/laptop-maintenance/#锚点) → [[laptop-maintenance#锚点|文字]]
  重名 basename（posts 与 til 同名等）      → [[til/courses/open-xxx|文字]]（路径形式；Obsidian 也认）

用法：
  python3 scripts/migrate-to-wikilink.py --dry-run   # 只预览
  python3 scripts/migrate-to-wikilink.py             # 写入
"""
import os, re, sys, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content")
ROOT = os.path.normpath(ROOT)
LINK = re.compile(r"(?<!!)\[([^\[\]]+)\]\((/[^)\s]*)\)")
dry = "--dry-run" in sys.argv

# ── 目标索引（只有 posts/til 能被 wikilink 解析） ─────────────────
targets = {}
basename_count = collections.Counter()
sources = []
for dirpath, _, files in os.walk(ROOT):
    for f in files:
        if not f.endswith(".md") or f.startswith("_index"):
            continue
        full = os.path.join(dirpath, f)
        rel = os.path.relpath(full, ROOT)
        sources.append((rel, full))
        if rel.startswith(("til/", "posts/")):
            targets[rel] = full
            basename_count[os.path.splitext(f)[0].lower()] += 1
dups = {k for k, v in basename_count.items() if v > 1}

# ── 逐个文件替换 ────────────────────────────────────────────────
changed, skipped = [], collections.Counter()
touched_files = set()

for rel, full in sorted(sources):
    text = open(full, encoding="utf-8").read()

    def repl(m):
        label, url = m.group(1), m.group(2)
        path = url.split("#")[0].split("?")[0].strip("/")
        if not path:
            skipped["空路径"] += 1
            return m.group(0)
        target = path + ".md"
        if target not in targets:
            skipped["目标不是笔记/不存在"] += 1
            return m.group(0)

        anchor = "#" + url.split("#", 1)[1] if "#" in url else ""
        base = os.path.splitext(os.path.basename(target))[0]
        name = os.path.splitext(target)[0] if base.lower() in dups else base
        wl = f"[[{name}{anchor}|{label}]]"
        changed.append((rel, m.group(0), wl, base.lower() in dups))
        return wl

    new = LINK.sub(repl, text)
    if new != text:
        touched_files.add(rel)
        if not dry:
            open(full, "w", encoding="utf-8").write(new)

# ── 报告 ────────────────────────────────────────────────────────
mode = "干跑（未写入）" if dry else "已写入"
print(f"改造 wikilink — {mode}")
print(f"  替换：{len(changed)} 条，涉及 {len(touched_files)} 个文件")
print(f"  其中重名用路径形式：{sum(1 for c in changed if c[3])} 条")
print()
for rel, old, new, dup in changed[:8]:
    print(f"  {rel}{'  [路径形式]' if dup else ''}")
    print(f"    - {old}")
    print(f"    + {new}")
if len(changed) > 8:
    print(f"  … 其余 {len(changed) - 8} 条")
print()
print("跳过：")
for k, v in skipped.most_common():
    print(f"  {k}: {v}")
