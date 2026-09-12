#!/usr/bin/env python3
"""suggest-merges — 找出「同一主题的短碎片」，给出合并建议。

动机：花园真正的瓶颈不在展示层，而在内容层 ——

  · 584 篇 TIL 里 200+ 篇 <1KB（中位数 1330B）
  · 1565 页只有 125 条显式链接边，91.4% 孤立
  · 583 篇 draft 只有 1 篇 reviewed

短碎片各自成岛：既太短而不值得单独存在，又因为没人引用而永远孤立。

## 判据：结构信号为主，向量为辅（2026-09-12 修正）

第一版用「纯向量聚类」，结果不可用：150~500B 的短备忘 embedding 都落在向量
空间中央，"Shell" / "Write a good prompt" / "AppImageLauncher" 被聚成一团，
三个不同簇统统建议并入 use-prettier.md —— **短文本的 cosine 相似度虚高**，
这是 sentence embedding 的已知特性，不是阈值没调好。

现在的做法：
  1. **主判据 = 文件名前缀**（第一个 `-` 之前的词，如 git / linux / pve / docker）。
     本站碎片命名高度规律，前缀就是作者自己的主题标记，比向量可靠得多。
  2. **辅判据 = 向量**，只用来「确认」同前缀的成员语义上也确实接近，
     并给宿主排序；不再用向量做聚类。
  3. 同前缀仅 1 篇的不成组（孤立碎片可以等它自然生长，不强行归类）。

合并宿主候选：同 header 或同分类的、比碎片大的笔记（不超过 --host-max-size，
避免把碎片塞进已经过大的巨页），且语义相近度 ≥ --host-min-sim。

本脚本**只读不写**，决定权在作者。

用法：
  uv run --no-project --with numpy python3 scripts/suggest-merges.py
  python3 scripts/suggest-merges.py --top 20 --json > merges.json
"""
import argparse
import array
import json
import os
import re
import sys
from collections import defaultdict

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(BLOG, "static", "pagefind-semantic")
CONTENT = os.path.join(BLOG, "content")

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)


def load_vectors():
    with open(os.path.join(SEM, "pages.json"), encoding="utf-8") as f:
        pages = json.load(f)
    dim = 1024
    mf = os.path.join(SEM, "manifest.json")
    if os.path.exists(mf):
        with open(mf, encoding="utf-8") as f:
            dim = json.load(f).get("dim", dim)
    with open(os.path.join(SEM, "embeddings.bin"), "rb") as f:
        vecs = array.array("f")
        vecs.frombytes(f.read())
    if len(vecs) != len(pages) * dim:
        sys.exit(f"ERROR: embeddings 与 pages.json 不匹配 —— 先跑 npm run embed")
    return pages, vecs, dim


def read_frontmatter(path):
    try:
        with open(path, encoding="utf-8") as f:
            head = f.read(1200)
    except OSError:
        return {}
    m = FM_RE.match(head)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip().lower()
        if k in ("title", "header", "status"):
            out[k] = v.strip().strip('"').strip("'")
    return out


def prefix_of(url):
    """文件名第一个 `-` 之前的词。无 `-` 时用整个文件名（单篇不成组）。"""
    name = url.rstrip("/").split("/")[-1]
    if "-" not in name:
        return name, False
    head = name.split("-", 1)[0]
    if len(head) < 2 or head.isdigit():
        return name, False
    return head, True


def collect(args, pages):
    frags, bigs = [], []
    ref_skipped = 0
    for i, p in enumerate(pages):
        rel = p["url"].strip("/")
        if not rel.startswith("til/"):
            continue
        src = os.path.join(CONTENT, rel + ".md")
        if not os.path.exists(src):
            continue
        base = os.path.basename(src)
        if not args.include_ref and base.startswith("ref-"):
            ref_skipped += 1
            continue
        size = os.path.getsize(src)
        fm = read_frontmatter(src)
        rec = {
            "i": i,
            "url": p["url"],
            "title": p.get("title") or fm.get("title") or rel.split("/")[-1],
            "size": size,
            "cat": rel.split("/")[1] if len(rel.split("/")) > 1 else "",
            "header": fm.get("header", ""),
            "status": fm.get("status", ""),
        }
        if size <= args.max_size:
            rec["prefix"], rec["has_prefix"] = prefix_of(p["url"])
            frags.append(rec)
        elif size <= args.host_max_size:
            bigs.append(rec)
    return frags, bigs, ref_skipped


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("--max-size", type=int, default=1024, help="碎片大小上限（字节）")
    ap.add_argument("--min-group", type=int, default=2, help="成组的最小成员数")
    ap.add_argument("--top", type=int, default=15, help="最多输出多少组")
    ap.add_argument("--host-max-size", type=int, default=50 * 1024, help="宿主页大小上限")
    ap.add_argument("--host-min-sim", type=float, default=0.62, help="宿主相似度下限")
    ap.add_argument("--min-confirm", type=float, default=0.62,
                    help="同组内语义确认阈值（组内最高相似度低于它 → 标注为语义分散）")
    ap.add_argument("--include-ref", action="store_true",
                    help="纳入 ref-* 参考资料（默认排除：书签式条目独立可检索才有价值）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    try:
        import numpy as np
    except ImportError:
        np = None

    pages, vecs, dim = load_vectors()
    frags, bigs, ref_skipped = collect(args, pages)

    if len(frags) < 2:
        print("没有足够的碎片")
        return

    if np is not None:
        M = np.frombuffer(vecs.tobytes(), dtype=np.float32).reshape(len(pages), dim)

        def pair_sim(a, b):
            return float(np.dot(M[a["i"]], M[b["i"]]))
    else:
        def pair_sim(a, b):
            va = vecs[a["i"] * dim:(a["i"] + 1) * dim]
            vb = vecs[b["i"] * dim:(b["i"] + 1) * dim]
            return sum(x * y for x, y in zip(va, vb))

    # ── 按文件名前缀分组（只用「确实有前缀」的）──
    groups = defaultdict(list)
    for f in frags:
        if f["has_prefix"]:
            groups[f["prefix"]].append(f)

    out = []
    for pref, members in groups.items():
        if len(members) < args.min_group:
            continue
        members.sort(key=lambda m: -m["size"])
        sims = [pair_sim(members[a], members[b])
                for a in range(len(members)) for b in range(a + 1, len(members))]
        best_sim = max(sims) if sims else 0.0
        avg_sim = sum(sims) / len(sims) if sims else 0.0

        # ── 宿主：同 header 或同 cat 的更大笔记，语义最近的那篇 ──
        heads = {m["header"] for m in members if m["header"]}
        cats = {m["cat"] for m in members if m["cat"]}
        cands = [b for b in bigs
                 if (b["header"] and b["header"] in heads)
                 or b["cat"] in cats
                 or prefix_of(b["url"])[0] == pref]
        host = None
        if cands:
            scored = []
            for b in cands:
                s = max(pair_sim(m, b) for m in members)
                scored.append((s, b))
            scored.sort(key=lambda x: -x[0])
            s, b = scored[0]
            if s >= args.host_min_sim:
                host = {**b, "sim": s}

        out.append({
            "prefix": pref,
            "members": [{"url": m["url"], "title": m["title"], "size": m["size"],
                         "header": m["header"], "cat": m["cat"], "status": m["status"]}
                        for m in members],
            "total_size": sum(m["size"] for m in members),
            "best_sim": best_sim,
            "avg_sim": avg_sim,
            "cohesive": best_sim >= args.min_confirm,
            "host": host,
        })

    out.sort(key=lambda g: (-len(g["members"]), -g["total_size"]))

    if args.json:
        json.dump(out[:args.top], sys.stdout, ensure_ascii=False, indent=1)
        return

    print("数字花园 · 碎片合并建议")
    print(f"  碎片池：{len(frags)} 篇 <{args.max_size}B 的 TIL"
          f"（共 {sum(f['size'] for f in frags) / 1024:.0f}KB）")
    if not args.include_ref:
        print(f"  已排除 {ref_skipped} 篇 ref-* 参考资料（--include-ref 可纳入）")
    print(f"  判据：文件名前缀分组 + 向量确认（{'numpy' if np is not None else '纯 python'}）")
    print()

    if not out:
        print("  没找到成组的前缀 —— 说明碎片命名没有共同主题词")
        return

    primary = [g for g in out if g["avg_sim"] >= args.min_confirm]
    weak = [g for g in out if g["avg_sim"] < args.min_confirm]

    if weak:
        print(f"（另有 {len(weak)} 组前缀只是通用词/品牌词、组内语义分散，已折叠："
              + "、".join(g["prefix"] for g in weak[:12]) + "）")
        print()

    total_members = 0
    for n, g in enumerate(primary[:args.top], 1):
        flag = "" if g["cohesive"] else "  ⚠ 组内语义较分散，合并前请逐篇过目"
        print(f"── 组 {n} · {len(g['members'])} 篇 · 合计 {g['total_size'] / 1024:.1f}KB"
              f" · 前缀「{g['prefix']}」· 组内相似度 均{g['avg_sim']:.2f}/峰{g['best_sim']:.2f}")
        for m in g["members"]:
            name = m["url"].rstrip("/").split("/")[-1]
            print(f"     {m['size']:>5}B  {m['title'][:42]}")
            print(f"            til/{m['cat']}/{name}.md")
        if g["host"]:
            h = g["host"]
            hn = h["url"].rstrip("/").split("/")[-1]
            print(f"   → 建议并入：{h['title'][:38]}")
            print(f"       til/{h['cat']}/{hn}.md　（{h['size'] / 1024:.1f}KB，"
                  f"最相近 {h['sim']:.3f}）")
        else:
            print("   → 建议：新建一篇汇总（无可信宿主）")
        if flag:
            print(flag)
        print()
        total_members += len(g["members"])

    print(f"小结：{len(primary)} 组可信组覆盖 {total_members} 篇碎片"
          f"（占碎片池 {total_members * 100 // max(1, len(frags))}%）；"
          f"{len(weak)} 组因语义分散未列入")
    print("提示：本脚本只读不写。确认合并哪几组后，我可以逐组处理"
          "（保留原文、只做搬运与去重，并把原本孤立的关系显式化）。")


if __name__ == "__main__":
    main()
