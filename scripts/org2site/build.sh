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
EMACS_VERSION=31.1
# emacs 从 GNU 官方**源码**构建（官方只发源码，没有 Linux 二进制），构建产出的 tarball
# 由本仓库发布到 R2（公开 URL，构建时匿名下载，CI 里不需要任何凭据）。
# 重新构建/上传的方法见 scripts/org2site/README-build-deps.md。
EMACS_TARBALL="emacs-${EMACS_VERSION}-linux-x86_64.tar.gz"
EMACS_URL=${ORG2SITE_EMACS_URL:-"https://pub-d12ed328a9ee45b9ad7336cb78330e98.r2.dev/emacs/${EMACS_TARBALL}"}
EMACS_SHA256="4150945a24fab5ee7249bf376a6a4dd85f676f2217946bccfc293ed2afb6ea20"
# org-mode 独立于 emacs 发布：31.1 自带 9.8.7，ELPA 上最新是 9.8.10。
# 用 ELPA 的 tarball（平铺 .el）覆盖自带的 —— 保证「最新 emacs + 最新 org」，
# 且 CI 与本地用同一份 org，不受 emacs 打包版本影响。ELPA 不发布 sha256 侧车文件，
# 所以哈希是本仓库实测后钉住的（TOFU：能防静默变更，不防首次投毒）。
ORG_VERSION=9.8.10
ORG_TARBALL="org-${ORG_VERSION}.tar"
ORG_URL="https://elpa.gnu.org/packages/${ORG_TARBALL}"
ORG_SHA256="890a9dd5c4f1d279f6ed0b3d10670d796aaccb7fdc71a2a665cd153bec463f1d"

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
OUT=${1:-"$REPO/public"}
CACHE=${ORG2SITE_CACHE:-${XDG_CACHE_HOME:-"$HOME/.cache"}/org2site}
PF_BIN="$CACHE/pagefind_extended"
EMACS_ENV="$CACHE/emacs-${EMACS_VERSION}"
ORG_DIR="$CACHE/org-${ORG_VERSION}"

usage() { sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

emacs_version_of() { "$1" --version 2>/dev/null | head -1 | awk '{print $NF}'; }

# 一律用我们自己发布的那份 emacs（不再看系统里有没有）：
# 只有这样才能保证本地、CI、以及以后任何机器用的是**同一个二进制**，
# 不会出现「Debian 的 31.1 和别的 31.1 是两个不同构建」这类只在产物上才看得出来的差异。
ensure_emacs() {
  if [ -x "$EMACS_ENV/bin/emacs" ] && [ "$(emacs_version_of "$EMACS_ENV/bin/emacs")" = "$EMACS_VERSION" ]; then
    EMACS="$EMACS_ENV/bin/emacs"
    return
  fi
  echo "装 emacs $EMACS_VERSION（从 R2 下载，源为 GNU 官方源码构建）..."
  mkdir -p "$CACHE"
  rm -rf "$EMACS_ENV"
  curl --fail -sL -o "$CACHE/$EMACS_TARBALL" "$EMACS_URL"
  if ! echo "${EMACS_SHA256}  $CACHE/$EMACS_TARBALL" | sha256sum -c - >/dev/null 2>&1; then
    rm -f "$CACHE/$EMACS_TARBALL"
    echo "emacs $EMACS_VERSION 校验失败（sha256 不匹配），中止" >&2
    exit 1
  fi
  mkdir -p "$EMACS_ENV"
  tar -C "$EMACS_ENV" -xzf "$CACHE/$EMACS_TARBALL"
  rm -f "$CACHE/$EMACS_TARBALL"
  EMACS="$EMACS_ENV/bin/emacs"
  echo "emacs: $EMACS（$EMACS_VERSION，本仓库发布）"
}

# 便携 emacs 必须显式告诉它 lisp / etc 在哪（打包时的 prefix 已经作废）——
# 这三个变量就是「可搬运」的关键，少了会在 getenv 阶段就报 "Cannot open load file"。
emacs_run() {
  EMACSLOADPATH="$EMACS_ENV/share/emacs/${EMACS_VERSION}/lisp:$EMACS_ENV/share/emacs/site-lisp" \
  EMACSDATA="$EMACS_ENV/share/emacs/${EMACS_VERSION}/etc" \
  EMACSDOC="$EMACS_ENV/share/emacs/${EMACS_VERSION}/etc" \
  "$EMACS" "$@"
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

ensure_org() {
  if [ -f "$ORG_DIR/org.elc" ] && [ -f "$ORG_DIR/org.el" ]; then
    return
  fi
  echo "装 org-mode ${ORG_VERSION}（GNU ELPA，覆盖 emacs 自带版本）..."
  mkdir -p "$CACHE"
  rm -rf "$ORG_DIR"
  (
    cd "$CACHE"
    curl --fail -sL -o "$ORG_TARBALL" "$ORG_URL"
    if ! echo "${ORG_SHA256}  $ORG_TARBALL" | sha256sum -c - >/dev/null 2>&1; then
      rm -f "$ORG_TARBALL"
      echo "org ${ORG_VERSION} 校验失败（sha256 不匹配），中止" >&2
      exit 1
    fi
    tar -xf "$ORG_TARBALL"
    rm -f "$ORG_TARBALL"
    # ELPA 只发源码：在缓存里字节编译一次，之后每次构建加载都快得多
    emacs_run -Q --batch -L "$ORG_DIR" \
      --eval "(byte-recompile-directory \"$ORG_DIR\" 0 t)" >/dev/null 2>&1 || true
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
ensure_org
# 关键：-L "$ORG_DIR" 让 load-path 里 ELPA 的 org 优先于 emacs 自带的那个。
# 打印实际用的版本，构建日志里能追溯「这一版是用哪套 emacs/org 出的」。
emacs_run -Q --batch -L "$ORG_DIR" --eval "(progn (require 'org) (princ (format \"用 emacs %s / org %s（%s）\n\" emacs-version (org-version) (locate-library \"org\"))))"
# org/ 就是内容真源（2026-10 迁移完成，content/ 已下线）：直接改 org/*.org，构建读的就是它。
# content/ 与转换期脚本（md2org.py / migrate.py）留在 git 历史里，工作区不再有。
emacs_run -Q --batch -L "$ORG_DIR" -l scripts/org2site/build.el org "$OUT" </dev/null

echo "== 2/3 PageFind 搜索索引"
ensure_pagefind
"$PF_BIN" --site "$OUT"

echo "== 3/3 输出体检"
python3 scripts/org2site/verify.py "$OUT"

echo "完成：$OUT"
