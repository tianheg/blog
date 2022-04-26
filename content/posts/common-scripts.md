+++
title = "常用脚本"
date = 2022-01-14T00:00:00+08:00
lastmod = 2022-04-26T15:55:40+08:00
tags = ["技术"]
draft = false
+++

## 重命名后缀 .md.org to .org {#重命名后缀-dot-md-dot-org-to-dot-org}

```sh
#!/bin/bash

for f in */*/*.md.org
do
  # pandoc -f markdown -t org -o ${f}.org ${f};
  mv "$f" "${f/.md.org/.org}"
done
# rename *.md.org to .org
```

## 批量删除 Pypi 包 {#批量删除-pypi-包}

```sh
pip freeze | grep SOMETHING | xargs pip uninstall -y
# https://stackoverflow.com/a/9406259
```

## 批量删除 Pacman 包 {#批量删除-pacman-包}

```sh
sudo pacman -Rs $(pacman -Qq | grep some_words)
# https://bbs.archlinux.org/viewtopic.php?pid=1533162#p1533162
```

## X.org 下读取文本到剪切板 {#x-dot-org-下读取文本到剪切板}

```sh
xclip -sel c < text.txt
```

## 找到字符串中的汉字 {#找到字符串中的汉字}

<https://stackoverflow.com/a/2718203>

```py
#!/usr/bin/env python
import rs
sample = "I am from 美国。We should be friends. 朋友。"
for n in re.findall(r'[\u4e00-\u9fff]+', sample):
  print(n)
```

## 新建文章 {#新建文章}

```sh
#!/bin/bash

CURRENTDATE=`date +"%Y-%m-%d"`
echo -n "Enter the Article Name: "
read -r a
echo "---
layout: post
title:
tags:
  -
description:
---" >> content/posts/"${CURRENTDATE}-$a.md"
# 问题：
# 如果文章名字含有空格，能够新建文章，但同时会新建其他文档
# 如果 文件名字有 /，无法创建
```

另一种需求：

```sh
#!/bin/bash

CURRENTDATE=`date +"%Y-%m-%d"`
echo -n "Enter the Article Name: "
read -r a
echo "---
title: ''
tags:
  -
description: '用几个精确的字词概括文章内容，方便查找使用'
date: $CURRENTDATE
slug: $a
---" > ~/repo/note/content/posts/"$a.md"
emacs -nw ~/repo/note/content/posts/"$a.md"

# 问题：
# 如果文章名字含有空格，能够新建文章，但同时会新建其他文档
# 如果 文件名字有 /，无法创建
```

## pandoc Org to Md {#pandoc-org-to-md}

```sh
pandoc -f org -t markdown original_org_file -s -o converted_md_file
```

## 创建文件并打开 {#创建文件并打开}

在 \`~/.zshrc\` 文件中创建以下函数：

```cfg
mkcd () {
  mkdir "$1"
  cd "$1"
}
```

使用：

```sh
~ mkcd demo
~/demo
```

## Node.js 操作文件 {#node-dot-js-操作文件}

```js
// https://github.com/tianheg/note/blob/b03bc9a02bb4729ba60c2150de8af85351536686/scripts/fix-date.mjs
import path from 'path'
import fs from 'fs-extra'

const postsFolder = path.resolve('/home/archie/repo/note/content/posts')
/**
 * Step 1: Insert date
 * run perfact!
 */

// try {
//   const files = await fs.readdir(postsFolder)
//   for (const file of files) {
//     // get date through filename
//     // console.log(file.slice(0, 10))
//     fs.readFile(postsFolder + '/' + file, 'utf-8', (err, data) => {
//       if (err) throw err
//       let newData = data.replace(
//         data.slice(4, 16),
//         'date: ' + file.slice(0, 10),
//       )
//       fs.writeFile(postsFolder + '/' + file, newData, 'utf-8', (err) => {
//         if (err) throw err
//         console.log('filelistAsync complete');
//       })
//     })
//   }
// } catch (err) {
//   console.error(err)
// }

/**
 * Step 2: Rename file
 * run perfact!
 */

// try {
//   const files = await fs.readdir(postsFolder)
//   for (const file of files) {
//     // get date through filename
//     console.log(file.slice(11))
//     fs.rename(postsFolder + '/' + file, postsFolder + '/' + file.slice(11))
//   }
// } catch (err) {
//   console.error(err)
// }

/**
 * Step 3: Insert slug
 * run perfact!
 */

try {
  const files = await fs.readdir(postsFolder)
  for (const file of files) {
    // get date through filename
    fs.readFile(postsFolder + '/' + file, 'utf-8', (err, data) => {
      if (err) throw err
      console.log(
        data.replace(
          data.slice(0, 4),
          '---' + '\n' + 'slug: ' + file.slice(0, -3) + '\n',
        ),
      )

      let newData = data.replace(
        data.slice(0, 4),
        '---' + '\n' + 'slug: ' + file.slice(0, -3) + '\n',
      )
      fs.writeFile(postsFolder + '/' + file, newData, 'utf-8', (err) => {
        if (err) throw err
        console.log('filelistAsync complete')
      })
    })
  }
} catch (err) {
  console.error(err)
}
```

## Bash 脚本获取第 3 行文本，并输出特定位置的字符 {#bash-脚本获取第-3-行文本-并输出特定位置的字符}

```sh
sed '3q;d' Dockerfile | cut -c18-23
# https://stackoverflow.com/a/6022431/12539782
# https://stackoverflow.com/a/46097022/12539782
```

## 修改文档 {#修改文档}

```js
import path from 'path'
import fs from 'fs-extra'

const postsFolder = path.resolve('/home/archie/repo/note/content/posts')
/**
 * Step 1: Insert date
 * run perfact!
 */

// try {
//   const files = await fs.readdir(postsFolder)
//   for (const file of files) {
//     // get date through filename
//     // console.log(file.slice(0, 10))
//     fs.readFile(postsFolder + '/' + file, 'utf-8', (err, data) => {
//       if (err) throw err
//       let newData = data.replace(
//         data.slice(4, 16),
//         'date: ' + file.slice(0, 10),
//       )
//       fs.writeFile(postsFolder + '/' + file, newData, 'utf-8', (err) => {
//         if (err) throw err
//         console.log('filelistAsync complete');
//       })
//     })
//   }
// } catch (err) {
//   console.error(err)
// }

/**
 * Step 2: Rename file
 * run perfact!
 */

// try {
//   const files = await fs.readdir(postsFolder)
//   for (const file of files) {
//     // get date through filename
//     console.log(file.slice(11))
//     fs.rename(postsFolder + '/' + file, postsFolder + '/' + file.slice(11))
//   }
// } catch (err) {
//   console.error(err)
// }

/**
 * Step 3: Insert slug
 * run perfact!
 */

try {
  const files = await fs.readdir(postsFolder)
  for (const file of files) {
    // get date through filename
    fs.readFile(postsFolder + '/' + file, 'utf-8', (err, data) => {
      if (err) throw err
      console.log(
        data.replace(
          data.slice(0, 4),
          '---' + '\n' + 'slug: ' + file.slice(0, -3) + '\n',
        ),
      )

      let newData = data.replace(
        data.slice(0, 4),
        '---' + '\n' + 'slug: ' + file.slice(0, -3) + '\n',
      )
      fs.writeFile(postsFolder + '/' + file, newData, 'utf-8', (err) => {
        if (err) throw err
        console.log('filelistAsync complete')
      })
    })
  }
} catch (err) {
  console.error(err)
}
```
