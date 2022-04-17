+++
title = "在GitHub Action中使用sed"
date = 2022-04-17T00:00:00+08:00
lastmod = 2022-04-17T21:13:30+08:00
tags = ["技术"]
draft = false
+++

[源文件地址](https://github.com/tianheg/docker-hugo/blob/de93b960f0e472ee4a7a8cacb9449bdfb2b57764/.github/workflows/check-release.yml)

关键修改之前：

```yml
- name: Upgrade Hugo
  if: ${{ steps.hugo_version.outputs.VERSION }} != ${{ steps.local_version.outputs.VERSION }}
  run: |
    sed -i 's/HUGO_VERSIONN=${{ steps.local_version.outputs.VERSION }}/HUGO_VERSION=${{ steps.hugo_version.outputs.VERSION }}/' Dockerfile
```

关键修改之后：

```yml
- name: Upgrade Hugo
  if: ${{ steps.hugo_version.outputs.VERSION }} != ${{ steps.local_version.outputs.VERSION }}
  run: |
    sed -i 's/${{ steps.local_version.outputs.VERSION }}/${{ steps.hugo_version.outputs.VERSION }}/' Dockerfile
```

由此可见，是多余的 \`HUGO_VERSIONN=\`，当我仔细看这段代码，才发现多打了一个字母 N，难怪测试了那么多次都不行，一把前面的 \`HUGO_VERSION=\` 删掉就可以了。
