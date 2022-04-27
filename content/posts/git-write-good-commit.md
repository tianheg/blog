+++
title = "如何写好 Git commit"
date = 2021-11-13T00:00:00+08:00
lastmod = 2022-04-27T16:07:13+08:00
tags = ["技术", "Git"]
draft = false
+++

好的 commit 的作用：

1.  帮助理解本次操作内容
2.  加速和简化 code reviews
3.  解释不能只用代码来描述的“为什么”
4.  帮助以后的维护者，弄清楚为什么以及改变是怎样产生的，使故障排除和调试更容易

<!--listend-->

```text
feat: add hat wobble
^--^ ^------------^
| |
| |-> Summary in present tense.
|
|------->Type: chore, docs, feat(option), fix, refactor, style, test, (!)BREAKING CHANGE, build, ci, perf, test
```

例子[^fn:1]：

- chore: add Oyster build script
- docs: explain hat wobble
- feat: add beta sequence
- feat(lang): add polish language
- fix: remove broken confirmation message
- refactor: share logic between 4d3d3d3 and flarhgunnstow
- style: convert tabs to spaces
- test: ensure Tayne retains clothing

## GitHub 例子 {#github-例子}

```text
git commit -m "fix: accept current change
https://github.com/tianheg/blog/blob/26af0419337014dea93ada9bf4a3d8bbbcc39619/layouts/shortcodes/music.html#L1"

git commit -m "add: ...
close #123"
```

更多资料见这里[^fn:2]。

[^fn:1]: <https://sparkbox.com/foundry/semantic_commit_messages>
[^fn:2]: <https://www.conventionalcommits.org/en/v1.0.0/#summary>
