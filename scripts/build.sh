#!/usr/bin/env bash
set -euo pipefail

main() {

  HUGO_VERSION=0.164.0

  export TZ=Asia/Hong_Kong

  # Install Hugo
  echo "Installing Hugo v${HUGO_VERSION}..."
  curl -LJO https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz
  tar -xf "hugo_${HUGO_VERSION}_linux-amd64.tar.gz"
  cp hugo /opt/buildhome
  rm LICENSE README.md hugo_${HUGO_VERSION}_linux-amd64.tar.gz

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

  # Fetch external data before building
  echo "Fetching external data..."
  bash scripts/fetch-watch-data.sh

  # CJK-aware word count for TIL dashboard
  echo "Counting TIL words..."
  node scripts/count-words.mjs

  # Build the site.
  npm run all

}

main "$@"