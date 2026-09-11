#!/usr/bin/env python3
"""garden-health — 数字花园健康度度量。

回答一个具体问题：**关系在增长吗？** 没有度量就无法判断前面的改动有没有用。

数据来源是 Hugo 自己的构建产物（graph/index.json + 每页 frontmatter），
不在 Python 里重写解析规则 —— 与 check-links.mjs 同一个原则：判定只有一份。

输出：
  · 连通率       有入链或出链的页面 / 总页面
  · 孤立笔记     零入链零出链（既没被引用，也没引用别人）
  · 转正候选     有入链的 draft —— 被真实引用过 = 有需求，优先复核这些
  · 入链 Top      被引用最多的页面
  · 状态分布     draft / reviewed

用法：
  python3 scripts/garden-health.py           # 报告
  python3 scripts/garden-health.py --json    # 机器可读

退出码恒为 0（这是度量，不是闸门；闸门是 check-links）。
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from urllib.parse import quote

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(BLOG, "content")


def build_graph_json():
    """跑一次 Hugo 构建，读回 graph/index.json（与线上同源）。"""
    with tempfile.TemporaryDirectory() as tmp:
        res = subprocess.run(
            ["hugo", "--buildFuture", "--destination", tmp],
            cwd=BLOG, capture_output=True, text=True,
        )
        path = os.path.join(tmp, "graph", "index.json")
        if not os.path.exists(path):
            print("ERROR: 构建没有产出 graph/index.json", file=sys.stderr)
            if res.stderr:
                print(res.stderr[-800:], file=sys.stderr)
            sys.exit(2)
        with open(path, encoding="utf-8") as f:
            return json.load(f)


def read_statuses():
    """从 content 里读每篇的 permalink → (status, title)。"""
    out = {}
    for dirpath, _, files in os.walk(CONTENT):
        for name in files:
            if not name.endswith(".md") or name.startswith("_index"):
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, CONTENT)
            if not rel.startswith(("posts/", "til/")):
                continue
            text = open(full, encoding="utf-8").read()
            m = re.search(r"^---\n(.*?)\n---", text, re.S)
            fm = m.group(1) if m else ""
            status = re.search(r"^status:\s*(\S+)", fm, re.M)
            # Hugo 的 permalink：小写 + 非 ASCII percent-encoded（中文文件名会变成 %E9%98%BF…）。
            # 统一全小写作为 key 与查找口径，否则 %E5 与 %e5 对不上。
            key = quote(("/" + rel[:-3] + "/").lower(), safe="/-_.~").lower()
            out[key] = status.group(1) if status else None
    return out


def main():
    as_json = "--json" in sys.argv
    data = build_graph_json()
    graph = data.get("graph", {})
    pages = data.get("pages", {})
    statuses = read_statuses()

    total = len(graph)
    has_in = [k for k, v in graph.items() if v.get("in")]
    has_out = [k for k, v in graph.items() if v.get("out")]
    connected = set(has_in) | set(has_out)
    isolated = [k for k in graph if k not in connected]
    edges = sum(len(v.get("out", [])) for v in graph.values())

    def title(k):
        return (pages.get(k, {}).get("title") or k).strip()

    draft = [k for k in graph if statuses.get(k.lower()) == "draft"]
    reviewed = [k for k in graph if statuses.get(k.lower()) == "reviewed"]
    # 转正候选：有入链的 draft（被人引用过 = 有真实需求）
    candidates = sorted(
        (k for k in draft if graph[k].get("in")),
        key=lambda k: -len(graph[k]["in"]),
    )
    top_in = sorted(graph.items(), key=lambda kv: -len(kv[1].get("in", [])))[:10]

    report = {
        "pages": total,
        "edges": edges,
        "connected": len(connected),
        "connected_pct": round(100 * len(connected) / total, 1) if total else 0.0,
        "isolated": len(isolated),
        "isolated_pct": round(100 * len(isolated) / total, 1) if total else 0.0,
        "status": {"draft": len(draft), "reviewed": len(reviewed)},
        "review_candidates": [
            {"permalink": k, "title": title(k), "in": len(graph[k]["in"])} for k in candidates[:10]
        ],
        "top_inbound": [
            {"permalink": k, "title": title(k), "in": len(v.get("in", []))} for k, v in top_in
        ],
    }

    if as_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return

    print("数字花园健康度\n")
    print(f"  页面        {total}")
    print(f"  边          {edges}")
    print(f"  连通        {len(connected)} ({report['connected_pct']}%)")
    print(f"  孤立        {len(isolated)} ({report['isolated_pct']}%)")
    print(f"  状态        draft {len(draft)} / reviewed {len(reviewed)}")
    print()
    if report["review_candidates"]:
        print("  转正候选（有入链的 draft，按被引用次数）：")
        for c in report["review_candidates"]:
            print(f"    {c['in']:3d}×  {c['title'][:44]}")
    else:
        print("  转正候选：无（没有 draft 被引用过）")
    print()
    print("  入链 Top 10：")
    for t in report["top_inbound"]:
        if t["in"]:
            print(f"    {t['in']:3d}×  {t['title'][:44]}")


if __name__ == "__main__":
    main()
