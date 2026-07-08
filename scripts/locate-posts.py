#!/usr/bin/env python3
"""
Scan posts for known location names and add #+LOCATION if missing.

Known locations (from footprints coordinate table):
  太和 | Taihe, 抚顺 | Fushun, 大连 | Dalian, 沈阳 | Shenyang,
  北京 | Beijing, 阜阳 | Fuyang, 合肥 | Hefei, 杭州 | Hangzhou,
  广州 | Guangzhou, 深圳 | Shenzhen, 香港 | Hongkong

Usage:
  python3 scripts/locate-posts.py                # scan and print results
  python3 scripts/locate-posts.py --apply         # auto-add #+LOCATION to files
  python3 scripts/locate-posts.py --summary       # summary only
"""

import os
import re
import sys

POSTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content", "posts")

# Known locations: (display_name, [search_terms])
KNOWN_LOCATIONS = [
    ("太和 Taihe", ["太和", "Taihe", "taihe"]),
    ("抚顺 Fushun", ["抚顺", "Fushun", "fushun"]),
    ("大连 Dalian", ["大连", "Dalian", "dalian"]),
    ("沈阳 Shenyang", ["沈阳", "Shenyang", "shenyang"]),
    ("北京 Beijing", ["北京", "Beijing", "beijing"]),
    ("阜阳 Fuyang", ["阜阳", "Fuyang", "fuyang"]),
    ("合肥 Hefei", ["合肥", "Hefei", "hefei"]),
    ("杭州 Hangzhou", ["杭州", "Hangzhou", "hangzhou"]),
    ("广州 Guangzhou", ["广州", "Guangzhou", "guangzhou"]),
    ("深圳 Shenzhen", ["深圳", "Shenzhen", "shenzhen"]),
    ("香港 Hongkong", ["香港", "Hongkong", "hongkong", "Hong Kong", "hong kong"]),
]


def find_locations_in_text(text: str) -> list[str]:
    """Return known location names whose terms appear in text."""
    found = []
    text_lower = text.lower()
    for name, terms in KNOWN_LOCATIONS:
        for term in terms:
            # Whole-word-ish match for Chinese (no word boundaries needed)
            # For English, use word boundary
            if re.search(rf"\b{re.escape(term)}\b", text, re.IGNORECASE):
                found.append(name)
                break  # one match per location
    return found


def has_location_frontmatter(content: str) -> bool:
    """Check if file already has #+LOCATION: line."""
    return bool(re.search(r"^#\+LOCATION:", content, re.MULTILINE))


def add_location_to_frontmatter(content: str, location: str) -> str:
    """Add #+LOCATION after the last frontmatter line (usually #+TAGS[] or #+DATE)."""
    # Find the position after the last #+ line that's part of frontmatter
    lines = content.split("\n")
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("#+") and not line.startswith("#+BEGIN"):
            insert_at = i + 1
        elif line.strip() == "" and insert_at > 0:
            # Blank line after frontmatter - insert before it
            break
    lines.insert(insert_at, f"#+LOCATION: {location}")
    return "\n".join(lines)


def scan_posts(dry_run: bool = True):
    """Scan all posts and report/apply location tags."""
    results = {}
    for fname in sorted(os.listdir(POSTS_DIR)):
        if not fname.endswith(".org"):
            continue
        fpath = os.path.join(POSTS_DIR, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        locations = find_locations_in_text(content)
        if not locations:
            continue

        already_has = has_location_frontmatter(content)
        if already_has:
            continue

        results[fname] = locations

        if not dry_run:
            # Use the first detected location (most specific match)
            chosen = locations[0]
            new_content = add_location_to_frontmatter(content, chosen)
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)

    return results


if __name__ == "__main__":
    dry_run = "--apply" not in sys.argv
    show_summary = "--summary" in sys.argv or not dry_run

    result = scan_posts(dry_run=dry_run)

    if not result:
        print("No new location associations found.")
        sys.exit(0)

    if dry_run:
        print("=== Posts with detected locations (no #+LOCATION yet) ===\n")
        for fname, locs in sorted(result.items()):
            title = re.sub(r"\.org$", "", fname)
            print(f"  {title}")
            for loc in locs:
                print(f"    → {loc}")
        print(f"\n{len(result)} post(s) need tagging.")
        print("Run with --apply to add #+LOCATION to these files.")
    else:
        print(f"Updated {len(result)} post(s) with #+LOCATION:")
        for fname in sorted(result):
            print(f"  + {fname}")
