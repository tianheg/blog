#!/usr/bin/env bash

## pagefind
wget -q https://github.com/CloudCannon/pagefind/releases/download/v$PAGEFIND_VERSION/pagefind_extended-v$PAGEFIND_VERSION-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz -C ./node_modules/.bin
## build
bun run all
