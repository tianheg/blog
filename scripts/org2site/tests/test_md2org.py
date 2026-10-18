"""md2org 单元测试。跑法：cd scripts/org2site && python3 -m pytest tests/ -v"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from md2org import (  # noqa: E402
    convert_body,
    convert_file,
    convert_inline,
    render_front_matter,
    split_front_matter,
)


# ------------------------------------------------------------ front matter


def test_split_front_matter_reads_keys():
    text = "---\ntitle: 'A B'\ndate: 2022-08-06\ntags: ['x', 'y']\n---\n\nbody\n"
    fm, body = split_front_matter(text)
    assert fm["title"] == "A B"
    assert fm["date"] == "2022-08-06"
    assert fm["tags"] == ["x", "y"]
    assert body.strip() == "body"


def test_split_front_matter_title_containing_dashes():
    text = "---\ntitle: 'x------y'\n---\n\nbody\n"
    fm, body = split_front_matter(text)
    assert fm["title"] == "x------y"


def test_render_front_matter_emits_org_keywords():
    out = render_front_matter({"title": "A", "date": "2022-08-06", "tags": ["x", "y"]})
    assert out[0] == "#+TITLE: A"
    assert out[1].startswith("#+DATE: <2022-08-06")
    assert out[2] == "#+TAGS[]: x,y"


# ------------------------------------------------------------------ 行内


def test_convert_inline_md_link():
    assert convert_inline("看[这篇](https://e.com/a)") == "看[[https://e.com/a][这篇]]"


def test_convert_inline_wikilink_with_label():
    assert convert_inline("[[slug|显示名]]") == "[[slug][显示名]]"


def test_convert_inline_wikilink_table_escape():
    assert convert_inline(r"[[odyssey-movie\|影评]]") == "[[odyssey-movie][影评]]"


def test_convert_inline_bold_and_italic():
    assert convert_inline("**粗** 与 *斜*") == "*粗* 与 /斜/"


def test_convert_inline_bold_placeholder_protects_italic():
    assert convert_inline("**A** and *B*") == "*A* and /B/"


def test_convert_inline_code_and_image():
    assert convert_inline("`x=1`") == "=x=1="
    assert convert_inline("![alt](/images/a.png)") == "[[file:/images/a.png][alt]]"


# ------------------------------------------------------------------ 块级


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
    assert "|---|---|" not in out
    assert "| a | b |" in out and "| 1 | 2 |" in out
    assert "|----+----|" in out


def test_hr_becomes_org_hr():
    assert "-----" in convert_body("a\n\n---\n\nb\n")


def test_bare_html_is_wrapped_in_export_snippet():
    out = convert_body("段落含 <sub>id</sub> 与 <kbd>Ctrl</kbd>。\n")
    assert "@@html:<sub>id</sub>@@" in out
    assert "@@html:<kbd>Ctrl</kbd>@@" in out


def test_heading_levels():
    assert convert_body("## 2022\n").startswith("** 2022")
    assert convert_body("### x\n").startswith("*** x")
    assert convert_body("# 一级\n").startswith("* 一级")


def test_heading_with_inline_syntax():
    assert convert_body("## 关于 **粗**\n").strip() == "** 关于 *粗*"


def test_footnote_reference_and_definition():
    assert convert_inline("文字[^1]。") == "文字[fn:1]。"
    out = convert_body("[^1]: 未选择的路：内容\n")
    assert out.startswith("[fn:1] 未选择的路：内容")


def test_heading_inside_code_block_is_not_a_heading():
    out = convert_body("```bash\n# not a heading\n```\n")
    assert "# not a heading" in out


def test_italic_does_not_eat_literal_star():
    # md 里 *.md 这种字面星号不能被当成斜体（旧站也没转）
    assert convert_inline("有*.md,*.org两种文件格式") == "有*.md,*.org两种文件格式"


def test_italic_with_ascii_boundary_still_works():
    assert convert_inline("a *b* c") == "a /b/ c"


def test_nested_placeholder_restore():
    # 粗体里嵌链接：两个占位符嵌套，单趟替换会漏掉内层
    out = convert_inline("**A [B](https://e.com) C**")
    assert "\x00" not in out
    assert out == "*A [[https://e.com][B]] C*"


def test_unclosed_code_block_is_closed():
    out = convert_body("```python\nx = 1\n")
    assert out.rstrip().endswith("#+END_SRC")


# ---------------------------------------------------------------- 端到端


def test_convert_file_end_to_end(tmp_path):
    src = tmp_path / "a.md"
    src.write_text(
        "---\ntitle: 'T'\ndate: 2022-08-06\ntags: ['x']\n---\n\n正文 **粗**。\n",
        encoding="utf-8",
    )
    dst = tmp_path / "a.org"
    convert_file(src, dst)
    got = dst.read_text(encoding="utf-8")
    assert "#+TITLE: T" in got
    assert "#+TAGS[]: x" in got
    assert "*粗*" in got
    assert got.splitlines()[0] == "#+TITLE: T"


def test_front_matter_single_quote_escape():
    """YAML 单引号里 '' 表示一个撇号（真实案例：title: 'What I''m doing now'）。"""
    fm, _ = split_front_matter("---\ntitle: 'What I''m doing now'\n---\nbody\n")
    assert fm["title"] == "What I'm doing now"


def test_front_matter_double_quote_escape():
    fm, _ = split_front_matter('---\ntitle: "a \\"quoted\\" word"\n---\nbody\n')
    assert fm["title"] == 'a "quoted" word'


def test_front_matter_list_items_unquoted():
    fm, _ = split_front_matter("---\ntags: ['a''b', \"c\"]\n---\nbody\n")
    assert fm["tags"] == ["a'b", "c"]


def test_block_level_html_line_becomes_export_block():
    """独占一行的块级 HTML 必须走 export block：否则会被包进 <p> 或被转义。"""
    out = convert_body('<link rel="stylesheet" href="x.css" />\n<div id="mapid"></div>\n')
    assert "#+BEGIN_EXPORT html" in out
    assert "<link rel=\"stylesheet\" href=\"x.css\" />" in out
    assert not out.startswith('<p>')
