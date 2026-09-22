#!/usr/bin/env sh
set -eu

# 本地安装 hugo（CI 用 scripts/build.sh）
# 版本与 scripts/build.sh 保持一致
HUGO_VERSION="0.166.0"
HUGO_ID="hugo_${HUGO_VERSION}"
TARBALL="${HUGO_ID}_linux-amd64.tar.gz"
CHECKSUMS="hugo_${HUGO_VERSION}_checksums.txt"
BASE="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}"

mkdir -p ./hugo-bin
curl --fail -LJO "${BASE}/${TARBALL}"
curl --fail -LJO "${BASE}/${CHECKSUMS}"
grep "${TARBALL}" "${CHECKSUMS}" | sha256sum -c -
tar -xzf "${TARBALL}" -C ./hugo-bin hugo
mkdir -p ~/.local/bin
mv ./hugo-bin/hugo ~/.local/bin/
rm -f "${TARBALL}" "${CHECKSUMS}"
rm -rf ./hugo-bin

~/.local/bin/hugo version
