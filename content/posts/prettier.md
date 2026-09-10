---
title: Prettier
date: 2022-11-14T21:58:00+08:00
tags: ['技术']
---

https://prettier.io/docs/en/index.html

目前的配置：

.prettierrc:

```
    {
      "$schema": "https://json.schemastore.org/prettierrc",
      "tabWidth": 2,
      "semi": false,
      "singleQuote": true,
      "trailingComma": "all",
      "endOfLine": "lf"
    }
```

.prettierignore:

```
    .cache
    package.json
    package-lock.json
    public
```

### 安装配置

```
    pnpm install --save-dev prettier
    echo {}> .prettierrc
    touch .prettierignore
```

使用 Visual Studio Code 作为代码编辑器，安装 `Prettier - Code formatter`
扩展。

### Git Hooks

https://prettier.io/docs/en/precommit.html

```
    pnpm install --save-dev husky lint-staged
    pnpx husky install
    npm pkg set scripts.prepare="husky install"
    pnpx husky add .husky/pre-commit "pnpx lint-staged"
```

在 package.json 中加入：

```
    {
      "lint-staged": {
        "**/*.{js,jsx,ts,tsx,json,md,scss}": "prettier --write"
      }
    }
```

### Ignore Code

https://prettier.io/docs/en/ignore.html

### Integrating with Linters

https://prettier.io/docs/en/integrating-with-linters.html

### Plugins

https://prettier.io/docs/en/plugins.html

### CLI

https://prettier.io/docs/en/cli.html

### API

https://prettier.io/docs/en/api.html
