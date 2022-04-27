+++
title = "为 GitHub 主页添加「年进度」和「最近更新的博客文章」"
date = 2021-01-26T00:00:00+08:00
lastmod = 2022-04-27T13:47:59+08:00
tags = ["技术", "GitHub"]
draft = false
+++

午饭前看到一个 issue：[[开源自荐] 利用
Github Actions 获取网站的 RSS 数据，并更新到个人主页](https://github.com/ruanyf/weekly/issues/1616)。

标题勾起了我学习的兴趣。自己也想进一步学习 [GitHub Actions](/tags/github-actions/) 的使用。

## 添加「年进度」 {#添加-年进度}

用到了 JavaScript 的知识，代码：

```js
const thisYear = new Date().getFullYear()
const startTimeOfThisYear = new Date(
  `${thisYear}-01-01T00:00:00+00:00`,
).getTime()
const endTimeOfThisYear = new Date(`${thisYear}-12-31T23:59:59+00:00`).getTime()
const progressOfThisYear =
  (Date.now() - startTimeOfThisYear) / (endTimeOfThisYear - startTimeOfThisYear)
const progressBarOfThisYear = generateProgressBar()

function generateProgressBar() {
  const progressBarCapacity = 30
  const passedProgressBarIndex = parseInt(
    progressOfThisYear * progressBarCapacity,
  )
  const progressBar = Array(progressBarCapacity)
    .fill('_')
    .map((value, index) => (index < passedProgressBarIndex ? '█' : value))
    .join('')
  return ` ${progressBar}`
}

const readme = `
Annual balance  ${progressBarOfThisYear} ${(
  progressBarOfThisYear * 100
).toFixed(2)} %
⏰ Updated on ${new Date().toUTCString()}`
console.log(readme)
```

\*注释\*：

1.  `const` 定义常量名，需要初始化
2.  `thisYear` 当前年份
3.  `startTimeOfThisYear` 今年的开始时间
4.  `endTimeOfThisYear` 今年的结束时间
5.  `progressOfThisYear` 今年的进度（百分比）
6.  `progressBarOfThisYear` 今年的进度条
7.  `generateProgressBar` 生成进度条
8.  `function` 定义函数

## 添加「最近更新的博客文章」 {#添加-最近更新的博客文章}

使用了 [pipenv](https://github.com/pypa/pipenv) 这个 Python 开发工作流。在与个人用户名相同的仓库中添加 `Pipfile` ：

```text
[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[scripts]
build = "python main.py"

[dev-packages]

[packages]
requests = "2.25.1"
feedparser = "6.0.2"
pytz = "2020.5"

[requires]
python_version = "3.7"
```

`python_version` 必须是 3.7，改成其他的会报错（[错误地址 1][]）：

```text
Warning: Python 3.8 was not found on your system...
Neither 'pyenv' nor 'asdf' could be found to install Python.
You can specify specific versions of Python with:
$ pipenv --python path/to/python
```

因为好奇是否必须是 3.7，我改成 3.8，3.9，3.x。发现都出现错误。改成 3.x
报错（[错误地址 2][]）：

```text
ValueError: invalid literal for int() with base 10: '3.x'
```

本地运行的话，需要使用 `pip=，=pipenv` 命令。我的本地环境是
WSL2-Ubuntu20.04。我已经安装了最新版本的 pip，直接安装 pipenv 即可：

```text
pip install pipenv
```

然后，在本地仓库中新建上述文件 =Pipfile=，执行：

```text
pipenv install
```

安装依赖，会自动生成
=Pipfile.lock=，可以选择不同步至远程仓库，因为在运行 GitHub Actions
时，环境会自动生成相关依赖文件。

另外一个主要文件就是 =main.py=：

```text
import feedparser
import time
import os
import re
import pytz
from datetime import datetime

def get_link_info(feed_url, num):

    result = ""
    feed = feedparser.parse(feed_url)
    feed_entries = feed["entries"]
    feed_entries_length = len(feed_entries)
    all_number = 0;

    if(num > feed_entries_length):
        all_number = feed_entries_length
    else:
        all_number = num

    for entrie in feed_entries[0: all_number]:
        title = entrie["title"]
        link = entrie["link"]
        result = result + "\n" + "[" + title + "](" + link + ")" + "\n"

    return result

def main():
    blog =  get_link_info("https://www.yidajiabei.xyz/index.xml", 3)
    insert_info = blog

    # 替换 ---start--- 到 ---end--- 之间的内容
    # pytz.timezone('Asia/Shanghai')).strftime('%Y年%m月%d日%H时M分')
    fmt = '%Y-%m-%d %H:%M:%S %Z%z'
    insert_info = "---start---\n\n**最近更新文章(" + "更新时间:"+  datetime.fromtimestamp(int(time.time()),pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S') + " | 通过Github Actions自动更新)**" +"\n" + insert_info + "\n---end---"
    # 获取README.md内容
    with open (os.path.join(os.getcwd(), "README.md"), 'r', encoding='utf-8') as f:
        readme_md_content = f.read()

    print(insert_info)

    new_readme_md_content = re.sub(r'---start---(.|\n)*---end---', insert_info, readme_md_content)

    with open (os.path.join(os.getcwd(), "README.md"), 'w', encoding='utf-8') as f:
        f.write(new_readme_md_content)

main()
```

它是一个 Python 源文件，主要作用就是在 `README.md` 文件的 `---start---` 和 `---end---` 插入我最近更新的三篇文章。

## 整合 GitHub Actions {#整合-github-actions}

我想让 GitHub Actions 帮我完成这两件事。我需要怎么做呢？

首先，新建文件 =~/.github/workflows/main.yml=，并添加以下内容：

```text
name: update tianheg profile

on:
  workflow_dispatch:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v1
      with:
        node-version: '14.x'
    - name: Update README.md
      run: node index.js > README.md
    - name: Install dependecies
      uses: tianheg/github-actions@pipenv
      with:
        command: install --dev # Install all dependencies, including development ones
    - name: Build
      uses: tianheg/github-actions@pipenv
      with:
        command: run build
    - name: Commit change & Push
      run: |
          git diff
          git config user.name 'github-actions[bot]'
          git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git commit -am "bot: update README.md automatically"
          git push
```

注释：

1.  `name` 名字是任取的，能表达意思即可
2.  `on` 何时运行。 `workflow_dispatch` 能让我手动执行工作流， `0 */6 * * *` 是一种表示周期时间的语法，当前含义：每六个小时执行一次（[了解更多](https://crontab.guru/)）
3.  `jobs` 它后面就是具体的工作流
4.  `build` 第一个工作的名称，单个任意单词即可
5.  `runs-on: ubuntu-latest` 表示在 Ubuntu 最新版（最新版指 20.04LTS）运行
6.  `steps` 步骤
7.  `uses: actions/checkout@v2` 使用 actions/checkout@v2 将当前仓库复制到虚拟环境（ubuntu-latest）中。
8.  `uses: actions/setup-node@v1=，=node-version: '14.x'` 安装 Node.js 14.x
9.  `run: node index.js > README.md` 把「年进度」更新到 README.md 中
10. `uses: tianheg/github-actions@pipenv=，=command: install --dev=，=command: run build` 安装 pipenv 环境（因为会用到很多 GitHub Actions，于是就把有用的整成一个仓库），并执行命令 `pipenv install --dev` ，然后执行命令 `pipenv run build`
11. 最后一部分就是使用 github-actions[bot] 机器人作为提交者，提交这次 commit

## 解释 tianheg/github-actions@pipenv {#解释-tianheg-github-actions-pipenv}

这是我使用的关于 pipenv 的 GitHub Actions，它位于我的 GitHub 仓库的 pipenv 分支中。

文件结构：

```text
Dockerfile
LICENSE
README.md
action.yml
entrypoint.sh
```

主要发挥作用的是 `Dockerfile` ， `entrypoint.sh` 。

`Dockerfile` 内容：

```text
ARG PYTHON_IMAGE_VERSION=3
FROM python:$PYTHON_IMAGE_VERSION

RUN pip install --upgrade pip \
 && pip install pipenv \
 && python --version ; pip --version ; pipenv --version

COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

`entrypoint.sh` 内容：

```text
#!/bin/sh

sh -c "pipenv $*"
```

对于 Dockerfile 我不了解它的使用细节，但从这个文件里，我看出它完成了这几件事：获得 Python3；升级 pip；安装 pipenv；复制 entrypoint.sh 到根目录；给 entrypoint.sh 执行权限。

对于 entrypoint.sh 它完成的是输入了 `pipenv` 。这样在执行命令时，才能够只输入 `install --dev` ， `run build` 。

---

参考资料

1.  <https://github.com/zhaoolee/zhaoolee>
