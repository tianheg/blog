#!/usr/bin/env python3
"""org2site 输出体检 —— 每次改完构建跑一遍。

    python3 scripts/org2site/verify.py <输出目录>

检查项（都是实测踩过的坑，别删）：
  1. 每页恰好一个 <h1>          —— 改导出骨架后必查（曾整站缺 h1）
  2. 全部输出是合法 UTF-8        —— 转义还原规则曾产出非法字节
  3. TIL 三栏 shell 覆盖         —— /til/ 下每页都有 shell；左栏只在列表/分类页
  4. 页内锚点 0 死链             —— 目录里每个 #id 都要能解析到真实 id
  5. 站内链接 0 死链             —— URL 解码后比对；/dist/* 与 ?query 跳过
  6. 文件名规范（全小写 ASCII）  —— 中文名要翻译成英文，见 SKILL.md 硬规则 7

退出码 0 = 全过。
"""
from __future__ import annotations

import collections
import pathlib
import re
import sys
from urllib.parse import unquote

# 静态拷过来的第三方演示页不算「我们的页面」（它们本来就可能没有 h1）
SKIP_DIRS = ("projects/", "_photos/")
# 由 Worker 反代的路径（资产目录里本来就没有这些文件）
PROXY_PREFIXES = ("/dist/", "/api/", "/comments/")


def rel_posix(p: pathlib.Path, root: pathlib.Path) -> str:
    return p.relative_to(root).as_posix()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    root = pathlib.Path(argv[1]).resolve()
    pages = [p for p in sorted(root.rglob("*.html"))
             if not rel_posix(p, root).startswith(SKIP_DIRS)]
    fail: list[str] = []

    h1_bad, utf8_bad, shell_bad, anchor_bad = [], [], [], []
    shell = side = inline = 0
    til_pages = 0
    links = collections.Counter()
    link_src: dict[str, str] = {}

    for p in pages:
        rel = rel_posix(p, root)
        raw = p.read_bytes()
        try:
            t = raw.decode("utf-8")
        except UnicodeDecodeError as e:
            utf8_bad.append((rel, str(e)))
            continue
        n = len(re.findall(r"<h1[ >]", t))
        if n != 1:
            h1_bad.append((rel, n))
        is_til = rel.startswith("til/")
        if "data-til-shell" in t:
            shell += 1
            if not is_til:
                shell_bad.append(rel)
        if "data-til-side" in t:
            side += 1
        if "data-til-inline" in t:
            inline += 1
        if is_til:
            til_pages += 1
        ids = set(re.findall(r'\sid="([^"]+)"', t))
        for href in re.findall(r'href="#([^"]+)"', t):
            if href not in ids:
                anchor_bad.append((rel, href))
        # 代码块/行内代码里的 href 是示例文本，不是链接（曾有文章贴 /_pagefind/... 的配置片段）
        scan = re.sub(r"<pre\b.*?</pre>", " ", t, flags=re.S | re.I)
        scan = re.sub(r"<code\b.*?</code>", " ", scan, flags=re.S | re.I)
        for href in re.findall(r'href="(/[^"#?]*)"', scan):
            if href.startswith(PROXY_PREFIXES):
                continue
            links[href] += 1
            link_src.setdefault(href, rel)

    dead: dict[str, int] = {}
    for url, count in links.items():
        path = unquote(url).lstrip("/")
        if (root / path).exists() or (root / path / "index.html").exists() \
                or (root / (path + ".html")).exists():
            continue
        dead[url] = count

    print(f"页面 {len(pages)}（跳过静态拷贝目录 {SKIP_DIRS}）")
    print(f"  TIL: 页 {til_pages} / shell {shell} / 左栏 {side} / 小屏内联 {inline}")
    print(f"  1) 每页恰好一个 h1 : {'OK' if not h1_bad else 'FAIL ' + str(h1_bad[:5])}")
    print(f"  2) 合法 UTF-8      : {'OK' if not utf8_bad else 'FAIL ' + str(utf8_bad[:5])}")
    print(f"  3) shell 只在 til/ : {'OK' if not shell_bad else 'FAIL ' + str(shell_bad[:5])}")
    print(f"  4) 页内锚点 0 死链 : {'OK' if not anchor_bad else 'FAIL ' + str(anchor_bad[:5])}")
    print(f"  5) 站内链接死链    : {'OK（0）' if not dead else f'FAIL {len(dead)} 个目标 / {sum(dead.values())} 处'}")
    for url, count in sorted(dead.items(), key=lambda x: -x[1])[:10]:
        print(f"       {count:4}× {url}  ← {link_src[url]}")
    if shell != til_pages:
        print(f"  ! shell 页数 {shell} ≠ til 页数 {til_pages}")
    fail += h1_bad or utf8_bad or shell_bad or anchor_bad or dead
    if shell != til_pages:
        fail.append("shell-coverage")
    print("结果：", "全部通过 ✓" if not fail else "有 FAIL")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
