#!/usr/bin/env python3
"""TIL 转正队列：把 #+STATUS: draft 变成 org-agenda 能管的 TODO 列表。

为什么这么做：博客的 TIL 用 `status: draft|reviewed` 标记复核状态，但它只是文件头
的一个关键字 —— org-agenda 看不见关键字，看不见就管不了。这里把 draft 抽成一份
**不进发布**的 agenda 文件（`org/agenda.org`），于是：

    emacs org/agenda.org    然后 M-x org-agenda  → 转正队列
    改完状态后跑 --sync-back，写回源文件的 status

用法：
    python3 scripts/org2site/status-agenda.py            # 生成 org/agenda.org
    python3 scripts/org2site/status-agenda.py --sync-back # 把标成 DONE 的写回 reviewed
    python3 scripts/org2site/status-agenda.py --stats     # 只看统计

写回规则：agenda 里被标成 DONE 的条目 → 对应文件的 `status:` 改成 reviewed。
只改 status 这一行，其余原样。
"""
from __future__ import annotations

import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ORG = ROOT / "org"
AGENDA = ORG / "agenda.org"

STATUS_RE = re.compile(r"^#\+STATUS:\s*(\S+)\s*$", re.M)
TITLE_RE = re.compile(r"^#\+TITLE:\s*(.*)$", re.M)
# agenda 里我们生成的条目：* TODO [[file:til/xx/yy.org][标题]]
ITEM_RE = re.compile(r"^\*\s+(TODO|DONE)\s+\[\[file:([^\]]+)\]\[([^\]]*)\]\]", re.M)


def org_files() -> list[pathlib.Path]:
    return sorted(p for p in ORG.rglob("*.org") if p.name != "agenda.org")


def read_meta(p: pathlib.Path) -> tuple[str | None, str]:
    t = p.read_text(encoding="utf-8", errors="replace")
    m = STATUS_RE.search(t)
    status = m.group(1).lower() if m else None
    t2 = TITLE_RE.search(t)
    title = t2.group(1).strip() if t2 else p.stem
    return status, title


def generate() -> int:
    drafts = []
    for p in org_files():
        status, title = read_meta(p)
        if status == "draft":
            drafts.append((p.relative_to(ORG).as_posix(), title))
    lines = [
        "#+TITLE: TIL 转正队列（自动生成，勿手改内容；由 status-agenda.py 维护）",
        "#+NOEXPORT: t",
        "#+STARTUP: overview",
        "#+FILETAGS: :til:draft:",
        "",
        "* 说明",
        "  这是 `#+STATUS: draft` 的笔记清单，用来在 org-agenda 里做复核（转正）。",
        "  复核完把条目改成 DONE，再跑：",
        "  =python3 scripts/org2site/status-agenda.py --sync-back=",
        "  它会把对应源文件的 =status:= 写成 =reviewed=。",
        "",
        f"* TODO 待复核（{len(drafts)} 篇）",
    ]
    lines += [f"** TODO [[file:{rel}][{title}]]" for rel, title in drafts]
    AGENDA.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"生成 {AGENDA.relative_to(ROOT)}：{len(drafts)} 篇待复核")
    return len(drafts)


def sync_back() -> int:
    if not AGENDA.exists():
        print("还没有 org/agenda.org，先跑一次不带参数的生成", file=sys.stderr)
        return 1
    done = [m.group(2) for m in ITEM_RE.finditer(AGENDA.read_text(encoding="utf-8"))
            if m.group(1) == "DONE"]
    if not done:
        print("agenda 里没有 DONE 条目，无需写回")
        return 0
    n = 0
    for rel in done:
        org_p = ORG / rel
        # org/ 是唯一真源（content/ 已于 2026-10-18 随 Markdown 迁移产物一起删除）
        if not org_p.exists():
            continue
        text = org_p.read_text(encoding="utf-8", errors="replace")
        new, k = re.subn(r"^#\+STATUS:\s*\S+\s*$", "#+STATUS: reviewed", text, flags=re.M)
        if k:
            org_p.write_text(new, encoding="utf-8")
            n += k
    print(f"写回 {len(done)} 条：{n} 处 status 改为 reviewed")
    return n


def stats() -> None:
    from collections import Counter
    c = Counter(read_meta(p)[0] or "(无)" for p in org_files())
    print("按 status 统计：")
    for k, v in c.most_common():
        print(f"  {k:10} {v}")
    if AGENDA.exists():
        t = AGENDA.read_text(encoding="utf-8")
        done = len(re.findall(r"^\*\* DONE ", t, re.M))
        todo = len(re.findall(r"^\*\* TODO ", t, re.M))
        print(f"agenda：TODO {todo} / DONE {done}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sync-back", action="store_true", help="把 agenda 里 DONE 的写回 reviewed")
    ap.add_argument("--stats", action="store_true", help="只看统计")
    a = ap.parse_args()
    if a.stats:
        stats()
        return 0
    if a.sync_back:
        return 0 if sync_back() >= 0 else 1
    generate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
