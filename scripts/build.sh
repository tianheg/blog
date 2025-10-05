#!/usr/bin/env bash

main() {

  PAGEFIND_VERSION=1.4.0
  HUGO_VERSION=0.151.0

  export TZ=Asia/Hong_Kong

  # Install Pagefind
  echo "Installing Pagefind v${PAGEFIND_VERSION}..."
  wget -q https://github.com/CloudCannon/pagefind/releases/download/v${PAGEFIND_VERSION}/pagefind_extended-v${PAGEFIND_VERSION}-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz -C /opt/buildhome

  # Install Hugo
  echo "Installing Hugo v${HUGO_VERSION}..."
  curl -LJO https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz
  tar -xf "hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
  cp hugo /opt/buildhome
  rm LICENSE README.md hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz

  # Set PATH
  echo "Setting the PATH environment variable..."
  export PATH=/opt/buildhome:$PATH

  # Verify installed versions
  echo "Verifying installations..."
  echo Pagefind: "$(pagefind_extended --version)"
  echo Go: "$(go version)"
  echo Hugo: "$(hugo version)"
  echo Node.js: "$(node --version)"

  # https://github.com/gohugoio/hugo/issues/9810
  git config core.quotepath false

  # Build the site.
  bun run all

}

set -euo pipefail
main "$@"
