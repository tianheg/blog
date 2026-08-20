#!/usr/bin/env python3
"""Scan .org files for go-org broken emphasis markup — v3.

go-org emphasis (双标记: =code= ~code~ /italic/ *bold* _underline_ +strike+):
  - opening marker preceded by: start-of-line, whitespace, or ( ' " {  (ASCII)
  - content: non-empty, no leading/trailing whitespace, may contain spaces
    and = / etc. inside (go-org matches lazily and backtracks to the last
    marker, so `=a==b=` renders as one verbatim `a==b`)
  - closing marker followed by: whitespace/EOL, ASCII closing punct
    from: - \t\n\r.,:!?;'")}[]\\  => renders OK
  - anything else (CJK punct  ，。：、, CJK chars, letters/digits, symbols)
    => markup does NOT render

Skips: #+BEGIN_SRC blocks, [[...]] org links.
"""
import os
import re
import sys

CONTENT = "/root/projects/blog/content"

PRE_OK = " \t\n\r('\"{"
CLOSING_OK = set("- \t\n\r.,:!?;'\"\\)}\\[\\\\")
MARKERS = set("=~/_*+")

MARKUP_RE = re.compile(
    r"(?:^|[" + re.escape(PRE_OK) + r"])([=~/_*+])(?!\s)(.*?)\1(?=.)", re.S
)
SRC_RE = re.compile(r"^\s*#\+(BEGIN|END)_SRC\b")
LINK_RE = re.compile(r"\[\[[^\]]*\]\]")

CJK_RE = re.compile(r"[\u3000-\u303f\uff00-\uffef\u4e00-\u9fff\u2014\u2026]")
# path-ish /xxx/ segments — false positives
PATHISH = {"etc","var","usr","dev","tmp","home","boot","run","opt","bin","mnt",
           "proc","sys","media","vagrant","path","api","posts","tags","images",
           "pagefind","files","lib","log","sbin","srv","root","data","cache",
           "nginx","apache2","pacman","docker","sudoers","letsencrypt","www",
           "git","test","v1","js","word","favou","Tim"}

def scan(path):
    rows = []
    with open(path, encoding="utf-8") as fh:
        in_src = False
        for lineno, line in enumerate(fh, 1):
            if SRC_RE.match(line):
                in_src = not in_src
                continue
            if in_src:
                continue
            masked = LINK_RE.sub(lambda m: " " * len(m.group(0)), line)
            for m in MARKUP_RE.finditer(masked):
                marker, content = m.group(1), m.group(2)
                if not content or len(content) > 120:
                    continue
                if content[0].isspace() or content[-1].isspace() or "\n" in content:
                    continue
                end = m.end()
                if end >= len(line.rstrip("\n")):
                    continue
                nxt = line[end]
                if nxt in CLOSING_OK or nxt in MARKERS:
                    continue  # renders fine / go-org backtracks into content
                grade = None
                if nxt == "\xa0":
                    grade = "A"
                elif CJK_RE.match(nxt):
                    grade = "A"
                elif nxt.isascii() and nxt.isalnum():
                    grade = "B" if content.lower() not in PATHISH else "C"
                else:
                    grade = "B"
                rows.append((lineno, grade, marker, content, nxt, line.rstrip("\n")))
    return rows

def main():
    counts = {"A": 0, "B": 0, "C": 0}
    by_file = {}
    for root, dirs, files in os.walk(CONTENT):
        dirs.sort()
        for fname in sorted(files):
            if not fname.endswith(".org") or "go-org-" in fname:
                continue
            path = os.path.join(root, fname)
            rows = scan(path)
            if rows:
                rel = os.path.relpath(path, CONTENT)
                by_file[rel] = rows
                for r in rows:
                    counts[r[1]] += 1
    print(f"=== Grade A: {counts['A']} | Grade B: {counts['B']} | Grade C: {counts['C']} ===")
    for rel in sorted(by_file):
        rows = [r for r in by_file[rel] if r[1] != "C"]
        if not rows:
            continue
        print(f"\n== {rel} ({len(rows)} non-C)")
        for lineno, grade, marker, content, nxt, line in rows:
            disp = line.strip()[:100]
            print(f"  [{grade}] L{lineno}: [{marker}{content}{marker}]{repr(nxt)} | {disp}")

if __name__ == "__main__":
    sys.exit(main())
