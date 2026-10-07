#!/usr/bin/env bash
# build.sh — 构建模块（单一入口，版本 pin 只此一处）
#
#   bash scripts/build.sh          CI 全量：装 Hugo → npm run all（wrangler build.command 默认）
#   bash scripts/build.sh setup    本地安装 Hugo 到 ~/.local/bin（原 hugo-setup.sh，2026-10-07 并入）
#   bash scripts/build.sh --help   用法
#
# 本地与 CI 用同一个 HUGO_VERSION 常量 —— 合并前两处 pin 曾各写各的（cf-workers-patterns 记过这个坑）。
set -euo pipefail

HUGO_VERSION=0.167.0

usage() {
  cat <<EOF
用法: bash scripts/build.sh [setup|build]
  setup   本地安装 Hugo v${HUGO_VERSION} 到 ~/.local/bin（sha256 校验）
  build   CI 全量构建（默认；装 Hugo 到 /opt/buildhome → npm run all）
EOF
}

setup_local() {
  local id="hugo_${HUGO_VERSION}"
  local tarball="${id}_linux-amd64.tar.gz"
  local checksums="hugo_${HUGO_VERSION}_checksums.txt"
  local base="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}"

  mkdir -p ./hugo-bin
  curl --fail -LJO "${base}/${tarball}"
  curl --fail -LJO "${base}/${checksums}"
  grep "${tarball}" "${checksums}" | sha256sum -c -
  tar -xzf "${tarball}" -C ./hugo-bin hugo
  mkdir -p ~/.local/bin
  mv ./hugo-bin/hugo ~/.local/bin/
  rm -f "${tarball}" "${checksums}"
  rm -rf ./hugo-bin
  ~/.local/bin/hugo version
}

ci_build() {
  export TZ=Asia/Hong_Kong

  # Install Hugo — 下载 + sha256 校验（防 tampered release 被静默执行）
  echo "Installing Hugo v${HUGO_VERSION}..."
  curl --fail -LJO https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz
  curl --fail -LJO https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_checksums.txt
  grep "hugo_${HUGO_VERSION}_linux-amd64.tar.gz" "hugo_${HUGO_VERSION}_checksums.txt" | sha256sum -c -
  tar -xf "hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
  cp hugo /opt/buildhome
  rm LICENSE README.md hugo_${HUGO_VERSION}_linux-amd64.tar.gz hugo_${HUGO_VERSION}_checksums.txt

  # Set PATH
  echo "Setting the PATH environment variable..."
  export PATH=/opt/buildhome:$PATH

  # Verify installed versions
  echo "Verifying installations..."
  echo Go: "$(go version)"
  echo Hugo: "$(hugo version)"
  echo Node.js: "$(node --version)"

  # https://github.com/gohugoio/hugo/issues/9810
  git config core.quotepath false

  # Deepen shallow clone for accurate git lastmod
  git fetch --unshallow || true

  # Build the site + PageFind index
  # (semantic index is generated locally via `npm run embed` and committed to
  # static/pagefind-semantic/ — Hugo copies it into public/ automatically)
  npm run all
}

case "${1:-build}" in
  setup) setup_local ;;
  build) ci_build ;;
  -h|--help|help) usage ;;
  *) echo "✗ 未知子命令: $1" >&2; usage >&2; exit 2 ;;
esac
