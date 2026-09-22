#!/usr/bin/env python3
"""suggest-links — 写笔记时提示"站内哪些笔记和这篇相关"。

动机：花园的瓶颈不在展示，而在关系根本没被创造出来（当前 1564 页只有 119 条边，
91.6% 是孤立的）。显式链接是作者的判断，稀疏且贵；语义相似是机器的发现，稠密且免费。
这个脚本把后者摆到你面前，决定权仍在你手里。

数据复用已有的语义搜索 embeddings（bge-m3 / 1024 维 / 已 L2 归一化，
static/pagefind-semantic/），所以零额外成本、不装任何依赖。

用法：
  python3 scripts/suggest-links.py til/life/laptop-maintenance.md
  python3 scripts/suggest-links.py content/til/life/laptop-maintenance.md --top 15
  python3 scripts/suggest-links.py <file> --all      # 连已经链接过的也列出来（默认排除）

输出按相似度降序，并直接给出可直接粘贴的 wikilink 写法。
"""
import array
import json
import os
import re
import sys
from urllib.parse import quote

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM_DIR = os.path.join(BLOG, "static", "pagefind-semantic")
EMB_FILE = os.path.join(SEM_DIR, "embeddings.bin")
PAGES_FILE = os.path.join(SEM_DIR, "pages.json")
MANIFEST = os.path.join(SEM_DIR, "manifest.json")


def load_index():
    with open(PAGES_FILE, encoding="utf-8") as f:
        pages = json.load(f)
    dim = 1024
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            dim = json.load(f).get("dim", dim)
    with open(EMB_FILE, "rb") as f:
        raw = f.read()
    vecs = array.array("f")
    vecs.frombytes(raw)
    if len(vecs) != len(pages) * dim:
        print(f"ERROR: embeddings 大小与 pages.json 不匹配"
              f"（{len(vecs)} != {len(pages)}×{dim}）—— 先跑 npm run embed", file=sys.stderr)
        sys.exit(2)
    return pages, vecs, dim


def find_target(pages, arg):
    """把命令行给的路径/文件名/标题解析成 permalink。"""
    norm = arg.strip()
    if norm.startswith(str(BLOG)):
        norm = os.path.relpath(norm, BLOG)
    if norm.startswith("content/"):
        norm = norm[len("content/"):]
    if norm.endswith(".md"):
        norm = norm[:-3]
    # Hugo 的 permalink 小写 + 非 ASCII percent-encoded；两边都按同样规则归一后比较
    want = quote(("/" + norm.strip("/") + "/").lower(), safe="/-_.~")
    for p in pages:
        if quote(p["url"].lower(), safe="/-_.~") == want:
            return p["url"]
    # 退一步：按文件名后缀匹配
    tail = want.rstrip("/").split("/")[-1]
    hits = [p for p in pages if quote(p["url"].lower(), safe="/-_.~").rstrip("/").split("/")[-1] == tail]
    if len(hits) == 1:
        return hits[0]["url"]
    if len(hits) > 1:
        print(f"名字 {tail!r} 对应多篇，请给更完整的路径：", file=sys.stderr)
        for h in hits:
            print(f"  {h['url']}", file=sys.stderr)
        sys.exit(2)
    return None


def build_name_index(pages):
    idx = {}
    for p in pages:
        base = p["url"].strip("/").split("/")[-1].lower()
        idx.setdefault(base, p["url"])
        idx.setdefault(p.get("title", "").strip().lower(), p["url"])
    return idx


def linked_from(text, name_idx):
    """笔记里已经指向了哪些页面（Markdown 链接 + wikilink）。"""
    out = set()
    for m in re.finditer(r"\]\((/[^)\s#]+)\)", text):
        u = m.group(1)
        out.add(u if u.endswith("/") else u + "/")
    for m in re.finditer(r"\[\[([^\]\[]+)\]\]", text):
        name = m.group(1).split("|")[0].split("#")[0].strip().lower()
        if name in name_idx:
            out.add(name_idx[name])
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    top = 10
    if "--top" in sys.argv:
        top = int(sys.argv[sys.argv.index("--top") + 1])
    show_all = "--all" in sys.argv

    if not args:
        print(__doc__)
        sys.exit(0)

    pages, vecs, dim = load_index()
    target = find_target(pages, args[0])
    if not target:
        print(f"找不到对应页面: {args[0]}", file=sys.stderr)
        sys.exit(2)

    rel = target.strip("/")
    src = os.path.join(BLOG, "content", rel + ".md")
    text = open(src, encoding="utf-8").read() if os.path.exists(src) else ""
    name_idx = build_name_index(pages)
    already = linked_from(text, name_idx)

    ti = next(i for i, p in enumerate(pages) if p["url"] == target)
    tv = vecs[ti * dim:(ti + 1) * dim]

    scored = []
    for i, p in enumerate(pages):
        if p["url"] == target:
            continue
        if not show_all and p["url"] in already:
            continue
        v = vecs[i * dim:(i + 1) * dim]
        score = sum(a * b for a, b in zip(tv, v))  # 已 L2 归一化 → 点积即 cosine
        scored.append((score, p))
    scored.sort(key=lambda x: -x[0])

    t = next(p for p in pages if p["url"] == target)
    print(f"目标：{t.get('title','')}  ({target})")
    if already and not show_all:
        print(f"已链接 {len(already)} 篇，已从建议中排除（--all 可全部显示）")
    print()
    for score, p in scored[:top]:
        slug = p["url"].strip("/").split("/")[-1]
        print(f"  {score:.3f}  {p.get('title','')[:46]}")
        print(f"          [[{slug}|{p.get('title','')[:24]}]]   {p['url']}")


if __name__ == "__main__":
    main()
