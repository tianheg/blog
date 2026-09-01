#!/usr/bin/env bash
set -euo pipefail

main() {

  HUGO_VERSION=0.165.0

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

main "$@"
