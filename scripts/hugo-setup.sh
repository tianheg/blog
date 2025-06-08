#!/usr/bin/env sh

HUGO_VERSION="0.147.8"
HUGO_ID="hugo_extended_${HUGO_VERSION}"
mkdir -p ./hugo-bin
wget -O - "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_Linux-64bit.tar.gz" | tar -xz -C ./hugo-bin
mv ./hugo-bin/hugo ~/.local/bin/
rm -rf ./hugo-bin
