#!/usr/bin/env python3
"""garden-health — 数字花园健康度与存量处置。

回答两个具体问题：
  1. 关系在增长吗？            → 默认视图（连通率 / 孤立 / 入链 Top）
  2. 583 篇 draft 里，哪些该先动？ → --promote（该复核的）/ --prune（该清理的）

数据来源是 Hugo 自己的构建产物（graph/index.json + 每页 frontmatter），
不在 Python 里重写解析规则 —— 与 check-links.mjs 同一个原则：判定只有一份。

用法：
  python3 scripts/garden-health.py            # 健康度摘要
  python3 scripts/garden-health.py --promote  # 转正队列（按"有真实需求"排序）
  python3 scripts/garden-health.py --prune    # 清理候选（孤立且长期未动）
  python3 scripts/garden-health.py --json     # 机器可读（默认视图）

退出码恒为 0（这是度量，不是闸门；闸门是 check-links）。
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from urllib.parse import quote

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(BLOG, "content")
PRUNE_MIN_AGE_DAYS = 90  # 孤立且入库超过这么久，才算清理候选


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


def read_meta():
    """permalink（小写规范）→ {status, date, title}。"""
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
            date = re.search(r"^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})", fm, re.M)
            # Hugo permalink：小写 + 非 ASCII percent-encoded（%E5 与 %e5 必须统一）
            key = quote(("/" + rel[:-3] + "/").lower(), safe="/-_.~").lower()
            out[key] = {
                "status": status.group(1) if status else None,
                "date": date.group(1) if date else None,
                "title": name[:-3],
            }
    return out


def fmt(k, meta, pages, graph, extra=""):
    title = (pages.get(k, {}).get("title") or meta.get(k.lower(), {}).get("title") or k).strip()
    d = meta.get(k.lower(), {}).get("date") or "??"
    return f"    {d}  {title[:42]:44s}{extra}"


def main():
    view = "status"
    if "--promote" in sys.argv:
        view = "promote"
    elif "--prune" in sys.argv:
        view = "prune"
    as_json = "--json" in sys.argv

    data = build_graph_json()
    graph = data.get("graph", {})
    pages = data.get("pages", {})
    meta = read_meta()

    def status_of(k):
        return meta.get(k.lower(), {}).get("status")

    def title_of(k):
        return (pages.get(k, {}).get("title") or k).strip()

    total = len(graph)
    has_in = [k for k, v in graph.items() if v.get("in")]
    has_out = [k for k, v in graph.items() if v.get("out")]
    connected = set(has_in) | set(has_out)
    isolated = [k for k in graph if k not in connected]
    edges = sum(len(v.get("out", [])) for v in graph.values())
    drafts = [k for k in graph if status_of(k) == "draft"]
    reviewed = [k for k in graph if status_of(k) == "reviewed"]

    # ── 转正队列：按"有没有真实需求"分层 ────────────────────────
    promote = {
        "被引用过（有真实需求）": sorted(
            (k for k in drafts if graph[k]["in"]), key=lambda k: -len(graph[k]["in"])
        ),
        "在用它但没人引用（有出链）": sorted(
            (k for k in drafts if graph[k]["out"] and not graph[k]["in"]),
            key=lambda k: -len(graph[k]["out"]),
        ),
    }

    # ── 清理候选：孤立 + 入库够久 ──────────────────────────────
    now = datetime.now(timezone.utc).date()

    def age_days(k):
        d = meta.get(k.lower(), {}).get("date")
        if not d:
            return None
        try:
            return (now - datetime.strptime(d, "%Y-%m-%d").date()).days
        except ValueError:
            return None

    prune = sorted(
        (k for k in isolated if status_of(k) == "draft"
         and (age_days(k) is None or age_days(k) >= PRUNE_MIN_AGE_DAYS)),
        key=lambda k: (age_days(k) or 0),
        reverse=True,
    )

    if as_json:
        print(json.dumps({
            "pages": total, "edges": edges,
            "connected": len(connected),
            "connected_pct": round(100 * len(connected) / total, 1) if total else 0.0,
            "isolated": len(isolated),
            "status": {"draft": len(drafts), "reviewed": len(reviewed)},
            "promote": {g: [{"permalink": k, "title": title_of(k),
                             "in": len(graph[k]["in"]), "out": len(graph[k]["out"])}
                            for k in ks[:20]] for g, ks in promote.items()},
            "prune_candidates": len(prune),
        }, ensure_ascii=False, indent=2))
        return

    print("数字花园健康度\n")
    print(f"  页面        {total}")
    print(f"  边          {edges}")
    print(f"  连通        {len(connected)} ({100*len(connected)/total:.1f}%)")
    print(f"  孤立        {len(isolated)} ({100*len(isolated)/total:.1f}%)")
    print(f"  状态        draft {len(drafts)} / reviewed {len(reviewed)}")

    if view in ("status", "promote"):
        print("\n── 转正队列 ──")
        for group, ks in promote.items():
            print(f"\n  {group}：{len(ks)} 篇")
            for k in ks[:8]:
                extra = f"  入{len(graph[k]['in'])} 出{len(graph[k]['out'])}"
                print(fmt(k, meta, pages, graph, extra))
            if len(ks) > 8:
                print(f"    … 其余 {len(ks)-8} 篇")

    if view in ("status", "prune"):
        print(f"\n── 清理候选（孤立 draft，入库 ≥ {PRUNE_MIN_AGE_DAYS} 天）── {len(prune)} 篇")
        for k in prune[:12]:
            a = age_days(k)
            print(fmt(k, meta, pages, graph, f"  {a} 天" if a else "  日期未知"))
        if len(prune) > 12:
            print(f"    … 其余 {len(prune)-12} 篇")
        if view == "prune":
            print("\n  这些删掉之前先确认：内容是否已被别处覆盖、是否还想留着当线索。")


if __name__ == "__main__":
    main()
