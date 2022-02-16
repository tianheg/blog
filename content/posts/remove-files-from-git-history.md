+++
title = "如何从 Git 仓库中完全移除文件"
date = 2021-11-11T00:00:00+08:00
lastmod = 2022-02-16T15:17:28+08:00
tags = ["技术", "Git"]
draft = false
+++

请注意：不要在重要仓库中尝试，可以先新建一个测试 Git
仓库，以熟悉操作步骤（实际上只有一行命令）。

能够达到我的目的的命令[^fn:1]：

```text
git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch path_to_file" HEAD
git push -f
```

当使用 `filter-branch` 命令时，出现以下提示：

```text
WARNING: git-filter-branch has a glut of gotchas generating mangled history
         rewrites.  Hit Ctrl-C before proceeding to abort, then use an
         alternative filtering tool such as 'git filter-repo'
         (https://github.com/newren/git-filter-repo/) instead.  See the
         filter-branch manual page for more details; to squelch this warning,
         set FILTER_BRANCH_SQUELCH_WARNING=1.
```

大意就是说，=filter-branch= 命令有大量陷阱，会把已有的历史弄乱。按
Ctrl+C 可在未执行命令以前取消，然后使用另一个可供选择的筛选工具
[git filter-repo](https://github.com/newren/git-filter-repo)。查看
`filter-branch` 的手册获取更多信息，略去警告需设置
=FILTER_BRANCH_SQUELCH_WARNING=1=。


## 了解 `git filter-repo`[^fn:2] {#了解-git-filter-repo}

`git filter-repo` 是一个用于重写 Git 仓库历史的多功能工具。它和
`git filter-branch`
差不多，但是没有导致性能下降的问题，它的功能更强大，而且它的设计可以扩展可用性，而不是简单的重写情况。=git filter-repo=
现在被 Git 项目推荐，用于代替 =git filter-branch=。

```text
sudo pacman -S git-filter-repo # 安装

### 演示使用方法
git init test_git_filter_repo && cd $_ # 新建名为 test_git_filter_repo 的 Git 仓库，并打开
touch test # 新建文件
git add test # 添加到暂存区
git commit -m "message" # 提交至 Git 仓库
git log # 检查日志
git filter-repo --path test --force --invert-paths # 删除包含 test 的历史
git log # 检查结果：无 commit 提交
ls -a # 没有文件 test
```

以上命令行中的演示，是使用 `git filter-repo`
移除文件的过程，谨记：不要直接在生产环境或重要仓库使用，要先确保自己知道某个命令的执行结果。

[^fn:1]: <https://stackoverflow.com/a/52643437>
[^fn:2]: <https://github.com/newren/git-filter-repo>