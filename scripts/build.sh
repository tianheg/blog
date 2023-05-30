#!/usr/bin/env bash

## pagefind
wget -q https://github.com/CloudCannon/pagefind/releases/download/v$PAGEFIND_VERSION/pagefind_extended-v$PAGEFIND_VERSION-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz -C ./node_modules/.bin
## dart-sass-embedded
wget -q https://github.com/sass/dart-sass-embedded/releases/download/$DART_SASS_VERSION/sass_embedded-$DART_SASS_VERSION-linux-x64.tar.gz -O - | tar -xz -C ./node_modules/.bin
cd node_modules/.bin
if [ -d "./src" ]; then
  echo "src folder exist"
else
  echo "src folder does not exist"
  mv sass_embedded/* .
  rm -rf sass_embedded
fi
cd ../..
dart-sass-embedded --version
pnpm run all
