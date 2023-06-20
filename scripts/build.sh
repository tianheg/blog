#!/usr/bin/env bash

## pagefind
wget -q https://github.com/CloudCannon/pagefind/releases/download/v$PAGEFIND_VERSION/pagefind_extended-v$PAGEFIND_VERSION-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz -C ./node_modules/.bin
## dart-sass embedded version
wget -q https://github.com/sass/dart-sass/releases/download/$DART_SASS_VERSION/dart-sass-$DART_SASS_VERSION-linux-x64.tar.gz -O - | tar -xz -C /usr/local/bin
sass --embedded --version
pnpm run all
