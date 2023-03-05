#!/usr/bin/env zx

const HUGO_VERSION = "0.111.1";
const HUGO_ID = `hugo_extended_${HUGO_VERSION}`;
const HOME = "archie";
const HUGO_DIR = `/home/${HOME}/Downloads/hugo-ex`
await $`pwd`;
await $`rm -rf ${HUGO_DIR}`;
await $`mkdir ${HUGO_DIR}`;
await $`wget -O - https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_ID}_Linux-64bit.tar.gz -q | tar -xz -C ${HUGO_DIR}`;
await $`mv ${HUGO_DIR}/hugo /usr/bin/hugo`;
await $`rm -rf ${HUGO_DIR}`;
await $`pwd`;
