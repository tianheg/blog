#!/usr/bin/env python3
"""把 content/ 里指向站内笔记的 Markdown 链接改造成 wikilink。

规则：
  [文字](/til/software/git-rebase/)        → [[git-rebase|文字]]
  [文字](/til/life/laptop-maintenance/#锚点) → [[laptop-maintenance#锚点|文字]]
  重名 basename（posts 与 til 同名等）      → [[til/courses/open-xxx|文字]]（路径形式；Obsidian 也认）

跳过（原样保留）：
  - 目标不是 posts/til 笔记（静态文件、tag 页、老站路径）
  - 目标不存在（现有死链，交给 check-links 逐条处理）
  - 图片 ![alt](url)

用法：
  python3 scripts/migrate-to-wikilink.py --dry-run   # 只预览
  python3 scripts/migrate-to-wikilink.py             # 写入
"""
import os, re, sys, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content")
ROOT = os.path.normpath(ROOT)
LINK = re.compile(r"(?<!!)\[([^\[\]]+)\]\((/[^)\s]*)\)")
dry = "--dry-run" in sys.argv

# ── 建立目标索引 ────────────────────────────────────────────────
pages = {}
basename_count = collections.Counter()
for dirpath, _, files in os.walk(ROOT):
    for f in files:
        if not f.endswith(".md") or f.startswith("_index"):
            continue
        rel = os.path.relpath(os.path.join(dirpath, f), ROOT)
        if rel.startswith(("til/", "posts/")):
            pages[rel] = os.path.join(dirpath, f)
            basename_count[os.path.splitext(f)[0].lower()] += 1
dups = {k for k, v in basename_count.items() if v > 1}

# ── 逐个文件替换 ────────────────────────────────────────────────
changed, skipped = [], collections.Counter()
touched_files = set()

for rel, full in sorted(pages.items()):
    text = open(full, encoding="utf-8").read()

    def repl(m):
        label, url = m.group(1), m.group(2)
        path = url.split("#")[0].split("?")[0].strip("/")
        if not path:
            skipped["空路径"] += 1
            return m.group(0)
        target = path + ".md"
        if target not in pages:
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
