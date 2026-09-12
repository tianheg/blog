#!/usr/bin/env python3
"""suggest-bridges — 把孤立的笔记接起来，用最少的边达成连通。

动机（2026-09-12 实测）：TIL 555 篇笔记，内部链接只有 25 条，涉及 25 个页面
（4.5%），最大一簇 9 页，TIL→posts 跨区边为 0。所谓数字花园当时是 555 个孤岛
加了 7 个小簇 —— 问题不在展示层，在关系根本没被创造出来。

设计要点：
  1. 主题簇用**目录**而不是向量聚类 —— TIL 的 /til/<category>/ 就是作者自己的
     主题划分，语义社区发现（实测 k-NN + 标签传播）只会把它搅浑：k=6 时 406 页
     混成一团，而按目录切出来的 health/hardware/media 每个都干净。
  2. 组内用**最大生成树**给出 n-1 条边 —— 连通一个 n 节点的组，最少就是 n-1 条边，
     多一条都是浪费作者的手工。生成树保证「每条边都是当前最该加的那条」。
  3. 大组再按文件名前缀切子主题（software 240 篇里 git-*/linux-*/pve-* 本来就分组）。

用法：
  python3 scripts/suggest-bridges.py --list                    # 各目录的连通缺口
  python3 scripts/suggest-bridges.py --within media            # 某个组的连接方案
  python3 scripts/suggest-bridges.py --within media --all      # 含已有链接
  python3 scripts/suggest-bridges.py --within til/health --json
"""
import argparse
import collections
import json
import os

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(ROOT, "static", "pagefind-semantic")


def load():
    sem = json.load(open(os.path.join(SEM, "pages.json"), encoding="utf-8"))
    man = json.load(open(os.path.join(SEM, "manifest.json"), encoding="utf-8"))
    emb = np.fromfile(os.path.join(SEM, "embeddings.bin"), dtype=np.float32
                      ).reshape(len(sem), man["dim"])
    idx = {p["url"]: i for i, p in enumerate(sem)}
    gd = json.load(open(os.path.join(ROOT, "public/graph/index.json"), encoding="utf-8"))
    return sem, emb, idx, gd


def adjacency(gd):
    adj = collections.defaultdict(set)
    for u, v in gd["graph"].items():
        for x in v.get("out", []) + v.get("in", []):
            adj[u].add(x)
            adj[x].add(u)
    return adj


def groups(prefix):
    """{目录: [url...]} —— prefix 形如 'til' 或 '' """
    sem, emb, idx, gd = load()
    out = collections.defaultdict(list)
    for u in gd["pages"]:
        if u not in idx:
            continue
        parts = [p for p in u.strip("/").split("/")]
        if prefix and (not parts or parts[0] != prefix.strip("/")):
            continue
        if len(parts) >= 2:
            out[parts[1]].append(u)
        else:
            out["(根)"].append(u)
    return out, sem, emb, idx, gd


def mst_order(sim):
    """最大生成树的边（Prim），返回 [(i, j, sim)]，按相似度降序。"""
    n = len(sim)
    if n < 2:
        return []
    inmst = [False] * n
    best = [(-1.0, -1)] * n          # (sim, parent)
    inmst[0] = True
    for j in range(1, n):
        best[j] = (sim[0, j], 0)
    edges = []
    for _ in range(n - 1):
        k, bk = -1, -2.0
        for j in range(n):
            if not inmst[j] and best[j][0] > bk:
                bk, k = best[j][0], j
        if k < 0:
            break
        edges.append((best[k][1], k, best[k][0]))
        inmst[k] = True
        for j in range(n):
            if not inmst[j] and sim[k, j] > best[j][0]:
                best[j] = (sim[k, j], k)
    edges.sort(key=lambda e: -e[2])
    return edges


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="只看各组的连通缺口")
    ap.add_argument("--within", help="对某个组给出连接方案（组名或 til/<组名>）")
    ap.add_argument("--prefix", default="til", help="顶层 section，默认 til")
    ap.add_argument("--all", action="store_true", help="连已有链接也列出来")
    ap.add_argument("--max", type=int, default=60, help="最多列几条边")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    g, sem, emb, idx, gd = groups(args.prefix)
    adj = adjacency(gd)

    if args.list or not args.within:
        print("各组连通缺口（TIL）")
        print(f"  {'组':<14} {'篇数':>5} {'已有链接':>8}  需补的最少边")
        print("  " + "-" * 52)
        tot_p = tot_e = 0
        for name, urls in sorted(g.items(), key=lambda kv: -len(kv[1])):
            if len(urls) < 2:
                continue
            internal = sum(
                1 for u in urls for x in gd["graph"].get(u, {}).get("out", [])
                if x in set(urls)
            )
            need = len(urls) - 1 - internal if len(urls) > internal else 0
            tot_p += len(urls)
            tot_e += internal
            print(f"  {name:<14} {len(urls):>5} {internal:>8}  {max(need,0):>10}")
        print("  " + "-" * 52)
        print(f"  {'合计':<14} {tot_p:>5} {tot_e:>8}")
        print(f"\n现有 {tot_e} 条组内链接 → 全覆盖需 {tot_p - len(g) + 1} 条")
        print("\n用 --within <组名> 看具体连接方案")
        return

    key = args.within.strip().strip("/").split("/")[-1]
    if key not in g:
        print(f"没有这个组：{key}")
        print("可用：" + ", ".join(sorted(g.keys())))
        return
    urls = g[key]
    if len(urls) < 2:
        print(f"{key} 只有 {len(urls)} 篇，无需连接")
        return

    ti = np.array([idx[u] for u in urls])
    E = emb[ti]
    sim = E @ E.T
    np.fill_diagonal(sim, -1.0)

    linked = set()
    uset = set(urls)
    for u in urls:
        for x in gd["graph"].get(u, {}).get("out", []):
            if x in uset:
                linked.add((u, x))
    print(f"组 {key}：{len(urls)} 篇，现有组内链接 {len(linked)} 条")
    print(f"要达成全组连通，还需 {max(len(urls) - 1 - len(linked), 0)} 条边\n")

    edges = mst_order(sim)
    shown = 0
    for i, j, s in edges:
        a, b = urls[i], urls[j]
        if not args.all and ((a, b) in linked or (b, a) in linked):
            continue
        shown += 1
        if shown > args.max:
            break
        if args.json:
            print(json.dumps({"from": a, "to": b, "sim": round(float(s), 4)},
                             ensure_ascii=False))
        else:
            na = a.rstrip("/").split("/")[-1]
            nb = b.rstrip("/").split("/")[-1]
            print(f"  {s:.3f}  {na[:42]:<42} → {nb[:42]}")
            print(f"         在 {na[:60]}.md 里加：[[{nb}]]")
    if not args.json:
        print(f"\n共 {shown} 条建议")


if __name__ == "__main__":
    main()
