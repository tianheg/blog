---
title: 'Netlify Use PNPM'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Web
---

<https://github.com/netlify/build/issues/1633>

netlify.toml:

```toml
[build.environment]
NODE_VERSION = "16"
NPM_FLAGS = "--version"

[build]
publish = "dist"
command = "npx pnpm install --store=node_modules/.pnpm-store && npx pnpm build"
```


相关：[[create-publish-scoped-public-packages|create-publish-scoped-public-packages]]

相关：[[pnpm-ci|pnpm-ci]]

相关：[[use-slidev-make-ppt|use-slidev-make-ppt]]