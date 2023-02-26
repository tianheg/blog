#!/bin/bash

wget -q https://github.com/CloudCannon/pagefind/releases/download/v$PAGEFIND_VERSION/pagefind_extended-v$PAGEFIND_VERSION-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz
mkdir -p /opt/build/repo/node_modules/.bin
mv pagefind_extended /opt/build/repo/node_modules/.bin
cp /opt/build/repo/node_modules/sass-embedded-linux-x64/dart-sass-embedded/dart-sass-embedded /opt/build/repo/node_modules/.bin
dart-sass-embedded --version
pnpm run all
