+++
title = "GitHub Code Search 搜索语法"
date = 2022-01-11T00:00:00+08:00
lastmod = 2022-04-27T16:07:32+08:00
tags = ["技术", "GitHub"]
draft = false
+++

<https://cs.github.com/about/syntax>

## 基础查询结构 {#基础查询结构}

一个关键词会匹配文件内容或文件路径。

多个关键词会匹配文件内容，只要包含关键词，就会出现在搜索结果中，不论前后顺序，是否是一个单词（多个关键词之间没有空格）。

还可以使用特定关键字（限定词）指定查询范围：

- repo:github/github
- org:github 或者 user:tj
- language:python
- path:README.md
- extension:js
- symbol:scanbytes
- content:querystats

还支持逻辑运算符：

- hello world &lt;=&gt; hello AND world
- hello OR world
- hello NOT world
- "fatal error" NOT path:\_\_testing\_\_
- (language:ruby OR language:python) AND NOT path:"_tests_"

还支持正则表达式，要用 // 包围：

\\/git.\*push\\/

会查询所有文件中，git 后面有 push 的部分。git 与 push 之间可以有任意字符。

## 精确查找 {#精确查找}

目标词组要用 "" 包裹 "abc def"。

如果待搜索的字符串中有引号，可以用反斜杠转义 "name = \\"Jim\\""。

也支持限定词 path:git language:"protocol buffers"。

## 仓库和组织限定词 {#仓库和组织限定词}

repo:github/linguist

repo:torvalds/linux OR repo:git/git

org:github &lt;=&gt; user:github

目前（2022-01-11）还不支持对仓库名和组织名、用户名的正则表达式全部或部分匹配，所以搜索时，需要输入目标的全部 user[org]/reponame。

## 语言限定 {#语言限定}

language:ruby OR language:cpp OR language:csharp

所有语言都在[这里](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)。

## 路径限定 {#路径限定}

path:unit_tests

它会查找所有路径中包含目标的部分。

如果只想得到根路径下的内容，用正则表达式：

```text
path:/(^|\\/)/README\.md$/
```

## 扩展名限定 {#扩展名限定}

extension:.js &lt;=&gt; extension:js

extension:/[jt]s/

查找扩展名为 js 或 ts 的文件。

## Symbol 限定 {#symbol-限定}

language:go symbol:WithContext

目前（2022-01-11）只能查找关于 Symbol 的定义，还没有支持所有 Symbol 或语言。关于语言支持 Symbol 搜索的情况可以看 [FAQ](https://cs.github.com/about/faq#languages)。

同样可以用正则表达式搜索：

language:rust symbol:/^String::to\_.\*/

## Content 限定 {#content-限定}

如果只想搜索内容，不包括文件路径，可以这样

content:README.md

它只匹配文件内容中，含有 README.md 的部分。