#!/usr/bin/env python3
"""generate-related.py — 预生成"语义相关笔记"，供 Hugo 构建时服务端渲染。

数据源：static/pagefind-semantic/embeddings.bin
        （bge-m3 / 1024 维 / 已 L2 归一化，由 npm run embed 产出）
输出：  data/related.json —— { permalink: [相关 permalink, ...] }

规则：
  · cosine 相似度 Top N（默认 5），低于阈值（默认 0.62）不收
  · 排除自己，以及正文里已经显式链接过的（那些由「引用这篇的」/正文承担）
  · 只输出顺序，不输出分数（渲染用不到，省体积）

为什么预生成：Hugo 模板算不了向量。放 data/ 下，模板用 site.Data.related
直接读并渲染成 HTML —— 无客户端请求、无 JS，跟反链区一样是纯静态输出。

依赖：numpy（本机已有）。若环境没有：
  uv run --no-project --with numpy python3 scripts/generate-related.py
"""
import array
import json
import os
import re
import sys

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(BLOG, "static", "pagefind-semantic")
CONTENT = os.path.join(BLOG, "content")
OUT = os.path.join(BLOG, "data", "related.json")

TOP_N = 5
MIN_SCORE = 0.62


def load_semantic():
    pages = json.load(open(os.path.join(SEM, "pages.json"), encoding="utf-8"))
    manifest = json.load(open(os.path.join(SEM, "manifest.json"), encoding="utf-8"))
    dim = manifest.get("dim", 1024)
    vecs = array.array("f")
    with open(os.path.join(SEM, "embeddings.bin"), "rb") as f:
        vecs.frombytes(f.read())
    if len(vecs) != len(pages) * dim:
        print(f"ERROR: embeddings 与 pages.json 不匹配（{len(vecs)} != {len(pages)}×{dim}）"
              f"，先跑 npm run embed", file=sys.stderr)
        sys.exit(2)
    try:
        import numpy as np
    except ImportError:
        print("ERROR: 需要 numpy（uv run --no-project --with numpy python3 "
              "scripts/generate-related.py）", file=sys.stderr)
        sys.exit(2)
    mat = np.asarray(vecs, dtype="float32").reshape(len(pages), dim)
    return pages, mat


def link_index(pages):
    """文件名/标题 → permalink，用于识别正文里已有的 wikilink。"""
    idx = {}
    for p in pages:
        base = p["url"].strip("/").split("/")[-1].lower()
        idx.setdefault(base, p["url"])
        if p.get("title"):
            idx.setdefault(p["title"].strip().lower(), p["url"])
    return idx


def explicit_links(permalink, idx):
    """这篇笔记正文里已经指向了哪些页面。"""
    rel = permalink.strip("/")
    path = os.path.join(CONTENT, rel + ".md")
    if not os.path.exists(path):
        return set()
    text = open(path, encoding="utf-8").read()
    out = set()
    for m in re.finditer(r"\]\((/[^)\s#]+)\)", text):
        u = m.group(1)
        out.add(u if u.endswith("/") else u + "/")
    for m in re.finditer(r"\[\[([^\]\[]+)\]\]", text):
        name = m.group(1).split("|")[0].split("#")[0].strip().lower()
        if name in idx:
            out.add(idx[name])
    return out


def main():
    pages, mat = load_semantic()
    idx = link_index(pages)
    sims = mat @ mat.T  # 已 L2 归一化 → 点积即 cosine
    n = len(pages)

    related = {}
    for i, p in enumerate(pages):
        row = sims[i]
        order = row.argsort()[::-1]
        skip = explicit_links(p["url"], idx)
        picks = []
        for j in order:
            if j == i:
                continue
            url = pages[j]["url"]
            if url in skip:
                continue
            if row[j] < MIN_SCORE:
                break
            picks.append(url)
            if len(picks) >= TOP_N:
                break
        if picks:
            related[p["url"]] = picks

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(related, f, ensure_ascii=False, separators=(",", ":"))

    sizes = [len(v) for v in related.values()]
    print(f"data/related.json: {len(related)} 篇有相关笔记"
          f"（平均 {sum(sizes)/len(sizes):.1f} 条，共 {sum(sizes)} 条关系）")
    print(f"  {os.path.getsize(OUT)/1024:.0f} KB，阈值 {MIN_SCORE} / Top {TOP_N}")


if __name__ == "__main__":
    main()
