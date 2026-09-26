#!/usr/bin/env python3
"""清理站外死链：把 content/ 里指向已死 URL 的链接改成可用的存档地址或纯文本。

判死依据来自 `scripts/check-external-links.mjs --json` 的输出（只有 404/410 + 域名 NXDOMAIN
才算死），本脚本不自己发请求判定，只负责改内容。

处理规则（**不让网页变丑**是硬约束）：
  · 有 Wayback 存档 → 只换 URL，链接文字一字不动，页面观感零变化，且链接重新可用
  · 无存档 → 降级成纯文本（`[标题](url)` → `标题`），不插入「失效」之类的标记乱长
  · 裸 URL → 有存档换成存档地址；无存档原样留着（本来就是纯文本，不算链接）
  · 空文字链接 `[](url)` → 整段删掉
  · 代码块 / 行内代码 / localhost / 127.0.0.1 / example.com 一律不碰

用法：
  python3 scripts/prune-dead-links.py                      # dry-run，只报告
  python3 scripts/prune-dead-links.py --apply              # 真写
  python3 scripts/prune-dead-links.py --no-wayback         # 有存档也不用，一律降级纯文本
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
from collections import defaultdict

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(BLOG, "content")
SCAN_JSON = "/tmp/ext-links.json"

APPLY = "--apply" in sys.argv
USE_WAYBACK = "--no-wayback" not in sys.argv

# 不碰的假死链：本地开发地址、示例域名
SKIP_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "example.com", "example.org", "example.net"}


def is_skippable(url):
    try:
        h = urllib.parse.urlparse(url).hostname or ""
    except Exception:
        return True
    return h in SKIP_HOSTS or h.endswith(".local") or h.endswith(".localhost")


# ── 1. 收集死链 ─────────────────────────────────────────────────────
if not os.path.exists(SCAN_JSON):
    sys.exit(f"找不到扫描结果 {SCAN_JSON}，先跑：node scripts/check-external-links.mjs --json {SCAN_JSON}")

scan = json.load(open(SCAN_JSON, encoding="utf-8"))
dead = {}  # url -> wayback or None
for r in scan["results"]:
    if r["kind"] == "dead":
        dead[r["url"]] = r.get("wayback")

# 域名已不存在（DoH 查出来的 NXDOMAIN）也算死
doh_file = "/tmp/doh.json"
if os.path.exists(doh_file):
    nxs = {h for h, s in json.load(open(doh_file, encoding="utf-8")).items() if s == "NXDOMAIN"}
    for r in scan["results"]:
        if r["kind"] in ("error", "unreachable"):
            h = urllib.parse.urlparse(r["url"]).hostname
            if h in nxs:
                dead.setdefault(r["url"], None)

dead = {u: w for u, w in dead.items() if not is_skippable(u)}
print(f"待处理死链：{len(dead)} 个")

# ── 2. 补查 Wayback ─────────────────────────────────────────────────
# ⚠ archive.org 的 availability API 不带浏览器 UA 会一律超时（实测：裸 curl 25s timeout，
#   带 UA 立即返回）。别去掉 -A。
WAYBACK_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
)
WAYBACK_CACHE = os.path.join(BLOG, ".hermes/external-links/wayback.json")
WA_CACHE_TTL = 30 * 24 * 3600  # 查到了存档就长期有效；没查到 3 天后重查

wa_cache = {}
if os.path.exists(WAYBACK_CACHE):
    try:
        wa_cache = json.load(open(WAYBACK_CACHE, encoding="utf-8"))
    except Exception:
        wa_cache = {}


def wayback(url):
    """返回存档地址或 None。结果落 .hermes/external-links/wayback.json 复用。"""
    hit = wa_cache.get(url)
    if hit and time.time() - hit.get("at", 0) < (WA_CACHE_TTL if hit.get("url") else 3 * 86400):
        return hit.get("url")
    snap = None
    try:
        out = subprocess.run(
            ["curl", "-sS", "--max-time", "25", "-A", WAYBACK_UA,
             f"https://archive.org/wayback/available?url={urllib.parse.quote(url, safe='')}"],
            capture_output=True, text=True).stdout
        s = json.loads(out).get("archived_snapshots", {}).get("closest", {})
        snap = s.get("url") if s.get("available") else None
    except Exception:
        snap = None
    wa_cache[url] = {"url": snap, "at": time.time()}
    return snap


missing = [u for u, w in dead.items() if w is None and USE_WAYBACK]
todo = [u for u in missing if u not in wa_cache or not wa_cache[u].get("url")]
if todo:
    print(f"补查 {len(todo)} 个 URL 的 Wayback 存档（带浏览器 UA，4 并发）…")

if USE_WAYBACK and missing:
    import concurrent.futures as cf

    def slow(url):
        time.sleep(0.4)  # archive.org 会限速，别冲
        return wayback(url)

    with cf.ThreadPoolExecutor(4) as ex:
        for u, w in zip(missing, ex.map(slow, missing)):
            dead[u] = w or dead[u]
    os.makedirs(os.path.dirname(WAYBACK_CACHE), exist_ok=True)
    json.dump(wa_cache, open(WAYBACK_CACHE, "w", encoding="utf-8"), ensure_ascii=False)

have_snap = sum(1 for w in dead.values() if w)
print(f"  其中有 Wayback 存档：{have_snap}；无存档降级纯文本：{len(dead) - have_snap}")

# ── 3. 逐文件改写 ───────────────────────────────────────────────────
def link_pattern(url):
    """匹配 [label](url) 或 [label](url "title")，url 原样。/ 转义由 re.escape 处理。"""
    return re.compile(r"\[([^\]]*)\]\(" + re.escape(url) + r'(?:\s+"[^"]*")?\)')


MD_SPAN = re.compile(r"\[[^\]]*\]\([^)]*\)")


def replace_bare(line, url, repl):
    """只替换 markdown 链接之外的裸 URL —— 否则会把刚插进去的存档 URL 再套一层。"""
    out, last, hits = [], 0, 0
    for m in MD_SPAN.finditer(line):
        seg = line[last:m.start()]
        hits += seg.count(url)
        out.append(seg.replace(url, repl))
        out.append(m.group(0))
        last = m.end()
    seg = line[last:]
    hits += seg.count(url)
    out.append(seg.replace(url, repl))
    return "".join(out), hits


def code_mask(text):
    """返回每行是否处于代码上下文（fenced block / 行内 code 单独处理）。"""
    mask, fenced = [], None
    for line in text.split("\n"):
        stripped = line.lstrip()
        if fenced is None and (stripped.startswith("```") or stripped.startswith("~~~")):
            fenced = stripped[:3]
            mask.append(True)
            continue
        if fenced is not None:
            mask.append(True)
            if stripped.startswith(fenced):
                fenced = None
            continue
        mask.append(bool(re.match(r"^(\s{4,}|\t)", line)))
    return mask


changes = []      # (相对路径, 原文, 新文)
by_file = defaultdict(list)
unmatched = []
kept = []

for dirpath, _, files in os.walk(CONTENT):
    for name in files:
        if not name.endswith(".md"):
            continue
        full = os.path.join(dirpath, name)
        rel = os.path.relpath(full, BLOG)
        text = open(full, encoding="utf-8").read()
        if not any(u in text for u in dead):
            continue

        lines = text.split("\n")
        mask = code_mask(text)
        file_dead = {u: s for u, s in dead.items() if u in text}  # 只在本文件出现的，避免全量遍历
        # 行内 code 区间：逐行把 `...` 段抠掉再匹配，避免动到代码示例
        new_lines = []
        file_changes = []
        for i, line in enumerate(lines):
            original = line
            if not mask[i]:
                inside = re.findall(r"`[^`]*`", line)
                placeholder = "\x00CODE\x00"

                def hide(m):
                    inside.append(m.group(0))
                    return placeholder

                probe = re.sub(r"`[^`]*`", hide, line)

                for url, snap in file_dead.items():
                    if url not in probe:
                        continue
                    repl = snap if (USE_WAYBACK and snap) else None

                    # 先处理裸 URL（只动 markdown 链接之外的），再处理链接目标，
                    # 顺序反了会把新插入的存档 URL 再包一层
                    if repl:
                        probe, bare = replace_bare(probe, url, repl)
                        if bare:
                            file_changes.append((original, probe, url, bare, "bare-archive"))

                    if url not in probe and not repl:
                        continue

                    def md_sub(m, repl=repl):
                        label = m.group(1)
                        if repl:
                            return f"[{label}]({repl})"
                        return label  # 降级纯文本

                    probe, n = link_pattern(url).subn(md_sub, probe)
                    if n:
                        file_changes.append(
                            (original, probe, url, n, "archive" if repl else "plaintext")
                        )

                # 还原行内 code
                for code in inside:
                    probe = probe.replace(placeholder, code, 1)
                new_lines.append(probe)
            else:
                new_lines.append(line)

        new_text = "\n".join(new_lines)
        if new_text != text:
            changes.append((rel, text, new_text))
            by_file[rel] = file_changes

        # URL 在这个文件里但一处都没改 —— 分清两种：
        #   有 markdown 链接写法却改不动 → 写法特殊（转义/嵌套），要人工看
        #   只是裸 URL 且无存档 → 按设计留着，它本来就不是链接
        changed_urls = {c[2] for c in file_changes}
        for url in file_dead:
            if url in changed_urls:
                continue
            if re.search(r"\[[^\]]*\]\(\s*" + re.escape(url), text):
                unmatched.append((rel, url))
            else:
                kept.append((rel, url))

# ── 4. 报告 ─────────────────────────────────────────────────────────
total_edits = sum(len(v) for v in by_file.values())
print(f"\n涉及 {len(changes)} 个文件，{total_edits} 处改动\n")

for rel in sorted(by_file):
    rows = by_file[rel]
    print(f"  {rel}  ({len(rows)} 处)")
    seen = set()
    for old, new, url, n, kind in rows:
        key = (old, new)
        if key in seen:
            continue
        seen.add(key)
        tag = {"archive": "存档", "plaintext": "纯文本", "bare-archive": "裸URL→存档"}[kind]
        print(f"    [{tag}] {old.strip()[:110]}")
        print(f"        → {new.strip()[:110]}")

if kept:
    print(f"\n· {len(kept)} 个死链是裸 URL（正文里直接贴的地址）且没有存档 —— 保持原样，不算链接也就不会 404：")
    for rel, url in kept[:15]:
        print(f"    {rel}  {url[:100]}")
    if len(kept) > 15:
        print(f"    …… 另有 {len(kept) - 15} 个")

if unmatched:
    print(f"\n⚠ 有 {len(unmatched)} 个死链在文件里没匹配到可改的写法（转义/嵌套等），需人工看：")
    for rel, url in unmatched[:30]:
        print(f"    {rel}  {url}")

if not APPLY:
    print("\n（dry-run，未写入；确认后加 --apply）")
    sys.exit(0)

for rel, _, new_text in changes:
    open(os.path.join(BLOG, rel), "w", encoding="utf-8").write(new_text)
print(f"\n已写入 {len(changes)} 个文件。")
