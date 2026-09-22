#!/usr/bin/env python3
"""
Org -> Markdown converter for the tianheg.co Hugo blog.

Dry-run by default: writes converted *.md to --out mirror and a JSON/text report.
--apply converts in place (used only after dry-run review).

Design notes
------------
* Front matter #+KEY: -> YAML (order: title, status, date, header, ...).
* Body is converted by a line-level state machine so that code/example/quote/export
  block contents are never touched by inline conversions.
* Bare HTML in normal text is ESCAPED, because go-org escapes it (verified on the
  live site: "Why &lt;h1&gt; should be one per page?"). Intentional HTML lives in
  #+BEGIN_EXPORT html / #+BEGIN_HTML blocks and is passed through raw.
* Ambiguous/unknown constructs are recorded in the report instead of guessed.
"""
import argparse
import collections
import difflib
import json
import os
import re
import sys

# ----------------------------------------------------------------------------- helpers

ORG_TS = re.compile(r"<(\d{4})-(\d{2})-(\d{2})(?:[ \t]+[A-Za-z\u4e00-\u9fff]{2,10})?(?:[ \t]+(\d{1,2}):(\d{2}))?>")
ORG_TS_FULL = re.compile(r"<(\d{4})-(\d{2})-(\d{2})(?:[ \t]+([A-Za-z\u4e00-\u9fff/\-]{2,12}))?(?:[ \t]+(\d{1,2}):(\d{2}))?>")

KEY_ORDER = ["title", "status", "date", "header", "tags", "location", "description",
             "type", "outputs", "draft", "weight", "slug", "aliases"]

SAFE_LANGS = {
    "sh": "bash", "bash": "bash", "shell": "bash", "console": "bash", "zsh": "bash",
    "python": "python", "py": "python", "go": "go", "golang": "go", "js": "javascript",
    "javascript": "javascript", "ts": "typescript", "typescript": "typescript",
    "json": "json", "yaml": "yaml", "yml": "yaml", "toml": "toml", "ini": "ini",
    "html": "html", "css": "css", "scss": "scss", "sql": "sql", "diff": "diff",
    "org": "org", "text": "text", "txt": "text", "md": "markdown", "markdown": "markdown",
    "c": "c", "cpp": "cpp", "java": "java", "lisp": "lisp", "el": "lisp", "elisp": "lisp",
    "vim": "vim", "vimrc": "vim", "nginx": "nginx", "conf": "ini", "dockerfile": "dockerfile",
    "make": "makefile", "makefile": "makefile", "xml": "xml", "csv": "csv", "php": "php",
    "ruby": "ruby", "rust": "rust", "kotlin": "kotlin", "swift": "swift", "perl": "perl",
    "scala": "scala", "lua": "lua", "r": "r", "matlab": "matlab", "powershell": "powershell",
    "ps1": "powershell", "bat": "batch", "cmd": "batch", "http": "http", "protobuf": "protobuf",
    "proto": "protobuf", "graphql": "graphql", "systemd": "ini", "nix": "nix",
}

HTML_TAG = re.compile(r"</?([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*)?/?>")

CODE_SPAN = re.compile(r"(?<![\w=~])([=~])(?![\s=~])((?:(?!\1)[^\n])+?)(?<!\s)\1(?![\w=~])")
LINK_TWO = re.compile(r"\[\[([^\]\n]+)\]\[([^\]\n]*)\]\]")
LINK_ONE = re.compile(r"\[\[([^\]\n]+)\]\]")
FN_REF = re.compile(r"\[fn:([^\]\n]+)\]")
FN_DEF = re.compile(r"^\[fn:([^\]\n]+)\]\s*(.*)$")
BOLD = re.compile(r"(?<![\w*])\*(?![\s*])([^*\n]+?)(?<![\s*])\*(?![\w*])")
STRIKE = re.compile(r"(?<![\w+])\+(?![\s+])([^+\n]{1,80}?)(?<![\s])\+(?![\w+])")
ITALIC = re.compile(r"(?<![\w/:])(/(?![\s/*])[^/\n]+?(?<![\s])/)(?![\w/])")
IMG_LINK = re.compile(r"^\[\[(?:file:)?([^\]\[]+?\.(?:png|jpe?g|gif|webp|svg|avif|bmp|tiff?))\]\](\{.*\})?$", re.I)
HR = re.compile(r"^\s*-{5,}\s*$")
TBL_SEP = re.compile(r"^\s*\|([-+ ]+)\|\s*$")
TBL_ROW = re.compile(r"^\s*\|.*\|\s*$")
HEADING = re.compile(r"^(\*{1,6})\s+(.*)$")
LIST_UNORDERED = re.compile(r"^(\s*)[-+]\s+(.*)$")
CHECKBOX = re.compile(r"^(\s*[-+]\s+)\[([Xx ])\](\s+.*)?$")
ZERO_WIDTH = "\u200b\ufeff"
MORE_DIVIDER = re.compile(r"^#\s+more\s*$")
PANDOC_ATTR = re.compile(r"\s*\{#([^}]*)\}\s*$")
PANDOC_ATTR2 = re.compile(r"\{[#.][^}\n]*\}")
BARE_HTML = re.compile(r"<(?:[a-zA-Z][a-zA-Z0-9]*)(?:\s[^<>]*)?/?>")
BAD_SRC_LOWER = re.compile(r"^#\+begin_src\s*([a-zA-Z0-9_+-]*)\s*(.*)$")
BAD_END_LOWER = re.compile(r"^#\+end_src\s*$")


def yaml_scalar(v):
    v = str(v)
    if v == "":
        return "''"
    if re.fullmatch(r"[A-Za-z0-9_./+-]+", v) and v.lower() not in ("true", "false", "null", "yes", "no"):
        return v
    return "'" + v.replace("'", "''") + "'"


def yaml_list(items):
    return "[" + ", ".join(yaml_scalar(i) for i in items) + "]"


def convert_date(v):
    """Normalise front-matter date. Returns (value, note)."""
    note = ""
    s = v.strip()
    m = ORG_TS_FULL.fullmatch(s)
    if m:
        y, mo, d, _day, hh, mm = m.groups()
        if hh:
            note = "org timestamp -> ISO with time (+08:00)"
            return f"{y}-{mo}-{d}T{int(hh):02d}:{int(mm):02d}:00+08:00", note
        note = "org timestamp (date only) -> ISO date"
        return f"{y}-{mo}-{d}", note
    # "YYYY-MM-DD HH:MM:SS +0800" (rfc822-ish)
    m = re.fullmatch(r"(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*([+-]\d{4})", s)
    if m:
        t = m.group(2) if m.group(2).count(":") == 2 else m.group(2) + ":00"
        return f"{m.group(1)}T{t}{m.group(3)[:3]}:{m.group(3)[3:]}", "rfc822-ish -> ISO"
    # ISO without timezone
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?", s):
        note = "ISO without tz -> append +08:00"
        return (s if s.count(":") == 2 else s + ":00") + "+08:00", note
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s, "ISO date only"
    note = "UNRECOGNISED date format"
    return s, note


def build_frontmatter(kv):
    """kv: list of (KEY, is_list, value). Returns (yaml_text, notes, extra_params)."""
    notes = []
    multi = collections.OrderedDict()
    for key, is_list, value in kv:
        multi.setdefault(key, []).append((is_list, value))
    out = collections.OrderedDict()
    for key in list(multi):
        vals = multi[key]
        if key == "TITLE":
            out["title"] = yaml_scalar(vals[-1][1])
            if len(vals) > 1:
                notes.append(f"{len(vals)} TITLE lines, kept last")
        elif key == "DATE":
            v, n = convert_date(vals[-1][1])
            notes.append(f"date: {n}")
            out["date"] = v if n.startswith("ISO") or "ISO" in n else yaml_scalar(v)
            if "org timestamp" in n:
                out["date"] = v
        elif key == "STATUS":
            out["status"] = yaml_scalar(vals[-1][1].lower())
        elif key == "HEADER":
            out["header"] = yaml_scalar(vals[-1][1])
        elif key in ("TAGS", "TAGS[]", "TAG"):
            items = []
            for is_list, value in vals:
                items += [x for x in re.split(r"[,\s]+", value) if x]
            out["tags"] = yaml_list(items)
        elif key == "LOCATION":
            out["location"] = yaml_scalar(vals[-1][1])
        elif key == "DESCRIPTION":
            out["description"] = yaml_scalar(vals[-1][1])
        elif key == "TYPE":
            out["type"] = yaml_scalar(vals[-1][1])
        elif key == "OUTPUTS":
            items = [x for x in re.split(r"[,\s]+", vals[-1][1]) if x]
            out["outputs"] = yaml_list(items)
        elif key == "DRAFT":
            out["draft"] = "true" if vals[-1][1].strip().lower() in ("true", "yes", "t") else "false"
        elif key == "WEIGHT":
            out["weight"] = vals[-1][1].strip()
        elif key in ("TOC", "TOC[]"):
            notes.append("dropped #+TOC (go-org does not render it; md template TOC applies)")
        elif key in ("CAPTION", "NAME", "RESULTS", "ATTR_HTML", "HTML_HEAD", "PROPERTY", "OPTIONS"):
            notes.append(f"dropped #{key}: {vals[-1][1][:60]!r}")
        else:
            note = f"UNKNOWN front matter key #{key} -> kept as {key.lower()} param"
            notes.append(note)
            out[key.lower()] = yaml_scalar(vals[-1][1])
    lines = ["---"]
    ordered_keys = [k for k in KEY_ORDER if k in out] + [k for k in out if k not in KEY_ORDER]
    for k in ordered_keys:
        lines.append(f"{k}: {out[k]}")
    lines.append("---")
    return "\n".join(lines), notes


# ----------------------------------------------------------------------------- body

class Ctx:
    def __init__(self):
        self.report = collections.Counter()
        self.warn = []

    def hit(self, name, n=1):
        self.report[name] += n

    def warnf(self, msg):
        if msg not in self.warn:
            self.warn.append(msg)


def inline(text, ctx):
    if not text:
        return text
    # zero width junk
    n = sum(text.count(c) for c in ZERO_WIDTH)
    if n:
        ctx.hit("zwsp removed", n)
        for c in ZERO_WIDTH:
            text = text.replace(c, "")
    # pandoc escape residue: \_ and \_{...}
    if "\\_" in text:
        ctx.hit("pandoc \\_ escape cleaned")
        text = re.sub(r"\\_\{([^}]*)\}", r"_\1", text)
        text = text.replace("\\_", "_")
    # pandoc citation residue [@2] / [@3, p. 33] — org rendered these as nothing
    if "[@" in text:
        new_text = re.sub(r"\[@[0-9]+[^\]\n]{0,14}\]", "", text)
        if new_text != text:
            ctx.hit("pandoc [@N] citation residue stripped")
            text = new_text
    # bare html in org text is escaped by go-org (do this BEFORE turning @@html:@@ into real HTML,
    # so our own generated markup survives)
    if BARE_HTML.search(text):
        ctx.hit("bare html escaped")
        text = BARE_HTML.sub(lambda mm: mm.group(0).replace("<", "&lt;").replace(">", "&gt;"), text)
    # org export snippets: @@html:<span>@@ -> raw html, other backends dropped
    if "@@" in text:
        nh = len(re.findall(r"@@html:(.+?)@@", text, re.S))
        if nh:
            ctx.hit("inline export @@html:@@ -> raw html", nh)
            text = re.sub(r"@@html:(.+?)@@", r"\1", text, flags=re.S)
        no = len(re.findall(r"@@[a-zA-Z-]+:.+?@@", text, re.S))
        if no:
            ctx.hit("inline export (other backend) dropped", no)
            text = re.sub(r"@@[a-zA-Z-]+:.+?@@", "", text, flags=re.S)
    # code spans: =verbatim= and ~code~  (protected with placeholders)
    spans = []
    def code_repl(m):
        ctx.hit("code span (= or ~)")
        body = m.group(2)
        spans.append(("`` " + body + " ``") if "`" in body else ("`" + body + "`"))
        return f"\x00{len(spans)-1}\x00"
    text = CODE_SPAN.sub(code_repl, text)
    # org subscript/superscript with braces -> raw HTML (md has no equivalent)
    nsub = len(re.findall(r"_\{[^}\n]*\}", text))
    nsup = len(re.findall(r"\^\{[^}\n]*\}", text))
    if nsub or nsup:
        if nsub:
            ctx.hit("subscript _{x} -> <sub>", nsub)
        if nsup:
            ctx.hit("superscript ^{x} -> <sup>", nsup)
        text = re.sub(r"_\{([^}\n]*)\}", r"<sub>\1</sub>", text)
        text = re.sub(r"\^\{([^}\n]*)\}", r"<sup>\1</sup>", text)
    # links
    def link2(m):
        target, desc = m.group(1), m.group(2)
        if target.startswith("file:"):
            ctx.hit("image link [[file:][desc]] -> ![]()")
            return f"![{desc}]({target[5:]})"
        ctx.hit("link [[u][t]]")
        return f"[{desc}]({target})"
    text = LINK_TWO.sub(link2, text)
    def link1(m):
        u = m.group(1)
        if u.startswith("file:"):
            ctx.hit("image link [[file:]] -> ![]()")
            return f"![]({u[5:]})"
        if IMG_LINK.match(m.group(0)):
            ctx.hit("bare image link -> ![]()")
            return f"![]({u})"
        if u.startswith(("http://", "https://")):
            ctx.hit("link [[u]] (autolink)")
            return f"<{u}>"
        ctx.hit("link [[u]]")
        return f"[{u}]({u})"
    text = LINK_ONE.sub(link1, text)
    # footnotes
    def fnr(m):
        ctx.hit("footnote ref")
        return f"[^{m.group(1)}]"
    text = FN_REF.sub(fnr, text)
    # org strikethrough +text+ -> ~~text~~
    def strike(m):
        ctx.hit("strikethrough +x+ -> ~~x~~")
        return "~~" + m.group(1) + "~~"
    text = STRIKE.sub(strike, text)
    # emphasis
    def bold(m):
        ctx.hit("bold *x* -> **x**")
        return f"**{m.group(1)}**"
    text = BOLD.sub(bold, text)
    def ital(m):
        inner = m.group(1)
        if "://" in inner:
            ctx.warnf(f"skipped italic-like span containing :// : {inner[:40]}")
            return m.group(0)
        ctx.hit("italic /x/ -> *x*")
        return "*" + inner[1:-1] + "*"
    text = ITALIC.sub(ital, text)
    # org timestamps in body -> escaped literal text
    def ts(m):
        ctx.hit("body org timestamp escaped")
        return "\\<" + m.group(0)[1:-1] + "\\>"
    text = ORG_TS.sub(ts, text)
    # restore protected code spans
    if spans:
        text = re.sub(r"\x00(\d+)\x00", lambda m: spans[int(m.group(1))], text)
    return text


def norm_list_indent(ind):
    """Map org list indentation (usually multiples of 3 or 4) onto md-friendly 2-space steps."""
    if ind <= 0:
        return 0
    return min(ind, 3) if ind <= 3 else (ind // 3) * 2


def build_indent_map(lines):
    """Per-file list indentation mapping: org's 3/4-space nesting -> md's 2-space steps."""
    inds = set()
    in_block = False
    for l in lines:
        s = l.strip()
        if re.match(r"^#\+BEGIN_(SRC|EXAMPLE|EXPORT|HTML|QUOTE|VERSE|CENTER)", s, re.I):
            in_block = True
            continue
        if re.match(r"^#\+END_(SRC|EXAMPLE|EXPORT|HTML|QUOTE|VERSE|CENTER)", s, re.I):
            in_block = False
            continue
        if in_block:
            continue
        m = re.match(r"^(\s*)(?:[-+]\s+\S|\d+[.)]\s+\S)", l)
        if m:
            inds.add(len(m.group(1)))
    if not inds:
        return {}
    base = min(inds)
    others = sorted(x for x in inds if x > base)
    step = (others[0] - base) if others else 1
    if base <= 3 and step <= 3:
        return {i: i for i in inds}
    return {i: max(0, ((i - base) // step) * 2) for i in inds}


def convert_body(body, ctx):
    lines = body.split("\n")
    imap = build_indent_map(lines)
    out = []
    i = 0
    src_depth = 0          # inside ``` fence
    fence = "```"
    stack = []             # block stack for quote/example/export
    quote_buf = []
    pending_caption = None
    pending_attr = None
    blk = {"map": {}}

    def _prev_is_list(o):
        for l in reversed(o):
            if l.strip() == "":
                continue
            return bool(re.match(r"^\s*(?:[-+*]|\d+[.)])\s+\S", l))
        return False

    def map_ind(ind):
        """Per-block indent mapping: first indent of a block -> 0, deeper -> +2."""
        if not _prev_is_list(out):
            blk["map"] = {}
        if not blk["map"]:
            blk["map"] = {ind: 0}
            return 0
        if ind in blk["map"]:
            return blk["map"][ind]
        keys = sorted(blk["map"])
        if ind > keys[-1]:
            blk["map"][ind] = blk["map"][keys[-1]] + 2
            return blk["map"][ind]
        lower = [k for k in keys if k < ind]
        if not lower:
            blk["map"] = {ind: 0}
            return 0
        blk["map"][ind] = blk["map"][max(lower)]
        return blk["map"][max(lower)]

    def flush_quote():
        if quote_buf:
            for q in quote_buf:
                out.append(("> " + inline(q, ctx)) if q.strip() else ">")
            out.append("")
            quote_buf.clear()

    while i < len(lines):
        raw = lines[i]
        line = raw.replace("\t", "    ") if not src_depth else raw
        stripped = line.strip()

        # join org links wrapped across lines (go-org renders them as one link).
        # Done first so list items / table rows / headings with wrapped links also work.
        if line.count("[[") > line.count("]]") and stripped and not stripped.startswith("#+"):
            joined = line
            k = i + 1
            while k < len(lines) and joined.count("[[") > joined.count("]]"):
                joined = joined.rstrip() + " " + lines[k].strip()
                k += 1
            if joined.count("[[") <= joined.count("]]"):
                ctx.hit("multi-line org link joined")
                line = joined
                i = k - 1
            else:
                ctx.warnf(f"unterminated [[ link near line {i+1}")

        # ---------------- inside fenced code: copy verbatim (legacy path, kept as guard)
        if src_depth:
            if re.match(r"^#\+END_SRC", stripped, re.I):
                out.append("```")
                src_depth -= 1
                ctx.hit("src block closed")
                i += 1
                continue
            out.append(raw)
            i += 1
            continue

        # ---------------- block openers
        m = re.match(r"^#\+BEGIN_SRC\s*([a-zA-Z0-9_+#.-]*)\s*(.*)$", stripped, re.I)
        if m:
            lang_raw = (m.group(1) or "").lower()
            lang = SAFE_LANGS.get(lang_raw, lang_raw or "")
            if lang_raw and lang_raw not in SAFE_LANGS:
                ctx.warnf(f"unmapped src language: {lang_raw}")
            j = i + 1
            buf = []
            while j < len(lines) and not re.match(r"^#\+END_SRC\b", lines[j].strip(), re.I):
                buf.append(lines[j])
                j += 1
            if j >= len(lines):
                ctx.warnf(f"unterminated #+BEGIN_SRC at line {i+1}")
            i = j + 1
            body_text = "\n".join(buf)
            longest = max([len(x.group(0)) for x in re.finditer(r"`+", body_text)] or [0])
            f = "`" * max(3, longest + 1)
            out.append(f + lang)
            out.extend(buf)
            out.append(f)
            ctx.hit("src block")
            if stripped.startswith("#+begin_src"):
                ctx.hit("lowercase begin_src normalised")
            continue

        m = re.match(r"^#\+BEGIN_(EXAMPLE|QUOTE|EXPORT|HTML|CENTER|VERSE|COMMENT)\b\s*(.*)$", stripped, re.I)
        if m:
            kind = m.group(1).upper()
            rest = m.group(2).strip()
            endre = re.compile(rf"^#\+END_{kind}\b", re.I)
            # collect until matching end
            j = i + 1
            buf = []
            while j < len(lines):
                if endre.match(lines[j].strip()):
                    break
                buf.append(lines[j])
                j += 1
            if j >= len(lines):
                ctx.warnf(f"unterminated #+BEGIN_{kind} at line {i+1}")
            i = j + 1
            if kind == "QUOTE":
                ctx.hit("quote block")
                if rest:
                    buf.insert(0, rest)
                for b in buf:
                    quote_buf.append(b.strip())
                flush_quote()
                continue
            if kind == "EXAMPLE":
                ctx.hit("example block -> fenced")
                while buf and buf[-1].strip() == "":
                    buf.pop()
                longest = max([len(x.group(0)) for x in re.finditer(r"`+", "\n".join(buf))] or [0])
                f = "`" * max(3, longest + 1)
                out.append(f)
                out.extend(buf)
                out.append(f)
                out.append("")
                continue
            if kind in ("EXPORT", "HTML"):
                ctx.hit("raw html block passed through")
                out.extend(buf)
                if buf and buf[-1].strip() != "":
                    out.append("")
                continue
            if kind == "CENTER":
                cls = "text-center"
                classes = re.findall(r":class\s+([^\s:]+)", pending_attr or "")
                if classes:
                    cls += " " + " ".join(classes)
                    ctx.hit("ATTR_HTML class merged into CENTER div")
                    pending_attr = None
                ctx.hit("CENTER block -> <div>")
                out.append(f'<div class="{cls}">')
                for b in buf:
                    out.append(inline(b, ctx) if b.strip() else "")
                out.append("</div>")
                out.append("")
                continue
            if kind == "COMMENT":
                ctx.hit("comment block dropped")
                continue
            if kind == "VERSE":
                ctx.warnf(f"#+BEGIN_VERSE at line {i+1} converted as quote")
                for b in buf:
                    quote_buf.append(b)
                flush_quote()
                continue

        # ---------------- headings
        m = HEADING.match(line)
        if m:
            stars, text = m.group(1), m.group(2)
            text = inline(text, ctx)
            # pandoc residue {#anchor} on heading -> keep as md attribute
            am = PANDOC_ATTR.search(text)
            if am:
                ctx.hit("heading anchor residue kept as attribute")
            out.append("#" * (len(stars) + 1) + " " + text)
            i += 1
            continue

        # ---------------- hr (md: '---' after a text line = setext h2, must be preceded by blank)
        if HR.match(line):
            ctx.hit("hr ----- -> ---")
            if out and out[-1].strip() != "":
                out.append("")
            out.append("---")
            out.append("")
            i += 1
            continue

        # ---------------- table block (org tables have no rule line requirement;
        # md needs a delimiter row, so synthesise one after the header row)
        if TBL_ROW.match(line):
            rows = []
            sep_idx = None
            j = i
            while j < len(lines) and (TBL_ROW.match(lines[j]) or TBL_SEP.match(lines[j])):
                if TBL_SEP.match(lines[j]) and sep_idx is None:
                    sep_idx = len(rows)
                rows.append(lines[j].rstrip())
                j += 1
            ncol = 0
            for r in rows:
                if not TBL_SEP.match(r):
                    ncol = max(ncol, len([c for c in r.strip().strip("|").split("|")]))
            ncol = max(ncol, 1)
            delim = "| " + " | ".join(["---"] * ncol) + " |"
            if sep_idx is None:
                ctx.hit("table without rule line -> delimiter synthesised")
                out.append(inline(rows[0], ctx))
                out.append(delim)
                body = rows[1:]
            else:
                ctx.hit("table -> md")
                out.append(inline(rows[0], ctx))
                out.append(delim)
                body = [r for k, r in enumerate(rows) if k not in (0, sep_idx)]
            for r in body:
                out.append(inline(r, ctx))
            out.append("")
            i = j
            continue

        # ---------------- table separator / rows
        if TBL_SEP.match(line):
            ctx.hit("table -> md")
            cells = [c.strip() for c in line.strip().strip("|").split("+")]
            aligns = []
            for c in cells:
                aligns.append("---")
            out.append("| " + " | ".join(aligns) + " |")
            i += 1
            continue

        # ---------------- checkboxes
        m = CHECKBOX.match(line)
        if m:
            box = "x" if m.group(2).lower() == "x" else " "
            ctx.hit("checkbox")
            lead = re.match(r"^(\s*)", m.group(1)).group(1)
            ind = map_ind(len(lead))
            rest = (m.group(3) or "").strip()
            out.append(" " * ind + m.group(1).lstrip() + f"[{box}]" + (" " + inline(rest, ctx) if rest else ""))
            i += 1
            continue

        # ---------------- ordered list item (normalise indentation)
        m = re.match(r"^(\s*)(\d+)([.)])\s+(\S.*)$", line)
        if m:
            ind = map_ind(len(m.group(1)))
            if ind != len(m.group(1)):
                ctx.hit("ordered list indent normalised")
            out.append(" " * ind + f"{m.group(2)}{m.group(3)} " + inline(m.group(4), ctx))
            i += 1
            continue

        # ---------------- unordered list marker (+ -> -)
        m = LIST_UNORDERED.match(line)
        if m:
            if line.lstrip().startswith("+"):
                ctx.hit("list marker + -> -")
            ind = map_ind(len(m.group(1)))
            if ind != len(m.group(1)):
                ctx.hit("list indent normalised")
            out.append(" " * ind + f"- {inline(m.group(2), ctx)}")
            i += 1
            continue

        # ---------------- footnote definition
        m = FN_DEF.match(line)
        if m:
            ctx.hit("footnote def")
            out.append(f"[^{m.group(1)}]: {inline(m.group(2), ctx)}")
            i += 1
            continue

        # ---------------- leftovers / junk
        if MORE_DIVIDER.match(line):
            ctx.hit("dropped '# more' divider (unused)")
            i += 1
            continue
        if re.match(r"^#\+RESULTS", stripped, re.I):
            ctx.hit("dropped #+RESULTS block")
            i += 1
            while i < len(lines) and (lines[i].startswith(":") or lines[i].strip() == ""):
                if lines[i].strip() == "" and (i + 1 >= len(lines) or not lines[i + 1].startswith(":")):
                    break
                i += 1
            continue
        if re.match(r"^:PROPERTIES:", stripped):
            j = i + 1
            cid = None
            while j < len(lines) and not re.match(r"^:END:", lines[j].strip()):
                mm = re.match(r"^:([A-Za-z_]+):\s*(.*)$", lines[j].strip())
                if mm and mm.group(1) == "CUSTOM_ID":
                    cid = mm.group(2).strip()
                j += 1
            i = j + 1
            if cid:
                k = len(out) - 1
                while k >= 0 and out[k].strip() == "":
                    k -= 1
                if k >= 0 and re.match(r"^#{1,6} ", out[k]):
                    out[k] = out[k].rstrip() + f" {{#{cid}}}"
                    ctx.hit("CUSTOM_ID -> heading attribute {#id}")
                else:
                    ctx.hit("CUSTOM_ID drawer NOT attached to heading (dropped!)")
                    ctx.warnf(f"CUSTOM_ID '{cid}' dropped - no preceding heading")
            else:
                ctx.hit("dropped property drawer (no CUSTOM_ID)")
            continue
        if re.match(r"^:END:", stripped):
            ctx.hit("stray :END: dropped")
            i += 1
            continue
        m = re.match(r"^#\+ATTR_HTML\b:?\s*(.*)$", stripped, re.I)
        if m:
            pending_attr = m.group(1).strip()
            ctx.hit("ATTR_HTML captured")
            i += 1
            continue
        m = re.match(r"^#\+CAPTION\b:?\s*(.*)$", stripped, re.I)
        if m:
            pending_caption = m.group(1).strip()
            ctx.hit("caption captured")
            i += 1
            continue
        if re.match(r"^#\+NAME\b", stripped, re.I):
            ctx.hit("dropped #+NAME")
            i += 1
            continue
        if re.match(r"^#\+[A-Za-z_]+(\[\])?:", stripped):
            ctx.hit("dropped stray #+KEY line in body")
            i += 1
            continue

        # ---------------- image line (bare org link to an image file)
        im = IMG_LINK.match(stripped)
        if im:
            src = im.group(1)
            if pending_caption:
                ctx.hit("image -> raw <figure> with caption")
                out.append("<figure>")
                out.append(f'<img src="{src}" alt="{src}">')
                out.append(f"<figcaption>\n{pending_caption}\n</figcaption>")
                out.append("</figure>")
                out.append("")
                pending_caption = None
            else:
                ctx.hit("image -> ![alt](src)")
                out.append(f"![{src}]({src})")
                out.append("")
            i += 1
            continue

        # ---------------- blank / normal text
        if stripped == "":
            out.append("")
            i += 1
            continue

        # ---------------- residue classification (report only; md renders these differently)
        if re.match(r"^#{1,6} \S", line):
            ctx.hit("residue: md-style heading outside block (becomes real heading)")
        if re.match(r"^> ", line):
            ctx.hit("residue: md-style blockquote outside block (becomes real quote)")
        if stripped.startswith("```"):
            # org rendered these as literal text; escape so md keeps the same look,
            # but still convert inline constructs (links/images) inside the line
            ctx.hit("escaped ``` residue (kept literal as today)")
            out.append(inline(line.replace("`", "\\`"), ctx))
            i += 1
            continue

        text = inline(line, ctx)
        # pandoc {.class} residue outside headings: strip braces, flag
        if PANDOC_ATTR2.search(text):
            ctx.hit("pandoc brace residue -> markdown attribute or stripped")
        out.append(text)
        i += 1

    if src_depth:
        ctx.warnf("file ended inside a src block")
    return "\n".join(out)


# ----------------------------------------------------------------------------- driver

def convert_text(text, ctx):
    kv, body = split_frontmatter(text)
    fm, notes = build_frontmatter(kv)
    for n in notes:
        ctx.warnf(n)
    md_body = convert_body(body, ctx)
    # collapse 3+ blank lines
    md_body = re.sub(r"\n{3,}", "\n\n", md_body).strip("\n")
    if not md_body:
        return fm + "\n"
    return fm + "\n\n" + md_body + "\n"


def split_frontmatter(text):
    lines = text.split("\n")
    kv = []
    i = 0
    while i < len(lines):
        m = re.match(r"^#\+([A-Za-z_]+)(\[\])?:\s?(.*)$", lines[i])
        if m and m.group(1).upper() not in ("ATTR_HTML", "CAPTION", "NAME"):
            kv.append((m.group(1).upper() + ("[]" if m.group(2) else ""), bool(m.group(2)), m.group(3).strip()))
            i += 1
            continue
        if lines[i].strip() == "":
            j = i
            while j < len(lines) and lines[j].strip() == "":
                j += 1
            if kv and j < len(lines) and lines[j].startswith("#+"):
                i = j
                continue
        break
    return kv, "\n".join(lines[i:])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", default="content")
    ap.add_argument("--apply", action="store_true", help="write .md files next to sources")
    ap.add_argument("--out", default=None, help="mirror output dir for dry run")
    ap.add_argument("--report", default="/tmp/org2md-report.txt")
    ap.add_argument("--json", default="/tmp/org2md-report.json")
    ap.add_argument("--diff-for", default=None, help="print unified diff for files matching this substring")
    args = ap.parse_args()

    files = []
    if os.path.isfile(args.path):
        files = [args.path]
    else:
        for dp, _, ns in os.walk(args.path):
            for n in ns:
                if n.endswith(".org"):
                    files.append(os.path.join(dp, n))
    files.sort()

    agg = collections.Counter()
    empty_front = []
    all_warns = collections.Counter()
    out_lines = []
    jdump = {}
    diffs = []

    crashes = 0
    for f in files:
        src = open(f, encoding="utf-8", errors="replace").read()
        ctx = Ctx()
        try:
            md = convert_text(src, ctx)
        except Exception as e:
            crashes += 1
            out_lines.append(f"!! CONVERT FAILED {f}: {e!r}")
            all_warns[f"CRASH {e!r}"] += 1
            continue
        agg.update(ctx.report)
        for w in ctx.warn:
            all_warns[w] += 1
        if not ctx.report and not ctx.warn:
            out_lines.append(f"== {f}: clean (no transformations)")
        else:
            detail = ", ".join(f"{k}:{v}" for k, v in sorted(ctx.report.items()))
            out_lines.append(f"== {f}\n   {detail}")
            if ctx.warn:
                out_lines.append("   WARN: " + " | ".join(ctx.warn))
        jdump[f] = {"hits": dict(ctx.report), "warnings": ctx.warn,
                    "md_len": len(md), "org_len": len(src)}
        if args.diff_for and args.diff_for in f:
            diffs.append("".join(difflib.unified_diff(
                src.splitlines(True), md.splitlines(True),
                fromfile=f, tofile=f.replace(".org", ".md"), n=1)))
        if args.apply:
            target = f[:-4] + ".md"
            open(target, "w", encoding="utf-8").write(md)
            os.remove(f)
        elif args.out:
            rel = os.path.relpath(f, args.path) if not os.path.isfile(args.path) else os.path.basename(f)
            target = os.path.join(args.out, rel[:-4] + ".md")
            os.makedirs(os.path.dirname(target), exist_ok=True)
            open(target, "w", encoding="utf-8").write(md)

    header = [f"files: {len(files)}", "", "== aggregate transformation counts =="]
    for k, v in agg.most_common():
        header.append(f"  {k:45} {v}")
    header.append("")
    header.append("== warnings / notes ==")
    for k, v in all_warns.most_common():
        header.append(f"  {v:5}  {k}")
    body = "\n".join(header + ["", "== per file =="] + out_lines)
    open(args.report, "w", encoding="utf-8").write(body)
    json.dump(jdump, open(args.json, "w"), ensure_ascii=False, indent=1)
    print(body[:6000])
    if crashes:
        print(f"\n!! {crashes} FILES FAILED - fix before applying", file=sys.stderr)
        sys.exit(2)
    print(f"\n... report: {args.report}  json: {args.json}")
    if diffs:
        print("\n\n" + "\n".join(diffs)[:20000])


if __name__ == "__main__":
    main()
