---
title: 'Hugo 用 Dartsass 替换 Libsass'
date: 2023-02-13T13:58:00+08:00
tags: ['技术', Hugo]
---

Hugo 默认使用 Libsass 编译 *.scss 文件，Libsass 已经不再维护了，Sass 官方推荐使用 Dartsass。我的仓库中用到 npm 包，所以通过这一方式安装相关依赖。

`netlify.toml` 设置：

```toml
[build]
publish = "public"
command = """\
  mkdir -p /opt/build/repo/node_modules/.bin && \
  cp /opt/build/repo/node_modules/sass-embedded-linux-x64/dart-sass-embedded/dart-sass-embedded /opt/build/repo/node_modules/.bin && \
  dart-sass-embedded --version && \
  pnpm run all \
"""

[context.production.environment]
  HUGO_VERSION = "0.110.0"
  NODE_VERSION = "18.12.1"
```

以上内容并不通用，根据自己情况修改使用。

修改相关模板 `themes/tianheg/layouts/partials/style.html` ：

```html
{{- $options := (dict "transpiler" "dartsass") -}}
```

参考资料

- https://gohugo.io/hugo-pipes/scss-sass/
- https://discourse.gohugo.io/t/using-the-dart-sass-transpiler/41878
