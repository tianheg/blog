#!/usr/bin/env python3
"""把 content/til/media/watch-*.md 的正文合并成一行，塞进 content/watch.md 对应条目的 Review 列。

用法:
  python3 scripts/merge-media-watch.py           # 干跑，只打印改动
  python3 scripts/merge-media-watch.py --apply   # 就地改写 content/watch.md

规矩:
- 目标行按特征子串定位，只做行级替换（不跨区域正则）
- watch.md 表格新增条目插在表头分隔行的下一条（倒序规则）
- 正文里的 `------` 六连字符是有意为之，原样保留
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
WATCH_MD = REPO / "content" / "watch.md"
MEDIA = REPO / "content" / "til" / "media"

# 文件 -> (watch.md 行特征子串, Type, Name)；特征为 None 表示需新增条目
MAPPING = {
    "watch-a-son.md": (r"A Son(Original title: Bik Eneich", None, None),
    "watch-cast-away.md": ("荒岛余生 Cast Away", None, None),
    "watch-cloud-atlas.md": ("Cloud Atlas 云图", None, None),
    "watch-extremely-loud-and-incredibly-close.md": ("特别响，非常近", None, None),
    "watch-finch.md": ("芬奇 Finch", None, None),
    "watch-psycho-pass.md": ("心理测量者 PSYCHO-PASS", None, None),
    "watch-severance.md": ("人生切割术 第一季", None, None),
    "watch-the-boys.md": ("黑袍纠察队 第三季", None, None),  # TIL 写「前三季完结」，并入最新一季
    "watch-the-da-vinci-code.md": ("达·芬奇密码 The Da Vinci Code", None, None),
    "watch-the-second-handshake.md": (None, "电影", "第二次握手"),
    "watch-the-weather-man.md": ("天气预报员 The Weather Man", None, None),
    "watch-violet-evergarden.md": (None, "动漫", "紫罗兰永恒花园 Violet Evergarden"),
}


def merge_body(text: str) -> str:
    """去 front matter，把正文所有行合并成一行。"""
    lines = text.splitlines()
    # 逐行找恰好等于 --- 的行当边界（硬规矩：不用跨区域正则）
    if lines and lines[0].strip() == "---":
        end = None
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                end = i
                break
        if end is None:
            raise ValueError("front matter 未闭合")
        lines = lines[end + 1:]
    parts = []
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        s = re.sub(r"^#{1,6}\s*", "", s)      # ## 标题
        s = re.sub(r"^[-*]\s+", "", s)          # 列表项
        while s.startswith(">"):                # 引用前缀
            s = s[1:].strip()
        s = re.sub(r"\s*>\s*>\s*", " ", s)      # 行内残留的 "> >" 多段引用
        parts.append(s)
    merged = " ".join(parts)
    if "|" in merged:
        raise ValueError(f"合并结果含竖线，会撑破表格: {merged[:80]}")
    return merged


def main() -> None:
    apply = "--apply" in sys.argv
    lines = WATCH_MD.read_text(encoding="utf-8").splitlines(keepends=True)

    add_rows = []  # 新增条目（随后插到表头分隔行下一条，逆序插入保持新条目在最上）
    for fname, (needle, new_type, new_name) in MAPPING.items():
        src = MEDIA / fname
        if not src.exists():
            print(f"✗ 源文件不存在: {fname}")
            sys.exit(1)
        merged = merge_body(src.read_text(encoding="utf-8"))
        if needle is None:
            add_rows.append(f"| {new_type} | {new_name} | {merged} |  |\n")
            print(f"[新增] {new_name}\n   review: {merged}\n")
            continue
        hit = [i for i, ln in enumerate(lines) if needle in ln]
        if len(hit) != 1:
            print(f"✗ {fname}: 目标行命中 {len(hit)} 次 ({needle!r})")
            sys.exit(1)
        i = hit[0]
        raw = lines[i].rstrip("\n")
        cells = raw.split("|")
        if len(cells) != 6:
            print(f"✗ {fname}: 行列数异常 ({len(cells)}): {raw[:80]}")
            sys.exit(1)
        old_review = cells[3].strip()
        if old_review:
            print(f"✗ {fname}: 目标行 Review 非空，拒绝覆盖: {old_review[:60]!r}")
            sys.exit(1)
        cells[3] = f" {merged} "
        print(f"[改写] {cells[1].strip()} {cells[2].strip()}\n   review: {merged}\n")
        if apply:
            lines[i] = "|".join(cells) + "\n"

    if add_rows:
        sep = [i for i, ln in enumerate(lines) if ln.startswith("| ---")]
        if len(sep) != 1:
            print(f"✗ 表头分隔行命中 {len(sep)} 次")
            sys.exit(1)
        # 逆序插入，保证新增行按 MAPPING 顺序出现在正下方
        for row in reversed(add_rows):
            lines.insert(sep[0] + 1, row)
            print(f"[插入] 表头下: {row[:70].rstrip()}...")

    if apply:
        WATCH_MD.write_text("".join(lines), encoding="utf-8")
        print(f"\n✓ 已写入 {WATCH_MD}")
    else:
        print("\n(干跑 — 未写入。确认无误后加 --apply)")


if __name__ == "__main__":
    main()