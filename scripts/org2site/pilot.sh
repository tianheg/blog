#!/usr/bin/env bash
# 试点端到端：org 导出 + 与旧产物文本比对。
# 跑法：bash scripts/org2site/pilot.sh
# 注意：旧产物是整页 HTML，脚本会切出 <main> 再比；剩余差异需人工分类
#       （页面外壳差异属预期，正文文字丢失才是 bug）。
set -uo pipefail
cd "$(dirname "$0")/../.."

OUT=/tmp/org2site-pilot
rm -rf "$OUT"; mkdir -p "$OUT"

pass=0; diffn=0; skip=0
while read -r f; do
  f="${f#./}"
  rel="${f%.md}"
  orgf="org/${rel}.org"
  old="public/${rel}/index.html"

  [ -f "$orgf" ] || { echo "SKIP 无 org:    $orgf"; skip=$((skip+1)); continue; }
  [ -f "$old" ]  || { echo "SKIP 无旧产物:  $old";  skip=$((skip+1)); continue; }

  new="$OUT/$(echo "$rel" | tr '/' '_').html"
  if ! emacs -Q --batch -l scripts/org2site/export.el "$orgf" "$new" </dev/null 2>"$OUT/err.log"; then
    echo "FAIL 导出失败: $orgf"; sed -n '1,3p' "$OUT/err.log"; diffn=$((diffn+1)); continue
  fi
  if /usr/bin/python3 scripts/org2site/verify_text.py "$old" "$new" >"$OUT/diff.txt" 2>&1; then
    echo "OK   $rel"; pass=$((pass+1))
  else
    echo "DIFF $rel"
    head -4 "$OUT/diff.txt" | sed 's/^/       /'
    diffn=$((diffn+1))
  fi
done < scripts/org2site/pilot-list.txt

echo "---- OK $pass / 需人工过目 $diffn / SKIP $skip ----"
[ "$diffn" -eq 0 ]
