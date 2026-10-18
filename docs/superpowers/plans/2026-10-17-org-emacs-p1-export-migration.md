# org 化重构 P1：导出层 + 内容迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立「org 源 → 静态 HTML」的导出层，并把 20 篇试点文章从 Markdown 迁移到 Org，用文本级校验证明内容零丢失。

**Architecture:** 迁移期用 Python 单篇转换（可单测、可批量），导出层用 Emacs batch + `org-export-define-derived-backend` 派生 backend（只覆写需要改的 transcoder）。导出层与迁移器解耦：迁移器只管 md→org，导出层只管 org→HTML，两者通过文件系统交接。

**Tech Stack:** GNU Emacs 30.1（org 9.7.11，Debian `emacs-nox`）+ `elpa-htmlize` 1.58 + Python 3（仅迁移期）

**Spec:** `docs/superpowers/specs/2026-10-17-blog-org-emacs-design.md`

## Global Constraints

- Emacs 版本 pin 到 **30.1**；htmlize 必须 pin（**它不是 Emacs 内置包**），CI 与本地同源
- `org-emphasis-regexp-components` **必须在 `(require 'org)` 之前设置**，否则不生效
- 强调边界字符集**禁用 `[:nonascii:]`**（实测破坏正则，所有强调失效）；必须显式列全角标点 + CJK 范围 `\u4e00-\u9fff`
- 输出 HTML **不写任何 class**；`id` 与 `data-*` 保留（PageFind 用 `data-pagefind-*`、评论用 `#Comments`、菜单用 `#menu-btn`/`#mobile-menu`）
- **正文文本零丢失**是唯一验收标准（不要求 DOM 结构一致）
- 迁移工具链放 `scripts/org2site/`，随 git 走；一次性脚本跑完归档
- 破坏性操作只做点名项；blog 仓库改动未经允许不提交

## Review Focus

这些是 spec 隐含但单个任务测不到、最可能咬人的输入与条件：

1. **正文含裸 HTML 的文章**（`<sub>`、内联 `<style>`/`<script>` 页面，如 search 页）→ 期望：标签原样保留，不被转义，也不让页面结构崩掉
2. **CJK 强调位于全角标点或汉字之间**（`：*粗体*，`、`这是*粗体*字`）→ 期望：正常渲染为 `<strong>`/`<em>`，不原样输出标记
3. **含 `|` 的表格单元格里的 wikilink**（`[[x\|别名]]`）→ 期望：转义反斜杠被剥掉，链接正常解析
4. **md 的智能标点源串**（`------`、`......`、`---`）→ 期望：输出与旧站一致（`——`、`……`、`—`），不是原样连字符
5. **引用块内含多段**（`> a` 空行 `> b`）→ 期望：段落切分不吞内容、不越界合并

---

## File Structure

**新建（工具链）**
- `scripts/org2site/md2org.py` — 单篇 md→org 转换（纯函数 + CLI）
- `scripts/org2site/migrate.py` — 批量驱动（试点/全量，含排除清单）
- `scripts/org2site/tests/test_md2org.py` — 转换器单元测试（pytest）
- `scripts/org2site/tests/fixtures/*.md` — 覆盖各结构的输入样本
- `scripts/org2site/export.el` — 派生 backend（导出层核心）
- `scripts/org2site/build.el` — 入口：扫描 org/ → 输出 public/
- `scripts/org2site/verify_text.py` — 文本级校验（新旧正文比对）

**新建（内容）**
- `org/` — 新的唯一内容源（结构与现 `content/` 对齐：`posts/`、`til/`、`photos/`…）
- `org2site.toml` 不建；配置直接写在 elisp 里（避免多一种配置格式）

**保留不动**（P1 阶段）
- `content/`、`layouts/`、`hugo.yaml`、`package.json` — 全部保留，站点仍由 Hugo 构建，org 链路是旁路验证

**为什么这样分**：转换器（Python）和导出层（elisp）各自独立可测；P1 阶段两条链路并存，任何一步失败都不影响线上站点。

---

## Task 1: 目录骨架与转换器的最小可用版本

**Files:**
- Create: `scripts/org2site/md2org.py`
- Create: `scripts/org2site/tests/test_md2org.py`
- Create: `scripts/org2site/tests/fixtures/minimal.md`

**Interfaces:**
- Consumes: 无
- Produces: `split_front_matter(text: str) -> tuple[dict, str]`、`render_front_matter(fm: dict) -> list[str]`

- [ ] **Step 1: 写失败的测试**

```python
# scripts/org2site/tests/test_md2org.py
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from md2org import split_front_matter, render_front_matter

def test_split_front_matter_reads_keys():
    text = "---\ntitle: 'A B'\ndate: 2022-08-06\ntags: ['x', 'y']\n---\n\nbody\n"
    fm, body = split_front_matter(text)
    assert fm["title"] == "A B"
    assert fm["date"] == "2022-08-06"
    assert fm["tags"] == ["x", "y"]
    assert body.strip() == "body"

def test_split_front_matter_title_containing_dashes():
    # 回归：title 里含 ------ 时不能被当成 front matter 分隔符
    text = "---\ntitle: 'x------y'\n---\n\nbody\n"
    fm, body = split_front_matter(text)
    assert fm["title"] == "x------y"

def test_render_front_matter_emits_org_keywords():
    out = render_front_matter({"title": "A", "date": "2022-08-06", "tags": ["x", "y"]})
    assert out[0] == "#+TITLE: A"
    assert out[1].startswith("#+DATE: <2022-08-06")
    assert out[2] == "#+TAGS[]: x,y"
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'md2org'`

- [ ] **Step 3: 写最小实现**

```python
# scripts/org2site/md2org.py
"""md → org 单篇转换（P1 试点用）。"""
from __future__ import annotations
import re

_FM_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n(.*)\Z", re.S)

def split_front_matter(text: str) -> tuple[dict, str]:
    """切出 YAML front matter。锚定在文件开头，避免正文里的 --- 被误判。"""
    m = _FM_RE.match(text)
    if not m:
        return {}, text
    raw, body = m.group(1), m.group(2)
    fm: dict = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k, v = k.strip(), v.strip()
        if v.startswith("[") and v.endswith("]"):
            fm[k] = [s.strip().strip("'\"") for s in v[1:-1].split(",") if s.strip()]
        elif len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
            fm[k] = v[1:-1]
        else:
            fm[k] = v
    return fm, body

_DATE_RE = re.compile(r"\A(\d{4}-\d{2}-\d{2})")

def render_front_matter(fm: dict) -> list[str]:
    out: list[str] = []
    if title := fm.get("title"):
        out.append(f"#+TITLE: {title}")
    if date := fm.get("date"):
        d = _DATE_RE.match(str(date))
        if d:
            out.append(f"#+DATE: <{d.group(1)} Sat 12:00>")
    if tags := fm.get("tags"):
        out.append("#+TAGS[]: " + ",".join(tags if isinstance(tags, list) else [tags]))
    for key, org_key in (("status", "STATUS"), ("header", "HEADER"),
                         ("location", "LOCATION"), ("series", "SERIES")):
        if v := fm.get(key):
            out.append(f"#+{org_key}: {v}")
    if aliases := fm.get("aliases"):
        out.append("#+ALIASES[]: " + ",".join(aliases if isinstance(aliases, list) else [aliases]))
    return out
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/md2org.py scripts/org2site/tests/
git commit -m "feat(org2site): md front matter -> org keywords"
```

---

## Task 2: 行内语法转换（链接 / wikilink / 强调 / 行内代码）

**Files:**
- Modify: `scripts/org2site/md2org.py`
- Modify: `scripts/org2site/tests/test_md2org.py`

**Interfaces:**
- Consumes: Task 1 的 `split_front_matter` / `render_front_matter`
- Produces: `convert_inline(s: str) -> str`

- [ ] **Step 1: 写失败的测试**

```python
def test_convert_inline_md_link():
    assert convert_inline("看[这篇](https://e.com/a)") == "看[[https://e.com/a][这篇]]"

def test_convert_inline_wikilink_with_label():
    assert convert_inline("[[slug|显示名]]") == "[[slug][显示名]]"

def test_convert_inline_wikilink_table_escape():
    # 表格里的 \| 转义要剥掉，否则解析不到目标
    assert convert_inline(r"[[odyssey-movie\|影评]]") == "[[odyssey-movie][影评]]"

def test_convert_inline_bold_and_italic():
    assert convert_inline("**粗** 与 *斜*") == "*粗* 与 /斜/"

def test_convert_inline_bold_placeholder_protects_italic():
    # 先粗后斜：不能把 * 的转换吃掉 / 的转换
    assert convert_inline("**A** and *B*") == "*A* and /B/"

def test_convert_inline_code_and_image():
    assert convert_inline("`x=1`") == "=x=1="
    assert convert_inline("![alt](/images/a.png)") == "[[file:/images/a.png][alt]]"
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v -k inline`
Expected: FAIL — `NameError: name 'convert_inline' is not defined`

- [ ] **Step 3: 写实现**

```python
_IMG_RE = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)\)")
_MD_LINK_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(([^)\s]+)\)")
_WIKI_RE = re.compile(r"\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]")
_BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
_ITALIC_RE = re.compile(r"(?<!\*)\*([^*]+)\*(?!\*)")
_CODE_RE = re.compile(r"`([^`]+)`")

def _protect(store: list[str], s: str) -> str:
    store.append(s)
    return f"\x00{len(store) - 1}\x00"

def _restore(store: list[str], s: str) -> str:
    for i, v in enumerate(store):
        s = s.replace(f"\x00{i}\x00", v)
    return s

def convert_inline(s: str) -> str:
    """按顺序保护再转换：行内代码 -> 图片 -> wikilink -> md 链接 -> 粗体 -> 斜体。"""
    keep: list[str] = []
    s = _CODE_RE.sub(lambda m: _protect(keep, f"={m.group(1)}="), s)
    s = _IMG_RE.sub(lambda m: _protect(keep, f"[[file:{m.group(2)}][{m.group(1)}]]"), s)
    s = _WIKI_RE.sub(
        lambda m: _protect(keep, f"[[{m.group(1)}][{m.group(2)}]]" if m.group(2) else f"[[{m.group(1)}]]"),
        s,
    )
    s = _MD_LINK_RE.sub(lambda m: _protect(keep, f"[[{m.group(2)}][{m.group(1)}]]"), s)
    s = _BOLD_RE.sub(r"*\1*", s)
    s = _ITALIC_RE.sub(r"/\1/", s)
    return _restore(keep, s)
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v -k inline`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/md2org.py scripts/org2site/tests/
git commit -m "feat(org2site): inline md -> org (links, wikilinks, emphasis, code)"
```

---

## Task 3: 块级转换（代码块 / 表格 / 引用块 / 分隔线 / 裸 HTML）

**Files:**
- Modify: `scripts/org2site/md2org.py`
- Modify: `scripts/org2site/tests/test_md2org.py`

**Interfaces:**
- Consumes: `convert_inline`
- Produces: `convert_body(md: str) -> str`

- [ ] **Step 1: 写失败的测试**

```python
def test_fenced_code_block_language_preserved():
    out = convert_body("```python\nx = 1\n```\n")
    assert "#+BEGIN_SRC python" in out and "x = 1" in out and "#+END_SRC" in out

def test_hash_line_inside_code_block_not_a_heading():
    out = convert_body("```bash\n# comment\necho hi\n```\n")
    assert "comment" in out and "* comment" not in out

def test_blockquote_multi_paragraph():
    out = convert_body("> a\n>\n> b\n")
    assert out.count("#+BEGIN_QUOTE") == 1 and "#+END_QUOTE" in out
    assert "a" in out and "b" in out

def test_md_table_becomes_org_table():
    out = convert_body("| a | b |\n|---|---|\n| 1 | 2 |\n")
    assert "|---|---|" not in out          # 分隔行在 org 里是 hline
    assert "| a | b |" in out and "| 1 | 2 |" in out

def test_hr_becomes_org_hr():
    assert "-----" in convert_body("a\n\n---\n\nb\n")

def test_bare_html_is_wrapped_in_export_snippet():
    out = convert_body("段落含 <sub>id</sub> 与 <kbd>Ctrl</kbd>。\n")
    assert "@@html:<sub>id</sub>@@" in out
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v -k "body or code or quote or table or hr or html"`
Expected: FAIL — `NameError: name 'convert_body' is not defined`

- [ ] **Step 3: 写实现**

```python
_FENCE_RE = re.compile(r"^```([A-Za-z0-9_+-]*)\s*$")
_TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$")
_TABLE_SEP_RE = re.compile(r"^\s*\|[\s:|-]+\|\s*$")
_HR_RE = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$")
# 只放行常见内联标签，避免把正文里的比较符号误当标签
_INLINE_TAG_RE = re.compile(r"</?(?:sub|sup|kbd|mark|br|abbr|span|small|u|b|i|em|strong|code)(?:\s[^>]*)?/?>")

def _wrap_html(s: str) -> str:
    return _INLINE_TAG_RE.sub(lambda m: f"@@html:{m.group(0)}@@", s)

def convert_body(md: str) -> str:
    lines = md.split("\n")
    out: list[str] = []
    i, in_quote, in_code = 0, False, False
    while i < len(lines):
        ln = lines[i]
        m = _FENCE_RE.match(ln)
        if in_code:
            if m:
                out.append("#+END_SRC")
                in_code = False
            else:
                out.append(ln)          # 代码块内一律原样，不转标题
            i += 1
            continue
        if m:
            out.append(f"#+BEGIN_SRC {m.group(1)}".strip())
            in_code = True
            i += 1
            continue
        if re.match(r"^\s*>", ln):
            if not in_quote:
                out.append("#+BEGIN_QUOTE")
                in_quote = True
            body = re.sub(r"^\s*>\s?", "", ln)
            out.append(convert_inline(body))
            i += 1
            continue
        if in_quote:
            out.append("#+END_QUOTE")
            out.append("")
            in_quote = False
            continue
        if _TABLE_ROW_RE.match(ln):
            if not _TABLE_SEP_RE.match(ln):
                out.append(_wrap_html(convert_inline(ln.strip())))
            i += 1
            continue
        if _HR_RE.match(ln):
            out.append("-----")
            out.append("")
            i += 1
            continue
        if not ln.strip():
            out.append("")
            i += 1
            continue
        out.append(_wrap_html(convert_inline(ln)))
        i += 1
    if in_quote:
        out.append("#+END_QUOTE")
    if in_code:
        out.append("#+END_SRC")
    return "\n".join(out)
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v`
Expected: 全部 passed（Task 1-3）

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/
git commit -m "feat(org2site): block-level md -> org (src, table, quote, hr, bare html)"
```

---

## Task 4: 单篇转换 CLI + 试点 20 篇

**Files:**
- Modify: `scripts/org2site/md2org.py`（加 `convert_file` / `main`）
- Create: `scripts/org2site/pilot-list.txt`

**Interfaces:**
- Consumes: `split_front_matter` / `render_front_matter` / `convert_body`
- Produces: `convert_file(src: Path, dst: Path) -> None`；命令行 `python3 md2org.py <src.md> <dst.org>`

- [ ] **Step 1: 写失败的测试**

```python
def test_convert_file_end_to_end(tmp_path):
    src = tmp_path / "a.md"
    src.write_text("---\ntitle: 'T'\ndate: 2022-08-06\ntags: ['x']\n---\n\n正文 **粗**。\n", encoding="utf-8")
    dst = tmp_path / "a.org"
    convert_file(src, dst)
    got = dst.read_text(encoding="utf-8")
    assert "#+TITLE: T" in got
    assert "#+TAGS[]: x" in got
    assert "*粗*" in got
    assert "#+TITLE" in got.splitlines()[0]
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd scripts/org2site && python3 -m pytest tests/test_md2org.py -v -k end_to_end`
Expected: FAIL — `NameError: name 'convert_file' is not defined`

- [ ] **Step 3: 写实现**

```python
from pathlib import Path

def convert_file(src: Path, dst: Path) -> None:
    text = src.read_text(encoding="utf-8")
    fm, body = split_front_matter(text)
    parts = render_front_matter(fm) + [""] + [convert_body(body).strip("\n"), ""]
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text("\n".join(parts) + "\n", encoding="utf-8")

def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: md2org.py <src.md> <dst.org>")
        return 2
    convert_file(Path(argv[1]), Path(argv[2]))
    return 0

if __name__ == "__main__":
    import sys
    raise SystemExit(main(sys.argv))
```

- [ ] **Step 4: 选定试点 20 篇**

`pilot-list.txt` 每行一个仓库相对路径，按结构覆盖挑选（用下面的命令选出候选，人工确认后落盘）：

```bash
cd /root/projects/blog/content
{ grep -rl '\[\[.*|' posts til | head -4;      # wikilink
  grep -rl '^|' posts til | head -4;           # 表格
  grep -rl '```' posts til | head -4;          # 代码块
  grep -rl '\[\^' posts til | head -3;         # 脚注
  grep -rl '<sub>\|<kbd>\|<style>' . | head -3; # 裸 HTML
  grep -rl '^> ' posts | head -2;              # 引用块
} | sort -u > /root/projects/blog/scripts/org2site/pilot-list.txt
wc -l /root/projects/blog/scripts/org2site/pilot-list.txt
```

- [ ] **Step 5: 跑试点转换并人工确认**

```bash
cd /root/projects/blog
while read -r f; do
  out="org/${f%.md}.org"
  python3 scripts/org2site/md2org.py "content/$f" "$out"
done < scripts/org2site/pilot-list.txt
ls org/**/*.org 2>/dev/null | wc -l
```

人工检查至少 3 篇：front matter 对齐、代码块闭合、表格、wikilink 形态、引用块分段。

- [ ] **Step 6: Commit**

```bash
git add scripts/org2site/ org/
git commit -m "feat(org2site): single-file CLI + 20-file pilot conversion"
```

---

## Task 5: 导出层（派生 backend + 四条硬伤修复）

**Files:**
- Create: `scripts/org2site/export.el`
- Create: `scripts/org2site/tests/test_export.sh`

**Interfaces:**
- Consumes: `org/*.org`（Task 4 产出）
- Produces: `org2site-export-file(infile, outfile)`；CLI `emacs -Q --batch -l export.el <in.org> <out.html>`

- [ ] **Step 1: 写失败的测试（shell 断言）**

```bash
#!/usr/bin/env bash
# scripts/org2site/tests/test_export.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/t.org" <<'ORG'
#+TITLE: T

粗体后接全角逗号：*中文粗体*，后面还有文字。

斜体后接全角句号：/中文斜体/。结束。

汉字紧邻：这是*粗体*字。

裸 HTML：<sub>id</sub> 与 <kbd>Ctrl</kbd>。

[[slug][一篇旧文]]
ORG
emacs -Q --batch -l export.el "$tmp/t.org" "$tmp/out.html" 2>"$tmp/err.log"
html=$(cat "$tmp/out.html")
grep -q '<strong>中文粗体</strong>' <<<"$html" || { echo "FAIL: CJK 粗体"; exit 1; }
grep -q '<em>中文斜体</em>'       <<<"$html" || { echo "FAIL: CJK 斜体"; exit 1; }
grep -q '这是<strong>粗体</strong>字' <<<"$html" || { echo "FAIL: 汉字紧邻"; exit 1; }
grep -q '<sub>id</sub>'           <<<"$html" || { echo "FAIL: 裸 HTML 被转义"; exit 1; }
grep -q 'href="/posts/slug/"'     <<<"$html" || { echo "FAIL: wikilink"; exit 1; }
! grep -q $'\u200b' "$tmp/out.html"            || { echo "FAIL: ZWSP 残留"; exit 1; }
! grep -q 'class="'  "$tmp/out.html"           || { echo "FAIL: 输出含 class"; exit 1; }
echo "PASS"
```

- [ ] **Step 2: 跑测试确认失败**

Run: `bash scripts/org2site/tests/test_export.sh`
Expected: FAIL — `export.el` 不存在

- [ ] **Step 3: 写 export.el（顺序与位置都不能改）**

```elisp
;;; export.el --- org -> HTML 导出层 -*- lexical-binding: t; -*-
;; 必须在 require org 之前设置，否则不生效（实测）。
;; 禁用 [:nonascii:]：实测会破坏解析，导致全部强调失效。
(setq org-emphasis-regexp-components
      '("-[:space:]('\"{，。、！？；：（）【】《》「」『』“”‘’…—\u4e00-\u9fff"
        "-[:space:].,:!?;'\")}\\[，。、！？；：（）【】《》「」『』“”‘’…—\u4e00-\u9fff"
        "[:space:]" "." 1))

(require 'ox-html)

;; htmlize 不是 Emacs 内置包，必须显式加载
(dolist (d (file-expand-wildcards "/usr/share/emacs/site-lisp/elpa/htmlize-*"))
  (add-to-list 'load-path d))
(require 'htmlize nil t)

(setq org-html-doctype "html5"
      org-html-html5-fancy t
      org-export-with-section-numbers nil
      org-html-head-include-scripts nil
      org-html-head-include-default-style nil
      org-html-self-link-headlines nil
      org-html-validation-link nil
      org-export-with-toc nil
      org-html-text-markup-alist '((bold . "<strong>%s</strong>")
                                   (italic . "<em>%s</em>")
                                   (verbatim . "<code>%s</code>")
                                   (code . "<code>%s</code>")
                                   (strike-through . "<del>%s</del>"))
      org-html-htmlize-output-type 'css)

;; 裸 HTML：只放行白名单内联标签，其余照常转义
(defun org2site-plain-text (text _info)
  (let ((keep '()))
    (setq text (replace-regexp-in-string
                "<\\(\\/?\\(?:sub\\|sup\\|kbd\\|mark\\|br\\|abbr\\|span\\|small\\|u\\)\\)\\([^>]*\\)>"
                (lambda (m) (push m keep) (format "\x01%d\x02" (1- (length keep)))) text t))
    (setq text (replace-regexp-in-string "&" "&amp;" text t t))
    (setq text (replace-regexp-in-string "<" "&lt;" text t t))
    (setq text (replace-regexp-in-string ">" "&gt;" text t t))
    (let ((i -1))
      (dolist (tag (reverse keep))
        (setq i (1+ i))
        (setq text (replace-regexp-in-string (format "\x01%d\x02" i) tag text t t))))
    text))

(org-link-set-parameters "wiki"
  :export (lambda (path desc _b) (format "<a href=\"%s\">%s</a>" path (or desc path))))

(defun org2site-rewrite-wikilinks ()
  "[[slug][desc]]（无 scheme）→ [[wiki:/posts/slug/][desc]]。"
  (goto-char (point-min))
  (while (re-search-forward "\\[\\[\\([^]|]+\\)\\]\\[\\([^]]*\\)\\]\\]" nil t)
    (let ((target (match-string 1)) (desc (match-string 2)))
      (unless (string-match "\\`[a-zA-Z][a-zA-Z0-9+.-]*:" target)
        (replace-match (format "[[wiki:/posts/%s/][%s]]" target desc) t t)))))

(defun org2site-zwsp-wrap ()
  "CJK 边界强调：两侧插 ZWSP，导出后过滤。源文件不写回。"
  (goto-char (point-min))
  (while (re-search-forward org-emph-re nil t)
    (let ((beg (match-beginning 2)) (end (match-end 2)))
      (goto-char end)
      (unless (or (eobp) (memq (char-after) '(?\s ?\t ?\n))) (insert "\u200b"))
      (goto-char beg)
      (unless (or (bobp) (memq (char-before) '(?\s ?\t ?\n))) (insert "\u200b"))
      (goto-char end))))

(defun org2site-strip-zwsp (text _backend _info)
  (replace-regexp-in-string "\u200b" "" text))
(add-to-list 'org-export-filter-final-output-functions #'org2site-strip-zwsp)

(defun org2site-template (contents _info)
  "朴素页面骨架：零 class。"
  (format "<article data-pagefind-body>\n%s\n</article>\n" contents))

(org-export-define-derived-backend 'org2site 'html
  :translate-alist '((plain-text . org2site-plain-text)
                     (template . org2site-template)))

(defun org2site-export-file (infile outfile)
  (with-current-buffer (find-file-noselect infile)
    (org2site-rewrite-wikilinks)
    (org2site-zwsp-wrap)
    (let ((out (org-export-as 'org2site nil nil nil)))
      (with-temp-file outfile (insert out)))))

(when (and noninteractive (>= (length command-line-args-left) 2))
  (org2site-export-file (nth 0 command-line-args-left) (nth 1 command-line-args-left)))
```

- [ ] **Step 4: 跑测试确认通过**

Run: `bash scripts/org2site/tests/test_export.sh`
Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/export.el scripts/org2site/tests/test_export.sh
git commit -m "feat(org2site): derived export backend fixing CJK emphasis, bare HTML, wikilinks"
```

---

## Task 6: 文本级校验脚本

**Files:**
- Create: `scripts/org2site/verify_text.py`
- Create: `scripts/org2site/tests/test_verify_text.py`

**Interfaces:**
- Consumes: 旧产物 `public/**/index.html`、新导出 HTML
- Produces: `extract_text(html: str) -> str`、`compare(old_html: str, new_html: str) -> list[tuple]`

- [ ] **Step 1: 写失败的测试**

```python
def test_extract_text_strips_tags_and_entities():
    assert extract_text("<p>a&nbsp;b</p><script>var x=1</script>") == "a b"

def test_compare_ignores_whitespace_only_differences():
    assert compare("<p>a  b</p>", "<p>a\nb</p>") == []

def test_compare_reports_real_text_loss():
    diffs = compare("<p>甲乙丙</p>", "<p>甲乙</p>")
    assert diffs and "丙" in str(diffs)

def test_compare_allows_known_punctuation_mapping():
    # md typographer -> org 的已知等价映射，不应报差异
    assert compare("<p>a——b</p>", "<p>a------b</p>") == []
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd scripts/org2site && python3 -m pytest tests/test_verify_text.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'verify_text'`

- [ ] **Step 3: 写实现**

```python
# scripts/org2site/verify_text.py
"""新旧页面正文文本比对。验收标准：零丢失。"""
from __future__ import annotations
import html, re, sys, pathlib

_SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
_TAG_RE = re.compile(r"<[^>]+>")
# 已知等价映射：md typographer 在 org 侧的对应写法
_EQUIV = (("——", "------"), ("……", "......"), ("—", "---"))

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
    a, b = _normalize(extract_text(old_html)), _normalize(extract_text(new_html))
    import difflib
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd scripts/org2site && python3 -m pytest tests/test_verify_text.py -v`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/verify_text.py scripts/org2site/tests/test_verify_text.py
git commit -m "feat(org2site): text-level verification for migration"
```

---

## Task 7: 试点端到端（20 篇 org → HTML → 文本校验）

**Files:**
- Create: `scripts/org2site/pilot.sh`

**Interfaces:**
- Consumes: Task 4 的 `org/`、Task 5 的 `export.el`、Task 6 的 `verify_text.py`
- Produces: 试点报告（stdout）；`/tmp/org2site-pilot/` 下的导出产物

- [ ] **Step 1: 写驱动脚本**

```bash
#!/usr/bin/env bash
# scripts/org2site/pilot.sh —— 试点端到端：org 导出 + 与旧产物文本比对
set -uo pipefail
cd "$(dirname "$0")/../.."          # 仓库根
OUT=/tmp/org2site-pilot
rm -rf "$OUT"; mkdir -p "$OUT"
fail=0; total=0
while read -r f; do
  rel="${f%.md}"
  orgf="org/${rel}.org"
  old="public/${rel}/index.html"
  [ -f "$orgf" ] || { echo "SKIP  无 org: $orgf"; continue; }
  [ -f "$old" ]  || { echo "SKIP  无旧产物: $old"; continue; }
  total=$((total+1))
  new="$OUT/$(echo "$rel" | tr '/' '_').html"
  if ! emacs -Q --batch -l scripts/org2site/export.el "$orgf" "$new" 2>"$OUT/err.log"; then
    echo "FAIL  导出失败: $orgf"; sed -n '1,5p' "$OUT/err.log"; fail=$((fail+1)); continue
  fi
  if python3 scripts/org2site/verify_text.py "$old" "$new" >"$OUT/diff.txt" 2>&1; then
    echo "OK    $rel"
  else
    echo "DIFF  $rel"; sed -n '1,6p' "$OUT/diff.txt"; fail=$((fail+1))
  fi
done < <(sed 's|^|content/|' scripts/org2site/pilot-list.txt)
echo "---- 合计 $total 篇，需人工过目 $fail 篇 ----"
[ "$fail" -eq 0 ]
```

注意：旧产物是**整页 HTML**（含导航/侧栏），新导出只有 `<article>`。首轮必然报差异——这正是要你人工分类的地方：属于"页面外壳"的差异不算内容丢失，属于正文文字的差异才是。

- [ ] **Step 2: 跑它**

Run: `bash scripts/org2site/pilot.sh`
Expected: 每篇输出 `OK` 或 `DIFF`，末尾给出合计

- [ ] **Step 3: 分类差异并修转换器**

对每篇 `DIFF`：打开 `$OUT/diff.txt` 判断是「页面外壳差异」（预期）还是「正文文字丢失」（bug）。正文丢失的，回到 Task 2/3 补规则 + 补测试，然后重跑。

- [ ] **Step 4: 把已知外壳差异登记为白名单**

在 `verify_text.py` 里增加 `SHELL_WHITELIST` 常量，列出旧页面里属于外壳的固定串（导航项、页脚、脚本内容），比对前从旧文本里剔除，让差异信号只剩正文。

- [ ] **Step 5: Commit**

```bash
git add scripts/org2site/
git commit -m "feat(org2site): pilot end-to-end run + shell-diff whitelist"
```

---

## Task 8: 收口 P1

**Files:**
- Modify: `docs/superpowers/specs/2026-10-17-blog-org-emacs-design.md`（记录试点结论）

- [ ] **Step 1: 跑全量单元测试与试点**

Run: `cd scripts/org2site && python3 -m pytest tests/ -v && cd ../.. && bash scripts/org2site/tests/test_export.sh && bash scripts/org2site/pilot.sh`

- [ ] **Step 2: 在 spec 末尾追加「P1 实测结论」小节**

记录：试点 N 篇中 M 篇文本零差异、K 类差异及分类结论、转换器已覆盖/未覆盖的语法清单（未覆盖项即 P2 全量迁移的前置工作）。

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-10-17-blog-org-emacs-design.md
git commit -m "docs: record P1 pilot findings in spec"
```

---

## Self-Review 记录

**Spec 覆盖**：本计划覆盖 spec 第 6 节（内容迁移）、第 9 节风险 1-5（CJK 强调 / 裸 HTML / 标点 / 引用块 / 精确写法）、第 10 节 P1-P2 前半。未覆盖（属后续计划）：渲染层各页面类型（P3）、索引层（P4）、CSS（P5）、CI 与 cron（P6）、清理（P7）。

**Placeholder 扫描**：无 TBD / 无"类似 Task N"。每个代码步骤都带可运行代码。

**类型一致性**：`split_front_matter` / `render_front_matter` / `convert_inline` / `convert_body` / `convert_file` / `extract_text` / `compare` 在定义与调用处签名一致；`org2site-*` 前缀的 elisp 函数命名统一。

**Review Focus 落点**：① 裸 HTML → Task 3 测试 + Task 5 导出断言；② CJK 强调 → Task 5 导出断言；③ 表格内 `\|` → Task 2 测试；④ 智能标点 → Task 6 等价映射测试；⑤ 引用块多段 → Task 3 测试。
