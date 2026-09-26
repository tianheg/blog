#!/usr/bin/env python3
"""清理标题里多余 / 非法的属性块（org -> md 迁移残留）。

两类问题：
  1. 叠加两个属性块：`#### 1 {#1} {#section}` —— goldmark 只认最后一个，
     前一个留在标题文字里，页面上显示成字面量 `1 {#1}`。
     修法：删掉前面的，保留最后一个（生效的那个，锚点不变）。
  2. 属性值里含空格：`### 五、… {#五 npm-安装…}` —— goldmark 认为不是合法属性，
     同样显示成字面量。修法：把值里的空格换成连字符（原本没生效，所以不会丢锚点）。

只动标题行（^#{1,6} ），正文与代码块不受影响。

用法: fix-title-attributes.py            # 干跑，只报告
      fix-title-attributes.py --apply    # 就地改写
"""
import argparse
import pathlib
import re

ATTR = re.compile(r"\s*\{#([^}]*)\}")
HEADING = re.compile(r"^#{1,6} ")


def fix_line(line):
    """返回 (新行, 动作说明 或 None)。"""
    matches = list(ATTR.finditer(line))
    if not matches:
        return line, None
    actions = []

    if len(matches) > 1:                      # 删掉除最后一个以外的全部
        for m in reversed(matches[:-1]):
            line = line[:m.start()] + line[m.end():]
        actions.append(f"删掉 {len(matches) - 1} 个多余属性块")
        matches = list(ATTR.finditer(line))

    if matches and " " in matches[-1].group(1):   # 值里的空格 -> 连字符
        m = matches[-1]
        line = line[:m.start()] + " {#" + m.group(1).replace(" ", "-") + "}"
        actions.append("属性值里的空格换成连字符")

    return line, "; ".join(actions) if actions else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="就地改写（默认只干跑）")
    ap.add_argument("--root", default="content", help="扫描目录，默认 content")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    total, files = 0, set()
    for path in sorted(root.rglob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
        changed = False
        for i, line in enumerate(lines):
            body = line.rstrip("\n")
            if not HEADING.match(body):
                continue
            new, action = fix_line(body)
            if action:
                print(f"{path}:{i + 1}  [{action}]")
                print(f"   -  {body}")
                print(f"   +  {new}")
                total += 1
                files.add(str(path))
                changed = True
                lines[i] = new + ("\n" if line.endswith("\n") else "")
        if changed and a.apply:
            path.write_text("".join(lines), encoding="utf-8")

    mode = "已改写" if a.apply else "干跑（未改动，加 --apply 生效）"
    print(f"\n标题 {total} 处，涉及 {len(files)} 个文件 —— {mode}")


if __name__ == "__main__":
    main()
