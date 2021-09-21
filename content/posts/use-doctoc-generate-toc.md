+++
date = '2020-05-11T19:05:46+08:00'
description = '记录使用 DocToc 生成目录'
keywords = ['工具']
tags = ['工具']
title = '使用 DocToc 自动生成文档目录'

+++

DocToc 为本地 git 存储库中的 markdown 文件生成目录。生成的目录可以正常显示在包括 GitHub 在内的代码托管网站上。

用 DocToc 生成的目录：

- 安装
- 使用
  - 给当前目录及子目录的所有文件添加目录
  - 轻松地更新已存在的由 DocToc 生成的目录
  - 给单个文件添加目录
    - 例子
  - 使用 DocToc 生成兼容其他网站的链接
    - 例子
  - 指定目录的位置
  - 指定自定义目录标题
  - 指定目录的最大标题级别
  - 打印到标准输出
  - 作为一个 Git 钩子使用

## 安装

```bash
npm install -g doctoc
```

## 使用

在最简单的用法中，可以将一个或多个文件或文件夹传递给 `doctoc` 命令。这将更新指定的每个文件以及通过递归搜索每个文件夹找到的每个标记文件的 toc。下面是一些例子。

### 给当前目录及子目录的所有文件添加目录

在你本地的 Git 仓库目录下，打开终端，输入：

```bash
doctoc .
```

该命令会更新所有当前目录和子目录的 markdown 文件，用一个内容表指向一个文件对应的各级 markdown 标题，该内容表由 markdown 语法剖析程式生成。 DocToc 默认使用 GitHub 语法，但是可以指定 [其他模式](#使用doctoc生成兼容其他网站的链接)

### 轻松地更新已存在的由 DocToc 生成的目录

如果你已经有了一个由 DocToc 生成的目录，那 `doctoc .` 命令执行时，文档会自动更新，而不是插入一个复制版本。 DocToc 把生成的目录放在 `<!-- START doctoc -->` 和 `<!-- END doctoc -->` 之间，所以你也可以把它放在文档的任何位置，同样可以更新。

### 给单个文件添加目录

如果你只想转换一个文件，这样做：

```bash
doctoc /path/to/file [...]
```

#### 例子

```bash
doctoc README.md

doctoc CONTRIBUTING.md LICENSE.md
```

你可以通过该特征做更复杂的事情。例如，如果你安装了 [ack](http://beyondgrep.com/) ，你可以给具体的文件添加 `<!-- DOCTOC SKIP -->` 然后使用

```bash
ack -L 'DOCTOC SKIP' | xargs doctoc
```

来仅仅重新编译哪些没有 “DCOTOC SKIP” 注解的文件。

### 使用 DocToc 生成兼容其他网站的链接

为了添加的内容表能够兼容其他站点，而添加适当的模式标识：

可用的模式：

```bash
--bitbucket bitbucket.org
--nodejs    nodejs.org
--github    github.com
--gitlab    gitlab.com
--ghost     ghost.org
```

#### 例子

```bash
doctoc README.md --bitbucket
```

### 指定目录位置

DocToc 默认将目录放在文档的顶部，你可以通过以下格式，让 DocToc 将生成的目录放在其他地方：

```bash
<!-- START doctoc -->
<!-- END doctoc -->
```

你可以直接把这段代码放在你的 .md 文件中。例如：

```md
// my_new_post.md
Here we are, introducing the post. It's going to be great!
But first: a TOC for easy reference.

<!-- START doctoc -->
<!-- END doctoc -->

# Section One

Here we'll discuss...
```

执行命令将会在该处插入目录。

### 指定自定义目录标题

使用 `--title` 选项可以指定 markdown 格式的自定义目录标题。例子，`doctoc --title '**Contents**'`。在这之后，你可以简单地执行 `doctoc <file>`，DocToc 会保留你自定义的标题。

或者使用 `--notitle` 选项，用换行把标题空出来。这样会很方便地将该标题移出目录。

### 指定目录的最大标题级别

使用 `--maxlevel` 选项将 TOC 条目限制为只包含指定级别的标题;例如，`doctoc——maxlevel 3`。

默认情况下，对标记格式的标题没有限制，而来自嵌入式 HTML 的标题被限制在 4 个级别。

### 打印到标准输出

可以使用 `-s` 或 `--stdout` 选项打印到 stdout 。

### 作为一个 Git 钩子使用

通过使用以下配置，doctoc 可以用作 [预提交](http://pre-commit.com/) 钩子：

```txt
repos:
-   repo: https://github.com/thlorenz/doctoc
    sha: ...  # substitute a tagged version 
    hooks:
    -   id: doctoc
```

这将在提交时对标记文件运行 `doctoc`，以确保 TOC 保持最新。

---

**参考链接**：

1. <https://www.npmjs.com/package/doctoc>
