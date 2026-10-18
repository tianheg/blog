#!/usr/bin/env bash
# build.sh — org2site 全量构建（单一入口，本地与 CI 同一套）
#
#   bash scripts/org2site/build.sh [输出目录]     默认 public/
#
# 三步：
#   1) emacs -Q --batch 导出全部 org → HTML（含静态资源整树拷贝、RSS/sitemap/404）
#   2) PageFind 独立二进制生成搜索索引（关键词 tab 用；中文分词必须 extended 版）
#   3) 跑体检 scripts/org2site/verify.py
#
# 依赖自带安装（都不需要 root、不依赖 node）：
#   - emacs 30.1：CI 的 Ubuntu 24.04 镜像里没有 emacs，系统自带的是 29.3（org 9.6），
#     而 org 9.6 与 9.7 的 EXAMPLE 块 HTML 与空白**输出不同** → 版本必须钉住。
#     这里用 micromamba（单文件静态二进制）装 conda-forge 的 emacs=30.1
#     —— 实测与本机 emacs 30.1 产出**逐字节一致**（1589 个文件 0 差异）。
#   - pagefind_extended：Rust 单二进制，pin 版本 + sha256 校验后缓存。
#
# 版本只此一处 pin（沿用 scripts/build.sh 的做法：下载 + 校验，防篡改 release 被静默执行）。
set -euo pipefail

PAGEFIND_VERSION=1.5.2
PAGEFIND_TARBALL="pagefind_extended-v${PAGEFIND_VERSION}-x86_64-unknown-linux-musl.tar.gz"
PAGEFIND_SHA256="aeb135927856e7a49816cf2c9c2e53167f87afa1f61f7288b7d66c234a950d38"
EMACS_VERSION=30.1
MICROMAMBA_URL="https://micro.mamba.pm/api/micromamba/linux-64/latest"

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
OUT=${1:-"$REPO/public"}
CACHE=${ORG2SITE_CACHE:-${XDG_CACHE_HOME:-"$HOME/.cache"}/org2site}
PF_BIN="$CACHE/pagefind_extended"
MAMBA_BIN="$CACHE/micromamba"
EMACS_ENV="$CACHE/emacs-${EMACS_VERSION}"

usage() { sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

emacs_version_of() { "$1" --version 2>/dev/null | head -1 | awk '{print $NF}'; }

# 版本必须正好是 EMACS_VERSION：系统里有就用，否则用 micromamba 装一份（CI 走这条）
ensure_emacs() {
  if command -v emacs >/dev/null 2>&1 && [ "$(emacs_version_of "$(command -v emacs)")" = "$EMACS_VERSION" ]; then
    EMACS=$(command -v emacs)
    echo "emacs: $(command -v emacs)（系统，$EMACS_VERSION）"
    return
  fi
  if [ ! -x "$EMACS_ENV/bin/emacs" ] || [ "$(emacs_version_of "$EMACS_ENV/bin/emacs")" != "$EMACS_VERSION" ]; then
    echo "装 emacs $EMACS_VERSION（micromamba + conda-forge，免 root）..."
    mkdir -p "$CACHE"
    if [ ! -x "$MAMBA_BIN" ]; then
      curl --fail -sL "$MICROMAMBA_URL" | tar -xj -C "$CACHE" bin/micromamba
      mv -f "$CACHE/bin/micromamba" "$MAMBA_BIN"
      rmdir "$CACHE/bin" 2>/dev/null || true
    fi
    "$MAMBA_BIN" create -y -q -p "$EMACS_ENV" -c conda-forge "emacs=$EMACS_VERSION" >/dev/null
  fi
  EMACS="$EMACS_ENV/bin/emacs"
  echo "emacs: $EMACS（自装 $EMACS_VERSION）"
}

ensure_pagefind() {
  if [ -x "$PF_BIN" ] && "$PF_BIN" --version 2>/dev/null | grep -q "$PAGEFIND_VERSION"; then
    return
  fi
  echo "装 PageFind v${PAGEFIND_VERSION}（extended，含中文分词）..."
  mkdir -p "$CACHE"
  (
    cd "$CACHE"
    curl --fail -sLJO "https://github.com/Pagefind/pagefind/releases/download/v${PAGEFIND_VERSION}/${PAGEFIND_TARBALL}"
    echo "${PAGEFIND_SHA256}  ${PAGEFIND_TARBALL}" | sha256sum -c -
    tar -xzf "$PAGEFIND_TARBALL"
    chmod +x pagefind_extended
    rm -f "$PAGEFIND_TARBALL"
  )
}

case "${1:-}" in
  -h|--help|help) usage; exit 0 ;;
esac

cd "$REPO"
# 输出目录先清空（对应 Hugo 的 --cleanDestinationDir）：不然删掉/改名的页会留在输出里，
# PageFind 还会把它们编进索引。防呆：拒绝清掉 / 、家目录、仓库根这三个危险路径。
case "$OUT" in
  /|"$HOME"|"$REPO") echo "拒绝清空危险路径：$OUT" >&2; exit 2 ;;
esac
if [ -d "$OUT" ]; then
  echo "清空输出目录 $OUT"
  rm -rf "${OUT:?}"
fi
mkdir -p "$OUT"

echo "== 1/3 org2site 导出 → $OUT"
ensure_emacs
# content/ 是内容真源，org/ 是从它转换来的构建输入（且 CLOCK/agenda 这类数据只活在 org/ 里）。
# 常见坑：改了 content/ 忘了跑 migrate.py → 上线旧内容。比「最新 content mtime vs 最新 org mtime」。
newest_content=$(find content -name '*.md' -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
newest_org=$(find org -name '*.org' -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
if [ -n "$newest_content" ] && [ -n "$newest_org" ] \
   && awk "BEGIN{exit !($newest_content > $newest_org)}"; then
  echo "⚠️  content/ 里有比 org/ 新的文件 —— 改过内容就先跑："
  echo "     python3 scripts/org2site/migrate.py content org"
fi
"$EMACS" -Q --batch -l scripts/org2site/build.el org "$OUT" </dev/null

echo "== 2/3 PageFind 搜索索引"
ensure_pagefind
"$PF_BIN" --site "$OUT"

echo "== 3/3 输出体检"
python3 scripts/org2site/verify.py "$OUT"

echo "完成：$OUT"
