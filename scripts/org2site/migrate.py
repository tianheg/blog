"""批量 md → org 驱动。

用法:
    python3 migrate.py <src_root> <dst_root>            # 全量
    python3 migrate.py <src_root> <dst_root> --list f   # 只转清单里的（相对 src_root 的路径，每行一个）
"""
from __future__ import annotations

import pathlib
import sys

from md2org import convert_file


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print(__doc__)
        return 2
    src, dst = pathlib.Path(argv[1]), pathlib.Path(argv[2])
    only: set[str] | None = None
    if "--list" in argv:
        lf = pathlib.Path(argv[argv.index("--list") + 1])
        only = {ln.strip().lstrip("./") for ln in lf.read_text(encoding="utf-8").splitlines() if ln.strip()}

    n, fails = 0, []
    for md in sorted(src.rglob("*.md")):
        rel = str(md.relative_to(src))
        if only is not None and rel not in only:
            continue
        try:
            convert_file(md, dst / pathlib.Path(rel).with_suffix(".org"))
            n += 1
        except Exception as e:  # noqa: BLE001 — 逐篇报告，不中断全量
            fails.append((rel, repr(e)))

    print(f"转换 {n} 篇，失败 {len(fails)} 篇")
    for rel, err in fails[:30]:
        print(f"  FAIL {rel}: {err}")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
