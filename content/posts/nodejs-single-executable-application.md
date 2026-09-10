---
title: 'Node.js Single Executable Applications'
date: 2023-04-13T09:46:00+08:00
tags: ['技术']
---

<https://github.com/nodejs/node/releases/tag/v18.16.0>

Node.js 当前（\<2023-04-13 Thu\>）最新长期支持版本 18.16.0 为 SEA（Single Executable Applications）提供了初步支持。

```bash
$ echo 'console.log(`Hello, ${process.argv[2]}!`);' > hello.js

$ cp $(command -v node) hello

# On systems other than macOS:
$ npx postject hello NODE_JS_CODE hello.js \
    --sentinel-fuse NODE_JS_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# On macOS:
$ npx postject hello NODE_JS_CODE hello.js \
    --sentinel-fuse NODE_JS_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
    --macho-segment-name NODE_JS

$ ./hello world
Hello, world!
```
