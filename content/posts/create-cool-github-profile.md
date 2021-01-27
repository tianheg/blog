---
title: "为 GitHub 主页添加「年进度」和「最近更新的博客文章」"
date: 2021-01-26T15:49:42+08:00
description: "为 GitHub 主页添加「年进度」和「最近更新的博客文章"
tags: ["GitHub", "GitHub Actions", "JavaScript", "Python", "pipenv"]
keywords: ["GitHub", "GitHub Actions", "JavaScript", "Python", "pipenv"]
---

午饭前看到一个 issue：[[开源自荐] 利用Github Actions获取网站的Rss数据，并更新到个人主页](https://github.com/ruanyf/weekly/issues/1616)。

标题勾起了我学习的兴趣。自己也想进一步学习 [GitHub Actions](/posts/get-github-stars) 的使用。

## 添加「年进度」

用到了 JavaScript 的知识，代码：

```js
const thisYear = new Date().getFullYear()
const startTimeOfThisYear = new Date(`${thisYear}-01-01T00:00:00+00:00`).getTime()
const endTimeOfThisYear = new Date(`${thisYear}-12-31T23:59:59+00:00`).getTime()
const progressOfThisYear = (Date.now() - startTimeOfThisYear) / (endTimeOfThisYear - startTimeOfThisYear)
const progressBarOfThisYear = generateProgressBar()

function generateProgressBar() {
    const progressBarCapacity = 30
    const passedProgressBarIndex = parseInt(progressOfThisYear * progressBarCapacity)
    const progressBar = Array(progressBarCapacity)
        .fill('_')
        .map((value, index) => index < passedProgressBarIndex ? '█' : value)
        .join('')
    return ` ${progressBar}`
}

const readme =`
Annual balance  ${progressBarOfThisYear} ${(progressBarOfThisYear * 100).toFixed(2)} %
⏰ Updated on ${new Date().toUTCString()}`;
console.log(readme)
```

**注释**：

1. `const` 定义常量名，需要初始化

---

**参考资料**：

1. <https://github.com/zhaoolee/zhaoolee>
