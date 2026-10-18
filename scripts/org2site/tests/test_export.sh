#!/usr/bin/env bash
# 导出层冒烟测试：四条硬伤 + 零 class。跑法：bash scripts/org2site/tests/test_export.sh
set -euo pipefail
cd "$(dirname "$0")/.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cat > "$tmp/t.org" <<'ORG'
#+TITLE: T

粗体后接全角逗号：*中文粗体*，后面还有文字。

斜体后接全角句号：/中文斜体/。结束。

汉字紧邻：这是*粗体*字。

裸 HTML：<sub>id</sub> 与 <kbd>Ctrl</kbd>。

[[slug][一篇旧文]]

#+BEGIN_SRC python
def hello(name):
    return name
#+END_SRC
ORG

emacs -Q --batch -l export.el "$tmp/t.org" "$tmp/out.html" 2>"$tmp/err.log"

html=$(cat "$tmp/out.html")
status=0
check() { if grep -qF "$2" <<<"$html"; then echo "ok   $1"; else echo "FAIL $1"; status=1; fi; }
checknot() { if grep -qF "$2" <<<"$html"; then echo "FAIL $1"; status=1; else echo "ok   $1"; fi; }

check   "CJK 粗体"          '<strong>中文粗体</strong>'
check   "CJK 斜体"          '<em>中文斜体</em>'
check   "汉字紧邻"          '这是<strong>粗体</strong>字'
check   "裸 HTML 未被转义"  '<sub>id</sub>'
check   "wikilink 解析"     'href="/posts/slug/"'
checknot "代码块无高亮 token" 'data-hl='
check   "代码块语言属性"    '<pre data-lang="python">'
checknot "ZWSP 已过滤"      $'\u200b'
checknot "输出无 class"     'class='
checknot "无 TOC"           'table-of-contents'

exit $status
