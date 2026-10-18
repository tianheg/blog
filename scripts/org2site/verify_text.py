"""新旧页面正文文本比对。P1 验收标准：正文零丢失（结构差异可接受）。

用法:
    python3 verify_text.py <old.html> <new.html>     # 差异 0 处 → exit 0
"""
from __future__ import annotations

import difflib
import html
import pathlib
import re
import sys

_SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
_TAG_RE = re.compile(r"<[^>]+>")
_MAIN_RE = re.compile(r"<main\b[^>]*>(.*?)</main>", re.S)
# 旧站正文容器（Hugo 侧带 class，只用于比对定位；新站没有 class）
_PROSE_RE = re.compile(
    r'<div class="prose[^"]*"[^>]*>(.*?)(?=<section|</article>|<footer|</main>)', re.S
)

# md typographer 在 org 侧的对应写法：归一化后再比，否则会误报
_EQUIV = (("——", "------"), ("……", "......"), ("—", "---"), ("–", "--"))


def extract_main(s: str) -> str:
    """从整页 HTML 里取出 <main> 段（旧站是整页，新导出只有 article）。"""
    m = _MAIN_RE.search(s)
    return m.group(1) if m else s


def extract_old_body(s: str) -> str:
    """旧站取正文容器 div.prose；取不到再退回 main。新导出整段即正文。"""
    m = _PROSE_RE.search(s)
    if m:
        return m.group(1)
    return extract_main(s)


def extract_text(s: str) -> str:
    s = _SCRIPT_RE.sub(" ", s)
    s = _TAG_RE.sub(" ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def _normalize(s: str) -> str:
    for a, b in _EQUIV:
        s = s.replace(a, b)
    return s.replace(" ", "")


def compare(old_html: str, new_html: str) -> list[tuple]:
    if "<main" in old_html or 'class="prose' in old_html:
        old_html = extract_old_body(old_html)
    # 新导出是完整页面（含 head/title），只比 <article> 内的正文
    m = re.search(r"<article\b[^>]*>(.*?)</article>", new_html, re.S)
    if m:
        new_html = m.group(1)
    a, b = _normalize(extract_text(old_html)), _normalize(extract_text(new_html))
    out = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
        if op != "equal":
            out.append((op, a[max(0, i1 - 12):i2 + 12], b[max(0, j1 - 12):j2 + 12]))
    return out


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: verify_text.py <old.html> <new.html>")
        return 2
    old = pathlib.Path(argv[1]).read_text(encoding="utf-8", errors="replace")
    new = pathlib.Path(argv[2]).read_text(encoding="utf-8", errors="replace")
    diffs = compare(old, new)
    for d in diffs[:20]:
        print("  ".join(map(str, d)))
    print(f"差异 {len(diffs)} 处")
    return 1 if diffs else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
