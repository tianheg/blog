+++
date = '2021-07-19T22:51:09+08:00'
slug = 'add-code-highlight-for-gatsby-theme-garden'
tags = ['Gatsby']
title = '为gatsby-theme-garden添加代码高亮'
+++

想为没有代码高亮的主题 `gatsby-theme-garden`，添加代码高亮。一开始采用 `gatsby-remark-prismjs`，却发现它的最新版本和 Gatsby v2 版本并不兼容，而把 Gatsby 迁移到 v3 版本代价很大，需要处理更多的兼容性问题。我开始在 Gatsby 官方仓库里找，终于我找到 `gatsby-plugin-theme-ui`。于是，在 `gatsby-config.js` 设置：

```js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-theme-ui',
      options: {
        prismPreset: 'prism-twilight',
      },
    },
  ],
}
```

一开始代码过长的话，是可以自动折叠的，即通过可能是 `overflow: auto;` 这样的 CSS 代码实现。但是，不知道怎么的，过了一段时间却不行了。

而且，发现一个问题：

在目前的文档结构（`./content/*`）下，意思是：

- 文件名称中含有中文字符
- 文件名称中含有空格

当设置 `prismPreset` 为 `prism-twilight`时，和 `gatsby-plugin-local-search` 是矛盾的，无法执行 `gatsby develop`成功。目前不明白为什么会有这样的 Bug，以后有时间和精力的话会探究一下。

ref:

1. <https://github.com/mathieudutour/gatsby-digital-garden>
2. <https://www.npmjs.com/package/gatsby-plugin-theme-ui>
3. <https://theme-ui.com/packages/prism/>
