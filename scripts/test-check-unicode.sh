#!/usr/bin/env bash
# test-check-unicode.sh — check-unicode.mjs 的自测
#
# 一个检查脚本最怕两件事：抓不到真问题（漏报）、和把正常内容当问题（误报）。
# 这里用两组 fixture 断言这两件事，顺手断言退出码——因为它是发布闸门。
#
#   bash scripts/test-check-unicode.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
BAD="$TMP/bad"
OK="$TMP/ok"
mkdir -p "$BAD" "$OK"

python3 - "$BAD" "$OK" <<'PY'
import sys, os
bad, ok = sys.argv[1], sys.argv[2]

# 坏的：复刻 2026-09 线上真实故障（content/online-reading/2025.md:9）的字面形态
open(os.path.join(bad, "broken.md"), "w", encoding="utf-8").write(
    "---\ntitle: bad\n---\n\n"
    "- [The Alchemy of Generative Questions\uff3d(https://nesslabs.com/x) :star: 说明 \uff3bAsking Better Questions](https://tandf.example/y)\n"
    "- [另一条\uff3d(https://example.com/a)\n"
    "- ![\u56fe\uff3d(/images/x.png)\n"
    "\u8fd9\u4e00\u884c\u6709\u96f6\u5bbd\u200c\u5b57\u7b26\u3002\n"
    "emoji \U0001F468\u200d\U0001F33E \u4e0d\u8be5\u62a5\u3002\n"
)

# 好的：中文标点、～ ｜ ・、①、上下标、NBSP、围栏代码块里的全角括号、行内代码、行内开关
open(os.path.join(ok, "good.md"), "w", encoding="utf-8").write(
    "---\ntitle: good\n---\n\n"
    "\u4e2d\u6587\uff0c\u6807\u70b9\u3002\u5e94\u5f53\uff1a\u5168\u89d2\u3010\u6b63\u5e38\u3011\u300c\u5f15\u53f7\u300d\u301c\u8303\u56f4\u301c \u2460\u5e8f\u53f7 \uff5c \u5206\u9694 \u00b7 \u95f4\u9694 E=mc\u00b2 \u00d710\u00b9\u00b2 \u03bc\u00b1\u00b0\u00e9\n"
    "\u6b63\u5e38\u94fe\u63a5\uff08[\u53c2\u8003](https://example.com/x)\uff09\u4e0d\u8be5\u62a5\n"
    "emoji \U0001F468\u200d\U0001F33E \U0001F468\u200d\U0001F393 \u4e0d\u8be5\u62a5\n"
    "\uff3b\u8fd9\u884c\u6709\u5168\u89d2\u62ec\u53f7\u4f46\u6807\u4e86\u5f00\u5173\uff3d(https://example.com/z) <!-- unicode-ok -->\n"
    "\n```text\n\uff3b\u56f4\u680f\u91cc\u7684\u4e0d\u7b97\uff3d(https://example.com/w)\n```\n\n"
    "\u884c\u5185\u4ee3\u7801 `\uff05 \uff11 \uff31` \u4e0d\u7b97\n"
)
PY

fail=0
pass() { echo "  ✓ $1"; }
nope() { echo "  ✗ $1"; fail=1; }

echo "── check-unicode 自测 ──"

# 1. 坏样本：必须报错 + 退出码 1
out="$(node "$ROOT/scripts/check-unicode.mjs" --content "$BAD" 2>&1)"; code=$?
[ "$code" -eq 1 ] && pass "坏样本退出码 1" || nope "坏样本退出码 $code（应为 1）"
for pat in 'E1.*broken.md' 'E2.*broken.md' 'E3.*broken.md' 'E4.*broken.md'; do
  grep -qE "\[${pat%%\.*}\].*${pat##*\.}" <<<"$out" && pass "抓到 ${pat%%\.*}" || nope "漏报 ${pat%%\.*}"
done
grep -q 'ZWNJ\|U+200C' <<<"$out" && pass "零宽字符被点出码位" || nope "零宽字符没点出码位"
grep -q 'broken.md:6.*ZWJ' <<<"$out" && nope "emoji 里的 ZWJ 被误报" || pass "emoji 里的 ZWJ 没误报"

# 2. 好样本：必须干净 + 退出码 0，且 --strict 下也干净
out="$(node "$ROOT/scripts/check-unicode.mjs" --content "$OK" --strict 2>&1)"; code=$?
[ "$code" -eq 0 ] && pass "好样本 --strict 退出码 0" || { nope "好样本 --strict 退出码 $code"; echo "$out" | sed 's/^/      /'; }
grep -q '个 ERROR' <<<"$out" && { nope "好样本出现 ERROR"; echo "$out" | head -6 | sed 's/^/      /'; } || pass "好样本 0 ERROR"
grep -q '^✓' <<<"$out" && pass "好样本输出通过标记" || nope "好样本没输出通过标记"

# 3. 真实 content/：必须 0 ERROR（WARN 不阻断）
out="$(node "$ROOT/scripts/check-unicode.mjs" 2>&1)"; code=$?
[ "$code" -eq 0 ] && pass "真实 content/ 退出码 0（无 ERROR）" || { nope "真实 content/ 退出码 $code"; echo "$out" | grep -A1 'ERROR' | head -8 | sed 's/^/      /'; }

echo
if [ "$fail" -eq 0 ]; then
  echo "全部通过。"
else
  echo "有断言失败。"
fi
exit "$fail"
