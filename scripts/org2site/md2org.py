"""md → org 单篇转换（P1 试点用）。

设计要点：
- front matter 用锚定在文件开头的正则切分，避免正文里的 --- / title 里的 --- 被误判
- 行内转换按「保护再转换」顺序：行内代码 → 图片 → wikilink → md 链接 → 粗体 → 斜体
  （粗体必须保护，否则 **x** 转成 *x* 后会被斜体规则再吃一次）
- 块级转换是行级状态机，代码块内一律原样（含 # 开头的行）
"""
from __future__ import annotations

import re
from pathlib import Path

# ---------------------------------------------------------------- front matter

_FM_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n(.*)\Z", re.S)


def _unquote_yaml(v: str) -> str:
    """YAML 引号标量的转义解码。

单引号：`''` 表示一个撇号（`title: 'What I''m doing now'` → `What I'm doing now`）。
双引号：处理 \\" \\\\ \\n \\t \\r \\/ 。
不处理的话标题会带着 `''` 出现在 <title> 和 <h1> 上。
"""
    if len(v) < 2 or v[0] != v[-1] or v[0] not in "'\"":
        return v
    inner = v[1:-1]
    if v[0] == "'":
        return inner.replace("''", "'")
    return re.sub(
        r"\\(.)",
        lambda m: {"n": "\n", "t": "\t", "r": "\r"}.get(m.group(1), m.group(1)),
        inner,
    )


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
            fm[k] = [_unquote_yaml(s.strip()) for s in v[1:-1].split(",") if s.strip()]
        elif len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
            fm[k] = _unquote_yaml(v)
        else:
            fm[k] = v
    return fm, body


_DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?))?")

_FM_ORG_KEYS = (
    ("status", "STATUS"),
    ("header", "HEADER"),
    ("location", "LOCATION"),
    ("series", "SERIES"),
)


def render_front_matter(fm: dict) -> list[str]:
    """front matter dict → org 关键字行。"""
    out: list[str] = []
    if title := fm.get("title"):
        out.append(f"#+TITLE: {title}")
    if date := fm.get("date"):
        m = _DATE_RE.match(str(date))
        if m:
            # 保留原始时分秒：RSS 的 pubDate 需要精确时间，不能补成 12:00
            stamp = m.group(1) + (" " + m.group(2) if m.group(2) else "")
            out.append(f"#+DATE: <{stamp}>")
    if tags := fm.get("tags"):
        out.append("#+TAGS[]: " + ",".join(tags if isinstance(tags, list) else [tags]))
    for key, org_key in _FM_ORG_KEYS:
        if v := fm.get(key):
            out.append(f"#+{org_key}: {v}")
    if aliases := fm.get("aliases"):
        out.append(
            "#+ALIASES[]: " + ",".join(aliases if isinstance(aliases, list) else [aliases])
        )
    return out


# ------------------------------------------------------------------- 行内语法

_IMG_RE = re.compile(r"!\[([^\]]*)\]\(([^)\s]+)\)")
_MD_LINK_RE = re.compile(r"(?<!!)\[((?:[^\[\]]|\[[^\[\]]*\])+)\]\(([^)\s]+)\)")
# Hugo 的 relref 短代码当链接 URL：[text]({{< relref "slug" >}})
_SHORTCODE_LINK_RE = re.compile(
    r'\[([^\]]+)\]\(\{\{<\s*relref\s+"([^"]+)"\s*>\}\}/?\)'
)
_WIKI_RE = re.compile(r"\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]")
_BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
_ITALIC_RE = re.compile(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])")
_CODE_RE = re.compile(r"`([^`]+)`")
_FN_REF_RE = re.compile(r"\[\^([^\]]+)\]")


def _protect(store: list[str], s: str) -> str:
    store.append(s)
    return f"\x00{len(store) - 1}\x00"


def _restore(store: list[str], s: str) -> str:
    """占位符会嵌套（后摘出的片段里含先摘出的占位符），必须反复替换到稳定。
    单趟遍历会漏掉嵌套项，把 \\x00N\\x00 泄漏进最终文本。"""
    for _ in range(len(store) + 1):
        before = s
        for i, v in enumerate(store):
            s = s.replace(f"\x00{i}\x00", v)
        if s == before:
            break
    return s


def _typo(s: str) -> str:
    """SmartyPants 风格排印（对齐原站 typographer）：... → …、--- → —、-- → –。

    只作用于**文本**：URL、行内代码、代码块一律不碰。
    加粗 / 链接文字 / 图片 alt 里的文本也要单独过一遍 —— 这些区域在 convert_inline
    里是先摘成占位符保护的，只靠最后那趟全量替换会漏（实测 `**.......**` 原站显示 …，
    我们留字面省略号，全站 3 页）。
    """
    return s.replace("...", "…").replace("---", "—").replace("--", "–")


def convert_inline(s: str) -> str:
    """行内 md → org。已生成的目标语法先摘出保护，避免被后续规则二次处理。"""
    keep: list[str] = []
    s = _CODE_RE.sub(lambda m: _protect(keep, f"={m.group(1)}="), s)
    s = _SHORTCODE_FIGURE_RE.sub(
        lambda m: _protect(keep, f"[[file:{m.group(1)}]]"), s
    )
    s = _FN_REF_RE.sub(lambda m: _protect(keep, f"[fn:{m.group(1)}]"), s)
    s = _IMG_RE.sub(
        lambda m: _protect(keep, f"[[file:{m.group(2)}][{_typo(m.group(1))}]]"), s
    )
    s = _WIKI_RE.sub(
        lambda m: _protect(
            keep,
            f"[[{m.group(1)}][{_typo(m.group(2))}]]" if m.group(2) else f"[[{m.group(1)}]]",
        ),
        s,
    )
    s = _SHORTCODE_LINK_RE.sub(
        lambda m: _protect(keep, f"[[{m.group(2)}][{_typo(m.group(1))}]]"), s
    )
    s = _MD_LINK_RE.sub(
        lambda m: _protect(keep, f"[[{m.group(2)}][{_typo(m.group(1))}]]"), s
    )
    s = _BOLD_RE.sub(lambda m: _protect(keep, f"*{_typo(m.group(1))}*"), s)
    s = _ITALIC_RE.sub(r"/\1/", s)
    # 剩下没被保护的纯文本（正文、标题、表格单元、引用等）过一遍排印规则。
    # 破折号不做这步的话，`------` 会原样显示成 6 个连字符（原站显示 ——），锚点也跟着不一致。
    s = _typo(s)
    return _restore(keep, s)


# ------------------------------------------------------------------- 块级语法

_FENCE_RE = re.compile(r"^```([A-Za-z0-9_+-]*)\s*$")
# <style>/<script> 整块原样输出：内容里有 CSS/JS 的 { } < >，不能走行内标签处理
_RAW_BLOCK_START_RE = re.compile(r"^\s*<(style|script)\b", re.I)
_RAW_BLOCK_END_RE = re.compile(r"</(style|script)>", re.I)
_TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$")
_TABLE_SEP_RE = re.compile(r"^\s*\|[\s:|-]+\|\s*$")
_HR_RE = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$")
_QUOTE_RE = re.compile(r"^\s*>")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_FN_DEF_RE = re.compile(r"^\[\^([^\]]+)\]:\s*(.*)$")
_ATTR_RE = re.compile(r"\s*\{#([^}]+)\}\s*$")
_HTML_COMMENT_RE = re.compile(r"^\s*<!--.*?-->\s*$")
_SHORTCODE_FIGURE_RE = re.compile(r"\{\{<\s*figure\s+src=\"([^\"]+)\"[^>]*>\}\}")

# 只放行常见内联标签，避免把正文里的比较符号误当标签
# 成对标签整体包裹，源文件更可读；剩下的孤立标签（如 <br>）单独处理
# 允许放行的裸 HTML 标签：内联 **加上块级**。
# 块级标签必须一起放行 —— 不放行会被 org 的 plain-text 转义成字面文本
# （about 页开头的 <div class="text-center text-2xl"> 就是这么变成可见源码的）。
_TAG_NAMES = (
    "sub|sup|kbd|mark|br|abbr|span|small|u|b|i|em|strong|code|"
    "div|p|section|table|thead|tbody|tr|td|th|figure|figcaption|pre|"
    "blockquote|ul|ol|li|dl|dt|dd|h1|h2|h3|h4|h5|h6|img|a|hr|"
    "details|summary|button|input|label|form|select|option|textarea|"
    "nav|aside|svg|path|circle|rect|line|polyline|polygon|use|"
    # 自定义元素（HTML 规范允许含连字符），如 search 页的 <pagefind-input>
    "[a-z]+(?:-[a-z]+)+"
)
_PAIRED_TAG_RE = re.compile(
    rf"<(?P<t>{_TAG_NAMES})(?:\s[^>]*)?>(?P<inner>[^<]*?)</(?P=t)>"
)
_SINGLE_TAG_RE = re.compile(rf"</?(?:{_TAG_NAMES})(?:\s[^>]*)?/?>")
# 行内代码/verbatim 段：`_wrap_html` 要先护住它们（内部的 HTML 不能包 export snippet）
_VERBATIM_SPAN_RE = re.compile(r"=[^=\n]+=|~[^~\n]+~")
# 块级 HTML：独占一行的块级标签必须走 export block 原样输出。
# 否则会被 org 当成段落包进 <p>（<div> 套 <p> 是无效 HTML），
# 不在白名单里的（如 <link>）还会被转义成可见源码。
_BLOCK_LINE_RE = re.compile(
    r"^\s*</?(?:div|section|article|main|header|footer|table|thead|tbody|tfoot|tr|td|th|"
    r"figure|figcaption|pre|blockquote|ul|ol|li|dl|dt|dd|h[1-6]|hr|details|summary|"
    r"nav|aside|link|meta|iframe|video|audio|picture|source|canvas|svg|form|fieldset|"
    r"template|noscript|colgroup|col)\b",
    re.I,
)


def _wrap_html(s: str) -> str:
    """裸内联 HTML → org export snippet（否则 ox-html 会把它转义）。"""
    keep: list[str] = []
    # 先护住 =verbatim= / ~code~ 段：它们里面的 <p> 之类**不能**包成 export snippet，
    # 因为 org 在 verbatim 内不解析 @@html:...@@，会把整串当字面文本显示出来
    # （实测：22 个页面上出现了字面的 @@html:<p>@@）。
    s = _VERBATIM_SPAN_RE.sub(lambda m: _protect(keep, m.group(0)), s)
    s = _PAIRED_TAG_RE.sub(lambda m: _protect(keep, f"@@html:{m.group(0)}@@"), s)
    s = _SINGLE_TAG_RE.sub(lambda m: _protect(keep, f"@@html:{m.group(0)}@@"), s)
    return _restore(keep, s)


def _join_footnote_lines(lines: list[str]) -> list[str]:
    """把跨行的脚注定义合并成一行：md 允许
           [^1]: [长链接文本
                 续行](url)
    只处理「脚注定义行 + 紧跟的缩进续行」。"""
    out: list[str] = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if _FN_DEF_RE.match(ln):
            buf = ln
            i += 1
            while i < len(lines) and lines[i].strip() and lines[i][:1] in (" ", "\t"):
                buf += " " + lines[i].strip()
                i += 1
            out.append(buf)
            continue
        out.append(ln)
        i += 1
    return out


def _in_code_span(line: str, pos: int) -> bool:
    """pos 处是否位于行内代码（反引号）内部。"""
    return line[:pos].count("`") % 2 == 1


def convert_body(md: str) -> str:
    """块级 md → org。行级状态机；代码块内不做任何转换。"""
    lines = _join_footnote_lines(md.split("\n"))
    out: list[str] = []
    in_quote = False
    in_code = False
    in_comment = False
    in_raw = False

    for ln in lines:
        fence = _FENCE_RE.match(ln)

        if in_code:
            if fence:
                out.append("#+END_SRC")
                in_code = False
            else:
                out.append(ln)
            continue

        if fence:
            lang = fence.group(1)
            out.append(f"#+BEGIN_SRC {lang}".strip())
            in_code = True
            continue

        # HTML 注释：整行的、行内单行的、跨行的一律剔除（旧站也不渲染）
        if in_comment:
            if "-->" in ln:
                in_comment = False
                tail = ln.split("-->", 1)[1]
                if tail.strip():
                    out.append(_wrap_html(convert_inline(tail)))
            continue
        if _HTML_COMMENT_RE.match(ln):
            continue
        # 反引号内的 <!-- 是行内代码的内容，不能当注释删
        if "<!--" in ln and not _in_code_span(ln, ln.index("<!--")):
            if "-->" in ln:
                ln = re.sub(r"<!--.*?-->", "", ln)
                if not ln.strip():
                    continue
            else:
                in_comment = True
                ln = ln.split("<!--", 1)[0]
                if not ln.strip():
                    continue

        heading = _HEADING_RE.match(ln)
        if heading:
            level = len(heading.group(1))
            text = heading.group(2)
            attr = _ATTR_RE.search(text)
            if attr:
                text = text[: attr.start()].rstrip()
            out.append("*" * level + " " + convert_inline(text))
            if attr:
                out.extend([":PROPERTIES:", f":CUSTOM_ID: {attr.group(1)}", ":END:"])
            continue

        fndef = _FN_DEF_RE.match(ln)
        if fndef:
            # 脚注内容里同样有链接/代码，必须走内联转换，否则残留在成文里
            out.append(f"[fn:{fndef.group(1)}] {convert_inline(fndef.group(2))}".rstrip())
            continue

        # Markdown 的硬换行标记（行尾单个反斜杠）不能落到 org 里：
        # org 会把它当字面字符输出，页面上就多出一个可见的 "\"。
        if ln.endswith("\\") and not ln.endswith("\\\\"):
            ln = ln[:-1].rstrip()

        # <style>/<script> 整块原样输出（search 页整页内联 CSS/JS 靠这条）
        if in_raw:
            out.append(ln)
            if _RAW_BLOCK_END_RE.search(ln):
                out.append("#+END_EXPORT")
                in_raw = False
            continue
        if _RAW_BLOCK_START_RE.match(ln):
            out.append("#+BEGIN_EXPORT html")
            out.append(ln)
            if _RAW_BLOCK_END_RE.search(ln):
                out.append("#+END_EXPORT")
            else:
                in_raw = True
            continue

        # 独占一行的块级标签：同样走 export block。
        # 否则 org 会把它当段落 → <div> 被包进 <p>（无效 HTML），
        # 不在白名单里的标签（如 <link>）还会被转义成可见源码。
        if _BLOCK_LINE_RE.match(ln):
            out.append("#+BEGIN_EXPORT html")
            out.append(ln)
            out.append("#+END_EXPORT")
            continue

        if _QUOTE_RE.match(ln):
            if not in_quote:
                out.append("#+BEGIN_QUOTE")
                in_quote = True
            out.append(convert_inline(re.sub(r"^\s*>\s?", "", ln)))
            continue
        if in_quote:
            out.append("#+END_QUOTE")
            out.append("")
            in_quote = False

        if _TABLE_ROW_RE.match(ln):
            if _TABLE_SEP_RE.match(ln):
                # md 的分隔行在 org 里是 hline，保留表头语义
                cells = len([c for c in ln.strip().strip("|").split("|")])
                out.append("|" + "+".join(["----"] * cells) + "|")
            else:
                out.append(_wrap_html(convert_inline(ln.strip())))
            continue

        if _HR_RE.match(ln):
            out.append("-----")
            out.append("")
            continue

        if not ln.strip():
            out.append("")
            continue

        out.append(_wrap_html(convert_inline(ln)))

    if in_quote:
        out.append("#+END_QUOTE")
    if in_code:
        out.append("#+END_SRC")
    return "\n".join(out)


# ---------------------------------------------------------------------- 入口


def convert_file(src: Path, dst: Path) -> None:
    text = Path(src).read_text(encoding="utf-8")
    fm, body = split_front_matter(text)
    parts = render_front_matter(fm) + [""] + [convert_body(body).strip("\n"), ""]
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    Path(dst).write_text("\n".join(parts) + "\n", encoding="utf-8")


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: md2org.py <src.md> <dst.org>")
        return 2
    convert_file(Path(argv[1]), Path(argv[2]))
    return 0


if __name__ == "__main__":
    import sys

    raise SystemExit(main(sys.argv))
