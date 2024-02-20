#!/usr/bin/env sh

HUGO_VERSION="0.123.0"
HUGO_ID="hugo_extended_${HUGO_VERSION}"
HOME="archie"
HUGO_DIR="/home/${HOME}/Downloads/hugo-ex"

pwd
rm -rf "${HUGO_DIR}"
mkdir "${HUGO_DIR}"
wget -O - "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_Linux-64bit.tar.gz" | tar -xz -C "${HUGO_DIR}"
mv "${HUGO_DIR}/hugo" /usr/bin/hugo
rm -rf "${HUGO_DIR}"
pwd