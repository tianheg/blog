#!/usr/bin/env python3
"""
博客导出 EPUB（C 方案）：Hugo 渲染 XHTML -> 合并单文档 -> pandoc 打包。

为什么是这个路线（详见 content/til/software/hugo-epub.md）：
  * 复用站点自己的 layouts（wikilink / 短代码 / 脚注规则），渲染结果与网页一致；
    自己复刻一套规则会漏 aliases 与短标题形式（实测 612 vs 642 条内链）。
  * EPUB 的规范结构（nav / OPF / spine / 脚注语义）交给 pandoc，不自己写模板。
  * 不改 content/：源里的历史损坏一律在本脚本里修，修完报告，由作者决定是否改源。

用法:
  build_epub.py -o ~/book.epub --title "天河的博客：文章选辑"
  build_epub.py -o /tmp/full.epub --title "全站" --style site --limit 50
  build_epub.py -o /tmp/x.epub --title "试" --keep-build      # 保留中间产物便于排查

依赖: hugo（PATH）、pandoc >= 3（PATH，或 PANDOC 环境变量/--pandoc 指定）、python3 + Pillow（仅生成封面）
"""
import argparse
import datetime
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent          # scripts/epub
REPO = HERE.parents[1]                                  # 博客仓库根
SITE = "https://tianheg.co"

# 要收进书里的目录范围：这里列的是**排除**项。只收 posts 就排掉其余全部。
EXCLUDE_LIST = [
    "**/til/**", "**/graph/**", "**/previews/**", "**/online-reading/**",
    "**/footprints/**", "**/watch/**", "**/listen/**", "**/read/**",
    "**/support/**", "**/dushuji/**",
    "**/_index.md", "**/about.md", "**/now.md", "**/links.md", "**/uses.md",
    "**/projects.md", "**/service.md", "**/feeds.md", "**/start.md",
    "**/search.md", "**/important-now.md",
]

# 站点侧依赖：这三个 partial 决定 wikilink/短代码/脚注怎么渲染，缺一不可
PARTIALS = [
    "_partials/content/render-content.html",
    "_partials/functions/wikilink-map.html",
    "_partials/functions/linkable-pages.html",
]

# 渲染时复用站点配置（改这些等于改书里的样子/标点/高亮）
MARKUP_CONFIG = """
markup:
  highlight:
    style: dracula
    noClasses: false
  goldmark:
    renderer:
      unsafe: true
      xHTML: true
    parser:
      attribute:
        block: true
        title: true
    extensions:
      footnote:
        backlinkHTML: ''
      typographer:
        disable: false
        apostrophe: "'"
        leftDoubleQuote: '"'
        rightDoubleQuote: '"'
        leftSingleQuote: "'"
        rightSingleQuote: "'"
"""


def find_pandoc(explicit):
    if explicit:
        return pathlib.Path(explicit)
    env = __import__("os").environ.get("PANDOC")
    if env:
        return pathlib.Path(env)
    found = shutil.which("pandoc")
    if found:
        return pathlib.Path(found)
    # 兜底：Hermes 缓存里解压出来的二进制（临时用，注意 scratch 会被清）
    for p in pathlib.Path.home().glob(".hermes/cache/scratch/pandoc-*/bin/pandoc"):
        return p
    sys.exit("找不到 pandoc：装到 PATH，或用 PANDOC=... / --pandoc 指定")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", required=True, help="输出的 .epub 路径")
    ap.add_argument("--title", required=True, help="书名")
    ap.add_argument("--author", default="tianhe")
    ap.add_argument("--style", choices=["book", "site"], default="book",
                    help="book=纸质书排版（默认）；site=站点 token 版")
    ap.add_argument("--css", help="自定义样式表路径（覆盖 --style）")
    ap.add_argument("--cover", help="封面 png 路径；默认用同目录 cover.png（存在则用）")
    ap.add_argument("--limit", type=int, default=0, help="只取前 N 篇（试跑用）")
    ap.add_argument("--keep-build", action="store_true", help="保留中间构建目录")
    a = ap.parse_args()

    pandoc = find_pandoc(None)
    css = pathlib.Path(a.css) if a.css else HERE / ("epub-book.css" if a.style == "book" else "epub-tianheg.css")
    if not css.exists():
        sys.exit(f"样式表不存在: {css}")
    cover = pathlib.Path(a.cover) if a.cover else HERE / "cover.png"
    proj = pathlib.Path(tempfile.gettempdir()) / "epub-hugo-build"

    # ---------- S1 渲染：搭一个只读挂载站点 content 的 Hugo 项目 ----------
    shutil.rmtree(proj, ignore_errors=True)
    (proj / "layouts/_partials/content").mkdir(parents=True)
    (proj / "layouts/_partials/functions").mkdir(parents=True)
    for rel in PARTIALS:
        src = REPO / "layouts" / rel
        if not src.exists():
            sys.exit(f"站点 partial 缺失（站点 layouts 结构变了？）: {src}")
        shutil.copy(src, proj / "layouts" / rel)

    (proj / "hugo.yaml").write_text(f"""baseURL: "{SITE}/"
title: "{a.title}"
defaultContentLanguage: "zh"
hasCJKLanguage: true
timeZone: Asia/Shanghai
uglyurls: true
disablePathToLower: true
disableKinds: ["RSS", "robotsTXT", "404", "taxonomy", "section", "term", "sitemap", "home"]

module:
  mounts:
    - source: {REPO}/content
      target: content
      excludeFiles:
{chr(10).join('        - "' + p + '"' for p in EXCLUDE_LIST)}

mediaTypes:
  "application/xhtml+xml":
    suffixes: ["xhtml"]

outputFormats:
  XHTML:
    mediaType: "application/xhtml+xml"
    isHTML: true
    baseName: "index"

outputs:
  page: ["XHTML"]
{MARKUP_CONFIG}""", encoding="utf-8")

    (proj / "layouts/single.xhtml").write_text(
        '{{- printf "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\" ?>" | safeHTML }}\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">\n'
        "<head><title>{{ .Title }}</title></head>\n<body>\n"
        "<h1>{{ .Title }}</h1>\n"
        "{{ with .Date }}<p><span class=\"meta\">{{ .Format \"2006-01-02\" }} · {{ $.Section }}"
        "{{ with $.Params.categories }} · {{ delimit . \" / \" }}{{ end }}</span></p>{{ end }}\n"
        "{{ partial \"content/render-content\" .Content }}\n"
        "</body>\n</html>\n", encoding="utf-8")

    r = subprocess.run(["hugo", "--cleanDestinationDir", "--logLevel", "warn"], cwd=proj,
                       capture_output=True, text=True)
    warns = [l for l in r.stderr.splitlines() if "unresolved" in l]
    print("S1 hugo exit:", r.returncode, "| wikilink 未解析警告:", len(warns))
    for l in warns[:5]:
        print("    ", l[:150])
    if r.returncode != 0:
        print(r.stderr[-2000:])
        sys.exit("渲染失败")

    # ---------- S2 收集 + 按写作时间编年排序（日期从渲染结果里抓，Hugo 已格式化好） ----------
    pub = proj / "public"
    pages = [p for p in (pub / "posts").rglob("*.xhtml") if p.name != "index.xhtml"]

    def date_of(p):
        m = re.search(r'<span class="meta">(\d{4}-\d{2}-\d{2})', p.read_text(encoding="utf-8"))
        return m.group(1) if m else "0000-00-00"

    pages.sort(key=lambda p: (date_of(p), p.name))
    if a.limit:
        pages = pages[:a.limit]
    if not pages:
        sys.exit("没有可打包的页面：检查 EXCLUDE_LIST 与 content/posts/")
    print("S2 章节数:", len(pages), "| 时间跨度:", date_of(pages[0]), "->", date_of(pages[-1]))

    def anchor_of(rel):
        return re.sub(r"[^a-zA-Z0-9]+", "-", rel[:-6]).strip("-").lower()

    flat = {"/" + str(p.relative_to(pub)): anchor_of(str(p.relative_to(pub))) for p in pages}

    # ---------- S3 合并成单个 HTML 文档（pandoc 只在单文档模式下把 #anchor 映射成分章内链） ----------
    parts, stats = [], {"internal": 0, "external": 0, "img": 0, "dushuji": 0}
    for p in pages:
        rel = str(p.relative_to(pub))
        m = re.search(r"<body>(.*)</body>", p.read_text(encoding="utf-8"), re.S)
        if not m:
            sys.exit(f"渲染输出里找不到 <body>（模板变了？）: {p}")
        body = m.group(1)

        def fix_href(m):
            url = m.group(1)
            base, _, frag = url.partition("#")
            if base in flat:                       # 书内目标 -> 同文档 #锚点（内容 id 用双连字符，见下）
                stats["internal"] += 1
                return f'href="#{flat[base]}' + (f"--{frag}" if frag else "") + '"'
            if base.startswith("/") and not base.startswith("//"):   # 站内其他页 -> 绝对 URL
                stats["external"] += 1
                return f'href="{SITE}{base}' + (f"#{frag}" if frag else "") + '"'
            if not base and frag:                  # 页内锚点 -> 加页面前缀防跨篇撞名
                return f'href="#{flat["/" + rel]}--{frag}"'
            return m.group(0)

        body = re.sub(r'href="([^"]+)"', fix_href, body)

        # 读书记计数行：源里 HTML 被转义，且 typographer 已把 -- 变成 &ndash;、引号变成 &quot;
        new_body, n = re.subn(
            r'&lt;span style="color:var\((?:&ndash;|--)[^)]*dushuji-count-color\)&quot;&gt;([^<]*)(?:</span>)?',
            r'<span class="dushuji-count">\1</span>', body)
        stats["dushuji"] += n
        body = new_body

        # 书里不带图（图片在容器外或已失联），figure 标签一并去掉
        body = re.sub(r"<img\b[^>]*/?>", lambda m: (stats.__setitem__("img", stats["img"] + 1), "")[1], body)
        body = re.sub(r"</?(figure|figcaption)\b[^>]*>", "", body)
        body = body.replace(' target="_blank"', '').replace(' rel="noopener noreferrer"', '')

        # 内容元素的所有 id 加页面前缀（跨篇重名会让 pandoc 重命名，页内引用随之失配）。
        # 用**双**连字符：单连字符会和 h1 的 anchor 撞——文章里手写 {#flexbox} 时，
        # posts-css-flexbox 既是该篇 h1 的 id 又是那个标题的 id（实测唯一一处冲突）。
        body = re.sub(r'id="([^"]+)"', lambda m: f'id="{flat["/" + rel]}--{m.group(1)}"', body)
        rigid = flat["/" + rel]
        body = re.sub(r"<h1(\s[^>]*)?>", f'<h1 id="{rigid}"\\1>', body, count=1)
        parts.append(f'\n<section id="{rigid}-sec">\n' + body + "\n</section>\n")

    # ---------- 书末版权页 ----------
    today = datetime.date.today().isoformat()
    first_d, last_d = date_of(pages[0]), date_of(pages[-1])
    colophon = f"""
<section id="colophon-sec">
<h1 id="colophon">关于本书</h1>
<div class="colophon">
<p>本文集收录 <a href="{SITE}/posts/">{SITE.replace('https://', '')}/posts</a> 上的 {len(pages)} 篇文章，<br/>
写作时间从 {first_d} 到 {last_d}。</p>
<div class="rule"></div>
<p>© 2018–{today[:4]} tianhe</p>
<p>文中链接指向原文，可在联网设备上直接打开。</p>
<p>电子版生成于 {today}</p>
</div>
</section>
"""

    html = ('<!DOCTYPE html>\n<html lang="zh"><head><meta charset="utf-8" />'
            f"<title>{a.title}</title></head><body>" + "".join(parts) + colophon + "</body></html>")

    def clean_bad_links(h):
        def repl(m):
            href, inner = m.group(1), m.group(2)
            if href.startswith(("#", "mailto:", "tel:")):
                return m.group(0)
            if href.startswith(("http://", "https://")):
                return inner if re.match(r"^https?://[#?]?$", href) else m.group(0)
            return inner          # 空 host / 裸域名 / org 时代残留 -> 降级纯文本
        return re.sub(r'<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>', repl, h, flags=re.S)

    html = clean_bad_links(html)
    combined = proj / "combined.html"
    combined.write_text(html, encoding="utf-8")
    print(f"S3 合并文档 {len(html) // 1024} KB | 内链 {stats['internal']} 站外 {stats['external']} "
          f"去图 {stats['img']} 计数行还原 {stats['dushuji']}")

    # ---------- S4 pandoc 打包 ----------
    cmd = [str(pandoc), str(combined), "-f", "html", "-t", "epub3", "--toc", "--toc-depth=1",
           "--split-level=1", "--css", str(css),
           "--metadata", f"title={a.title}", "--metadata", f"author={a.author}",
           "--metadata", "lang=zh", "--metadata", f"date={today}",
           "--metadata", f"rights=© 2018–{today[:4]} tianhe"]
    if cover.exists():
        cmd += ["--epub-cover-image", str(cover)]
    cmd += ["-o", a.out]
    rr = subprocess.run(cmd, capture_output=True, text=True)
    if rr.returncode != 0:
        print(rr.stderr[-2500:])
        sys.exit("pandoc 打包失败")
    errs = [l for l in rr.stderr.splitlines()
            if "WARNING" in l and "translation" not in l and "Abstract" not in l]
    print("S4 pandoc 警告:", len(errs))
    for l in errs[:5]:
        print("    ", l[:140])
    print("S4 输出:", a.out, pathlib.Path(a.out).stat().st_size // 1024, "KB")

    if not a.keep_build:
        shutil.rmtree(proj, ignore_errors=True)
    else:
        print("   中间产物保留在:", proj)

    # ---------- S5 校验（0 error 才算完） ----------
    sys.exit(subprocess.run([sys.executable, str(HERE / "validate_epub.py"), a.out]).returncode)


if __name__ == "__main__":
    main()
