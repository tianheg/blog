#!/usr/bin/env python3
"""清理死链：把指向不存在目标的 Markdown 内链降级成纯文本。

判定用 Hugo 自己（跑一次构建、读它的 WARN），而不是在 Python 里另写一套路径规则——
这样 taxonomy 页（/tags/…）、section 页（/posts）这些"不是 md 文件但真实存在"的目标
不会被误判，代码块里的示例也不会被误抓。

用法：python3 /tmp/fix-deadlinks.py --dry-run | (无参数写入)
"""
import os, re, sys, subprocess

BLOG = "/root/projects/blog"
ROOT = os.path.join(BLOG, "content")
LINK = re.compile(r"(?<!!)\[([^\[\]]+)\]\((/[^)\s]*)\)")
dry = "--dry-run" in sys.argv

# ── 问 Hugo：哪些内链是坏的 ──────────────────────────────────────
res = subprocess.run(["hugo", "--buildFuture", "--renderToMemory"],
                     cwd=BLOG, capture_output=True, text=True)
log = res.stderr + res.stdout
dead = {}
for m in re.finditer(r'WARN\s+link: unresolved internal link "([^"]+)" on (\S+)', log):
    dead.setdefault(m.group(1), []).append(m.group(2))

if not dead:
    print("没有死链，无需处理。")
    sys.exit(0)

print(f"Hugo 报告 {len(dead)} 个失效目标：")
for href, pages in dead.items():
    print(f"  {href}   ← {', '.join(pages)}")
print()

# ── 在源文件里把这些链接降级为纯文本 ─────────────────────────────
pages = {}
for dp, _, fs in os.walk(ROOT):
    for f in fs:
        if f.endswith(".md") and not f.startswith("_index"):
            pages[os.path.relpath(os.path.join(dp, f), ROOT)] = os.path.join(dp, f)

changes = []
for rel, full in sorted(pages.items()):
    text = open(full, encoding="utf-8").read()

    def repl(m):
        label, url = m.group(1), m.group(2)
        if url not in dead:
            return m.group(0)
        changes.append((rel, m.group(0), label))
        return label

    new = LINK.sub(repl, text)
    if new != text and not dry:
        open(full, "w", encoding="utf-8").write(new)

mode = "干跑（未写入）" if dry else "已写入"
print(f"降级为纯文本 — {mode}：{len(changes)} 处，涉及 {len({c[0] for c in changes})} 个文件\n")
for rel, old, label in changes:
    print(f"  {rel}")
    print(f"    - {old}")
    print(f"    + {label}")
