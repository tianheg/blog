+++
title = "Git tag,branch,submodule 基本使用"
date = 2021-11-13T00:00:00+08:00
lastmod = 2022-04-27T16:06:54+08:00
tags = ["技术", "Git"]
draft = false
+++

## Tag[^fn:1],[^fn:2] {#tag}

```sh
git tag <tag-name> # create local tag
git tag -d <tag-name> # delete local tag
git push origin :refs/tags/<tag-name> # delete remote tag
git fsck --unreachable | grep tag && git update-ref refs/tags/<tag_name> <hash> # recover a deleted tag

git describe --tags --abbrev=0 # show the most recent tag on the current branch
git tag --contains <commitid> # find all tags containing a specific commit
```

## Branch {#branch}

分支不能含空格，见这里[^fn:3]。

### 本地和远程创建空分支[^fn:4] {#本地和远程创建空分支}

```sh
# UPDATE(git > 2.27)
git switch --orphan <new branch>
git commit --allow-empty -m "Initial commit on orphan branch"
git push -u origin <new branch>

## Old Way

# local
git checkout --orphan empty-branch
git rm -rf .
# remote
git commit --allow-empty -m "root commit"
git push origin empty-branch
```

### 本地和远程删除分支 {#本地和远程删除分支}

```sh
# delete branch locally
git branch -d localBranchName
# delete a local branch that has not been merged to the current branch or an upstream
git branch -D localBranchName

# delete branch remotely
git push origin --delete remoteBranchName
# same as
git push origin :remoteBranchName

# delete multiple branches
git branch | grep 'fix/' | xargs git branch -d

# rename current branch
git branch -m new-name
# rename a different(local) branch
git branch -m old-name new-name

# delete the old-name remote branch and push the new-name local branch
git push origin :old_name new_name
```

### 克隆特定远程分支 {#克隆特定远程分支}

```sh
git clone --branch <branchname> <remote-repo-url>
```

### 删除仅存在本地（远程仓库中不存在）的分支 {#删除仅存在本地-远程仓库中不存在-的分支}

```sh
$ git branch -a
* main

  remotes/origin/articles-main
  remotes/origin/gh-pages
  remotes/origin/main

# remote branch articles-main, gh-pages has been deleted
$ git remote prune origin
Pruning origin
URL: git@github.com:tianheg/wiki.git

* [pruned] origin/articles-main
* [pruned] origin/gh-pages
```

Others:

```sh
git branch # list local branches
git branch -r # list remote branches
git branch -a # list local and remote branches
git checkout -b <branch> <SHA1_OF_COMMIT> # create a branch from a commit
```

## Submodule {#submodule}

```sh
# clone all submodules
git clone --recursive git://github.com/foo/bar.git
# already cloned
git submodule update --init --recursive
```

### 移除 Submodule {#移除-submodule}

```sh
git submodule deinit submodulename
git rm submodulename
git rm --cached submodulename
rm -rf .git/modules/submodulename
```

[^fn:1]: <https://github.com/git-tips/tips#create-local-tag>
[^fn:2]: <https://github.com/k88hudson/git-flight-rules>
[^fn:3]: <https://stackoverflow.com/a/6619113>
[^fn:4]: <https://stackoverflow.com/a/34100189>