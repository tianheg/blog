#!/usr/bin/env python3
"""Convert medical knowledge base (Markdown) to TIL org files."""

import re
import os
import shutil

MEDICAL_DIR = "/home/tianhe/projects/medical-knowledge"
TIL_DIR = "/home/tianhe/projects/blog/content/til/health"

# Auto-discover source files, excluding category index pages
IGNORE_FILES = {
    # category index pages (just TOCs, no content)
    "index.md",
    "药理学/index.md", "生理学/index.md",
    "病理生理学/index.md", "生活常识/index.md",
}
# content mapping: source_md_path → output_org_name
FILES = []

# Known medical articles (under subdirectories)
for dirname in ["药理学", "生理学", "病理生理学", "生活常识/常见指标",
                 "生活常识/常见症状", "生活常识/营养代谢"]:
    d = os.path.join(MEDICAL_DIR, dirname)
    if not os.path.isdir(d):
        continue
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".md"):
            continue
        rel = os.path.join(dirname, fn)
        if rel in IGNORE_FILES:
            continue
        org_name = fn[:-3].replace(" ", "-") + ".org"
        # manual name overrides
        OVERRIDES = {
            "生活常识/营养代谢/阴茎锻炼手册.md": "penis-exercise-manual.org",
        }
        org_name = OVERRIDES.get(rel, org_name)
        FILES.append((rel, org_name))

# 参考来源/ — index.md as references-index.org, plus individual bookmarks
ref_dir = os.path.join(MEDICAL_DIR, "参考来源")
if os.path.isdir(ref_dir):
    for fn in sorted(os.listdir(ref_dir)):
        if not fn.endswith(".md"):
            continue
        if fn == "index.md":
            FILES.append(("参考来源/index.md", "references-index.org"))
        else:
            org_name = "ref-" + fn[:-3].replace(" ", "-") + ".org"
            FILES.append(("参考来源/" + fn, org_name))


def md_to_org(text: str) -> str:
    """Convert Markdown text to Org-mode, preserving as much structure as possible."""

    BOLD_PLACEHOLDER = "\x00BOLD\x00"

    lines = text.split("\n")
    out = []
    in_code_block = False
    in_table = False
    table_buf = []
    table_header_found = False  # whether we've seen |---| row

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Code block fence
        if stripped.startswith("```"):
            if in_code_block:
                out.append("#+END_SRC")
                in_code_block = False
            else:
                out.append("#+BEGIN_SRC")
                in_code_block = True
            i += 1
            continue

        if in_code_block:
            out.append(line)
            i += 1
            continue

        # Horizontal rule (--- but not inside a table)
        if re.match(r'^---+$', stripped) and not in_table:
            out.append("-----")
            i += 1
            continue

        # Blockquote
        if stripped.startswith("> ") or stripped == ">":
            # multi-line blockquote
            bq_lines = []
            while i < len(lines) and (lines[i].strip().startswith("> ") or lines[i].strip() == ">"):
                bq_lines.append(lines[i].strip().lstrip("> ").strip())
                i += 1
            out.append("#+BEGIN_QUOTE")
            for bq in bq_lines:
                out.append(bq)
            out.append("#+END_QUOTE")
            continue

        # Table row — collect the whole table
        if stripped.startswith("|") and stripped.endswith("|"):
            table_buf.append(stripped)
            i += 1
            # peek ahead to see if more table rows
            while i < len(lines):
                next_s = lines[i].strip()
                if next_s.startswith("|") and next_s.endswith("|"):
                    table_buf.append(next_s)
                    i += 1
                else:
                    break
            # Process the complete table: inline formatting per row,
            # drop the markdown separator row (Org doesn't need it).
            processed = []
            for row in table_buf:
                if re.match(r'^\|[-:| ]+\|$', row):
                    continue  # drop markdown table separator
                # Apply inline formatting to each row (same as non-table lines)
                row = re.sub(r'\*\*(.+?)\*\*', lambda m: f"{BOLD_PLACEHOLDER}{m.group(1)}{BOLD_PLACEHOLDER}", row)
                row = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'/\1/', row)
                row = row.replace(BOLD_PLACEHOLDER, "*")
                row = re.sub(r'`([^`]+)`', r'=\1=', row)
                row = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'[[\2][\1]]', row)
                processed.append(row)
            for p in processed:
                out.append(p)
            out.append("")  # blank after table
            table_buf = []
            continue

        # Headings
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            level = len(m.group(1))
            title = m.group(2)
            out.append("*" * level + " " + title)
            i += 1
            continue

        # Inline formatting — process original line in one pass to avoid
        # **bold** → *bold* (Org bold) then falsely re-matched as italic.
        # Strategy: first protect **bold** with placeholder, then handle *italic*,
        # then restore bold placeholders.
        # Step 1: **bold** → placeholder
        line = re.sub(r'\*\*(.+?)\*\*', lambda m: f"{BOLD_PLACEHOLDER}{m.group(1)}{BOLD_PLACEHOLDER}", line)
        # Step 2: *italic* → /italic/ (now safe, only original single * remain)
        line = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'/\1/', line)
        # Step 3: Restore bold placeholders → *bold*
        line = line.replace(BOLD_PLACEHOLDER, "*")
        # Code: `text` → =text=
        line = re.sub(r'`([^`]+)`', r'=\1=', line)
        # Links: [text](url) → [[url][text]]
        line = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'[[\2][\1]]', line)

        out.append(line)
        i += 1

    return "\n".join(out) + "\n"


def main():
    os.makedirs(TIL_DIR, exist_ok=True)

    for rel_md, org_name in FILES:
        src_path = os.path.join(MEDICAL_DIR, rel_md)
        dst_path = os.path.join(TIL_DIR, org_name)

        if not os.path.exists(src_path):
            print(f"SKIP (not found): {rel_md}")
            continue

        with open(src_path, "r") as f:
            md_text = f.read()

        org_text = md_to_org(md_text)

        with open(dst_path, "w") as f:
            f.write(org_text)

        print(f"OK: {rel_md} → {org_name} ({len(org_text)} chars)")


if __name__ == "__main__":
    main()
