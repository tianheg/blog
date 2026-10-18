"""verify_text 单元测试。"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from verify_text import compare, extract_main, extract_old_body, extract_text  # noqa: E402


def test_extract_text_strips_tags_and_entities():
    assert extract_text("<p>a&nbsp;b</p><script>var x=1</script>") == "a b"


def test_compare_ignores_whitespace_only_differences():
    assert compare("<p>a  b</p>", "<p>a\nb</p>") == []


def test_compare_reports_real_text_loss():
    diffs = compare("<p>甲乙丙</p>", "<p>甲乙</p>")
    assert diffs and "丙" in str(diffs)


def test_compare_allows_known_punctuation_mapping():
    assert compare("<p>a——b</p>", "<p>a------b</p>") == []


def test_extract_main_takes_only_main_section():
    page = "<nav>N</nav><main id='m'><p>正文</p></main><footer>F</footer>"
    assert extract_main(page).strip() == "<p>正文</p>"


def test_extract_old_body_prefers_prose_container():
    page = (
        "<main><h1>T</h1><div class=\"prose max-w-none\"><p>正文</p></div>"
        "<section>相关</section></main>"
    )
    assert "正文" in extract_old_body(page) and "相关" not in extract_old_body(page)


def test_compare_uses_main_section_of_old_page():
    old = "<nav>导航</nav><main><p>正文</p></main><footer>页脚</footer>"
    assert compare(old, "<article><p>正文</p></article>") == []
