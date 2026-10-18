"""org 语法残留扫描：找出转换器没覆盖的 Markdown 语法。

用法:
    python3 check_org.py <org_root>
退出码 0 = 无残留（仅统计类除外）。
"""
from __future__ import annotations

import collections
import pathlib
import re
import sys

# (名称, 正则, 是否算致命)
PATTERNS: list[tuple[str, re.Pattern, bool]] = [
    ("md 属性 {#id}", re.compile(r"\{#[^}]*\}"), True),
    ("Hugo shortcode {{<", re.compile(r"\{\{[<%]"), True),
    ("HTML 注释", re.compile(r"<!--"), True),
    ("占位符泄漏 \\x00", re.compile("\x00"), True),
    ("脚注未转 [^n]", re.compile(r"\[\^[^\]]+\]"), True),
    ("md 粗体 **x**", re.compile(r"\*\*[^*\n]+\*\*"), True),
    ("md 行内代码 `x`", re.compile(r"`[^`\n]+`"), True),
    ("md 链接 ](url)", re.compile(r"\]\([^)\s]+\)"), True),
    ("md 表格分隔行", re.compile(r"^\s*\|[\s:|-]+\|\s*$", re.M), True),
    ("md 标题 ## ", re.compile(r"^#{1,6}\s+\S", re.M), True),
    ("行首 md 引用 > ", re.compile(r"^>\s", re.M), False),
    ("md 图片 ![alt]", re.compile(r"!\[[^\]]*\]"), True),
]


# 代码块/示例块内的 Markdown 语法不算残留（org 里是原样文本）
_VERBATIM_RE = re.compile(
    r"^[ \t]*#\+BEGIN_(?:SRC|EXAMPLE|VERSE|EXPORT)\b.*?^[ \t]*#\+END_(?:SRC|EXAMPLE|VERSE|EXPORT)\b",
    re.S | re.M | re.I,
)


# org 的行内代码 =x= / ~x~，里面的 md 语法同样是字面内容
_INLINE_VERBATIM_RE = re.compile(r"(?:=[^=\s][^=\n]*=|\~[^~\s][^~\n]*\~)")


def strip_verbatim(text: str) -> str:
    """挖掉 verbatim 块与行内代码，避免把它们里面的 # / ` / ** / ![ 误报成残留。"""
    text = _VERBATIM_RE.sub("\n", text)
    return _INLINE_VERBATIM_RE.sub(" ", text)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    root = pathlib.Path(argv[1])
    files = sorted(root.rglob("*.org"))
    stat: collections.Counter = collections.Counter()
    samples: dict[str, tuple[str, str]] = {}
    fatal_files: set[str] = set()

    for f in files:
        try:
            text = strip_verbatim(f.read_text(encoding="utf-8", errors="replace"))
        except Exception:  # noqa: BLE001
            continue
        for name, pat, fatal in PATTERNS:
            m = pat.search(text)
            if m:
                stat[name] += 1
                if fatal:
                    fatal_files.add(str(f.relative_to(root)))
                samples.setdefault(name, (str(f.relative_to(root)), m.group(0)[:70]))

    print(f"扫描 {len(files)} 个 org 文件")
    print(f"{'残留类型':<22} {'文件数':>6}  样例")
    for name, _pat, fatal in PATTERNS:
        if stat[name]:
            flag = "!" if fatal else " "
            rel, s = samples[name]
            print(f"{flag}{name:<21} {stat[name]:>6}  {rel} :: {s!r}")
    print(f"\n有致命残留的文件：{len(fatal_files)} 个")
    for p in sorted(fatal_files)[:20]:
        print("  ", p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
