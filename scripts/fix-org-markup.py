#!/usr/bin/env python3
"""Auto-fix go-org emphasis breakage (v2, mirrors scan v3 rules):
closing marker followed by CJK char or NBSP -> insert a space between the
closing marker and the punct (NBSP replaced with plain space).
Skips #+BEGIN_SRC blocks and [[...]] links."""
import os
import re
import sys

CONTENT = "/root/projects/blog/content"
PRE_OK = " \t\n\r('\"{"
MARKUP_RE = re.compile(
    r"(?:^|[" + re.escape(PRE_OK) + r"])([=~/_*+])(?!\s)(.*?)\1(?=.)", re.S
)
SRC_RE = re.compile(r"^\s*#\+(BEGIN|END)_SRC\b")
LINK_RE = re.compile(r"\[\[[^\]]*\]\]")
CJK_RE = re.compile(r"[\u3000-\u303f\uff00-\uffef\u4e00-\u9fff\u2014\u2026]")

def fix_line(line):
    fixes = []
    masked = LINK_RE.sub(lambda m: " " * len(m.group(0)), line)
    for m in MARKUP_RE.finditer(masked):
        content = m.group(2)
        if not content or len(content) > 120:
            continue
        if content[0].isspace() or content[-1].isspace() or "\n" in content:
            continue
        end = m.end()
        if end >= len(line.rstrip("\n")):
            continue
        nxt = line[end]
        if nxt == "\xa0":
            fixes.append((end, "NBSP"))
        elif CJK_RE.match(nxt):
            fixes.append((end, "SPACE"))
    if not fixes:
        return line, 0
    parts = list(line)
    for off, kind in sorted(fixes, reverse=True):
        if kind == "NBSP":
            parts[off] = " "
        else:
            if off + 1 < len(parts) and parts[off + 1] == " ":
                del parts[off + 1]
            parts.insert(off, " ")
    return "".join(parts), len(fixes)

def main():
    total = 0
    files_changed = []
    for root, dirs, files in os.walk(CONTENT):
        dirs.sort()
        for fname in sorted(files):
            if not fname.endswith(".org") or "go-org-" in fname:
                continue
            path = os.path.join(root, fname)
            with open(path, encoding="utf-8") as fh:
                lines = fh.readlines()
            in_src = False
            n_fix = 0
            new_lines = []
            for line in lines:
                if SRC_RE.match(line):
                    in_src = not in_src
                    new_lines.append(line)
                    continue
                if in_src:
                    new_lines.append(line)
                    continue
                fixed, n = fix_line(line)
                new_lines.append(fixed)
                n_fix += n
            if n_fix:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.writelines(new_lines)
                total += n_fix
                files_changed.append(f"{os.path.relpath(path, CONTENT)} ({n_fix})")
    print(f"=== {total} fixes in {len(files_changed)} files ===")
    for f in files_changed:
        print(f"  {f}")

if __name__ == "__main__":
    sys.exit(main())
