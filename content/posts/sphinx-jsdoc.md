+++
title = "如何在 Sphinx 下使用 JSDoc"
date = 2022-01-14T00:00:00+08:00
lastmod = 2022-02-16T15:01:15+08:00
tags = ["技术"]
draft = false
+++

我建了一个仓库，记录自己学习 MDN 网站的过程。我发现了很多函数，它们有参数和返回值，我想着能不能把学习使用过的函数做成一个文档列表，于是我找到了 JSDoc[^fn:1]。它能根据 js 源文件生成文档。

Sphinx 是 Python 编程语言下的常见文档构建程序。我想把 JSDoc 和它结合起来，于是我找到了 sphinx-js[^fn:2]。


## 使用 {#使用}

确保 Python 版本为 3.8，使用 3.10 会报错：

```sh
Could not import extension sphinx_js (exception: cannot import name 'Mapping' from 'collections' (/usr/lib/python3.10/collections/__init__.py))
```

可以将待安装的 pypi 包保存为 requirements.txt：

```txt
sphinx
sphinx-autobuild
sphinx-js>=3.1
## 以上必选，以下分别是主题，md 文档支持，可不安装
furo
myst-parser
```

```sh
# 创建虚拟环境并更新依赖到最新版本
python -m venv venv --upgrade-deps
# 激活虚拟环境
. venv/bin/activate
# 安装 pypi 包
pip install -r requirements.txt
```

Sphinx 文档配置文件 conf.py：

```python
extensions = [
  "sphinx_js"
]
# Used to extract JSDoc function/class docs from source
js_language = 'javascript'
js_source_path = '../src/'
# jsdoc_config_path = '../tsconfig.json'
primary_domain = 'js'
```

文档配置 api.rst：

```rst
API
====

.. autofunction:: parseInt
```

js 源文件 index.js：

```js
/** @function parseInt
 * @param {string} string - value to parse
 * @param {number} [radix] - integer between 2 and 36. Not default to 10 !!!
 * @return {(number|NaN)} integer | NaN (radix < 2 or radix > 36 or first non-whitespace character cannot be converted to a number)
 *
 * @example
 * parseInt('0xe', 16)
 */
```

本地预览：

```sh
sphinx-autobuild content build
```


## 文件结构 {#文件结构}

```txt
.
├── build
├── content
│  ├── _static
│  ├── api.rst
│  ├── conf.py
│  └── index.md
├── Makefile
├── requirements.txt
├── src
│  └── index.js
└── venv
```


## GitHub Action 自动部署 {#github-action-自动部署}

```yml
name: "Build Sphinx"

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-python@v2
      with:
        python-version: 3.8
    - uses: actions/setup-node@v2
      with:
        node-version: '14'
    - name: Install dependencies
      run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          npm install -g jsdoc
    - name: Clone deploy branch
      run: |
        REMOTE_BRANCH="${REMOTE_BRANCH:-gh-pages}"
        REMOTE_REPO="https://${GITHUB_ACTOR}:${{ secrets.GITHUB_TOKEN }}@github.com/${GITHUB_REPOSITORY}.git"

        rm -rf build/html/
        mkdir -p build/html/
        git clone --depth=1 --branch="${REMOTE_BRANCH}" --single-branch --no-checkout \
          "${REMOTE_REPO}" build/html/
    - run: make html
    - name: Deploy to GitHub Pages
      if: "github.event_name == 'push'"
      run: |
        SOURCE_COMMIT="$(git log -1 --pretty="%an: %B" "$GITHUB_SHA")"
        pushd build/html/ &>/dev/null
        if [ "$(git status --porcelain | wc -l)" -eq 0 ]; then
          exit 0
        fi

        git add --all
        git -c user.name="${GITHUB_ACTOR}" -c user.email="${GITHUB_ACTOR}@users.noreply.github.com" \
          commit --quiet \
          --message "Deploy docs from ${GITHUB_SHA}" \
          --message "$SOURCE_COMMIT"
        git push

        popd &>/dev/null
```

[^fn:1]: <https://github.com/jsdoc/jsdoc>
[^fn:2]: <https://github.com/mozilla/sphinx-js>