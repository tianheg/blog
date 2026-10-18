#!/usr/bin/env bash
# 确定性自查：连跑两次全量构建，产物必须逐字节相同。
#
# 为什么需要：站点应当是「输入没变 → 产物逐字节相同」。一旦有随机值或时间戳混进产物，
# 每次部署都会把上千个文件判定成「新资产」重传（CF 日志里的
# `Found N new or modified static assets`），浏览器/边缘缓存也跟着全失效。
# 已经踩过两处：资源版本号取 style.css 的 mtime、org 生成的随机内部 id。
#
# 用法：bash scripts/org2site/check-determinism.sh [工作目录]
#   退出码 0 = 通过（只允许 RSS 的 lastBuildDate 那一行不同）
#   非 0     = 有非预期差异，屏幕上是差异清单
#
# 唯一允许的差异：`index.xml` 的 `<lastBuildDate>`（构建时刻，本来就该变）。
# 会比 index.xml 的**逐行差异**，确保它确实只差那一行。
set -euo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
WORK=${1:-${ORG2SITE_CACHE:-${XDG_CACHE_HOME:-"$HOME/.cache"}/org2site}/_det}
A="$WORK/a"
B="$WORK/b"

echo "== 确定性自查（两遍全量构建）"
echo "   工作目录 $WORK"
rm -rf "$A" "$B"
bash "$REPO/scripts/org2site/build.sh" "$A" >/dev/null 2>&1 || { echo "❌ 第一遍构建失败"; exit 2; }
bash "$REPO/scripts/org2site/build.sh" "$B" >/dev/null 2>&1 || { echo "❌ 第二遍构建失败"; exit 2; }

echo "== 逐字节对比"
mapfile -t diffs < <(diff -rq "$A" "$B" || true)
if [ "${#diffs[@]}" -eq 0 ]; then
  echo "通过 ✓ 两遍构建产物完全一致"
  rm -rf "$A" "$B"
  exit 0
fi

bad=0
for line in "${diffs[@]}"; do
  case "$line" in
    *"/index.xml differ"*)
      # RSS：只允许 lastBuildDate 那一行不同
      if diff <(grep -v '<lastBuildDate>' "$A/index.xml") \
              <(grep -v '<lastBuildDate>' "$B/index.xml") >/dev/null; then
        echo "允许 ✓ index.xml（仅 <lastBuildDate> 不同）"
      else
        echo "❌ index.xml 的差异不止 lastBuildDate："
        diff "$A/index.xml" "$B/index.xml" | head -10
        bad=1
      fi
      ;;
    *)
      echo "❌ $line"
      bad=1
      ;;
  esac
done

if [ "$bad" -eq 0 ]; then
  echo "通过 ✓ 只有 RSS 时间戳不同，其余逐字节一致"
  rm -rf "$A" "$B"
  exit 0
fi

cat <<'TIP'

产物里混进了随机值或时间戳。常见来源：
  - 资源版本号取自文件 mtime（CI checkout 每次都给新 mtime）→ 用内容哈希
  - elisp 侧的时间（format-time-string）混进 HTML/JSON
  - 第三方工具自己生成的随机 id（如 org-export 的 outline-container-orgxxxxxxx）
保留 工作目录 里的两份产物可以直接 diff 定位。详见 skill `blog-org2site` 坑 33。
TIP
exit 1
