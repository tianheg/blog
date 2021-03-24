---
title: "命令"
date: 2020-05-10T19:05:18+08:00
description: "汇总常用 Git 指令"
tags: ["Git"]
keywords: ["Git"]
---

## 命令

git checkout -- file  丢弃工作区的修改，让文件回到最近一次 git commit 或 git add 的状态

git checkout <branch> 切换到另一分支

git reset HEAD <file> unstage the stage 撤销暂存区的修改

git log --pretty=oneline 从最近到最远的 3 次提交日志

git reset --hard HEAD^ 回到最近的一次提交版本

…… HEAD^^ 回到最近的第二次提交版本

…… HEAD~100 回到最近的第 100 次提交版本

…… commit id 回到该 id 号对应的版本

git add <file> 从工作区添加到暂存区;git rm <file> 将工作区中的删除添加到暂存区

git commit -m "explain" 将暂存区的改动合并到版本库的分支中

rm <file> 直接删除工作区的内容

## 通过 SSH 连接仓库的 Wiki

```text
git remote set-url origin git@github.com:YourName/YourRepoName.wiki.git
```

To do that, we can avoid input the name and password when pushing.

## 移除 hexo 远程库后无法推送 hugo 相关仓库

问题：

```bash
D:\Hugo\Sites\blog>git push origin master
To github.com:Gaotianhe/Gaotianhe.github.io.git
 ! [rejected]          master -> master (non-fast-forward)
error: failed to push some refs to 'git@github.com:Gaotianhe/Gaotianhe.github.io.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.

D:\Hugo\Sites\blog>git pull
There is no tracking information for the current branch.
Please specify which branch you want to merge with.
See git-pull(1) for details.

    git pull <remote> <branch>

If you wish to set tracking information for this branch you can do so with:

    git branch --set-upstream-to=origin/<branch> master


D:\Hugo\Sites\blog>
```

## 强制推送到远程仓库

1. ```bash
   git push -f origin master
   ```

   将本地回退后的仓库推送至远程仓库时，会覆盖远程仓库之前的所有内容

2. ```bash
   git pull --rebase origin master
   git push origin master
   ```

   先把本地文件覆盖，再推送至远程

## git branch --set-upstream 本地关联远程分支

从别人的远程库 pull 时出现以下信息：

```bash
λ git pull
There is no tracking information for the current branch.
Please specify which branch you want to merge with.
See git-pull(1) for details.

    git pull <remote> <branch>

If you wish to set tracking information for this branch you can do so with:

    git branch --set-upstream-to=origin/<branch> master
```

在本地新建分支时，要和远程库关联。关联目的是在执行 git pull, git push 操作时就不需要指定对应的远程分支，你只要没有显示指定，git pull 的时候，就会提示你

解决方法就是按照提示添加一下：

git branch --set-upstream-to=origin/remote_branch  your_branch

其中，origin/remote_branch 是你本地分支对应的远程分支；your_branch 是你当前的本地分支。

## git pull 后出现：fatal: refusing to merge unrelated histories

如果合并了两个不同的开始提交的仓库，在新的 git 会发现这两个仓库可能不是同一个，为了防止开发者上传错误，于是就给下面的提示

`fatal: refusing to merge unrelated histories`

## 修改已经提交的 commit 内容

通过 `git rebase -i` 进行分支管理

查看提交历史：`git log --oneline -10`

编辑提交的历史（commit）：`git rebase -i commit-id`

---

### 一.修改最近一次提交

这是最常见的一种场景，往往刚刚提交后最容易发现问题。

#### 方法一：用 commit –amend

这种方法不仅可以修改 commit message，也可以修改提交内容。这种方式在还没有推送到远端的情况下可以比较方便的保持原有的 Change-Id，推荐使用（若已经推送到远端，Change-Id 则会修改掉）。

```bash
#修改需要修改的地方（只是修改commit message就不用做)
git add .  #这一步如果只是修改commit message不用输入
git commit --amend
#输入修改后的commit message，保存
git push <remote> <branch> -f #若还没有推送到远端，不用输入
```

#### 方法二：用 reset 后修改

这种方法与上面方法基本一致，也可以修改提交内容和 commit message。这种方式在还没有推送到远端的情况下也可以比较方便的保持原有的 Change-Id，（若已经推送到远端，Change-Id 则会修改掉）。

```bash
git reset HEAD^
#修改需要修改的地方（只是修改commit message就不用做)
git add . #这一步如果只是修改commit message不用输入
git commit -m "new commit message" #或者git commit -c ORIG_HEAD
git push <remote> <branch> -f #若还没有推送到远端，不用输入
```

#### 方法三：提交到了错误的分支上的处理

```bash
# 取消最新的提交，然后保留现场原状
git reset HEAD~ --soft
git stash
```

```bash
# 切换到正确的分支
git checkout name-of-the-correct-branch
git stash pop
git add .    # 或添加特定文件
git commit -m "你的提交说明"
# 现在你已经提交到正确的分支上了
```

遇到这种情况，很多人会说用 cherry-pick(摘樱桃)，像下面这样。不过你自己看吧，哪个舒服用哪个。

```bash
git checkout name-of-the-correct-branch
# 把主分支上的最新提交摘过来，嘻嘻～～
git cherry-pick master
# 再删掉主分支上的最新提交
git checkout master
git reset HEAD~ --hard
```

### 二.修改很久之前的一次提交

1.查看修改

```bash
git rebase -i master~1 #最后一次
git rebase -i master~5 #最后五次
git rebase -i HEAD~3   #当前版本的倒数第三次状态
git rebase -i 32e0a87f #指定的SHA位置
```

2.显示结果如下，修改 pick 为 edit ，并 :wq 保存退出

```bash
pick 92b495b 2009-08-08: ×××××××

# Rebase 9ef2b1f..92b495b onto 9ef2b1f
#
# Commands:
#  pick = use commit
#  edit = use commit, but stop for amending //改上面的 pick 为 edit
#  squash = use commit, but meld into previous commit
#
# If you remove a line here THAT COMMIT WILL BE LOST.
# However, if you remove everything, the rebase will be aborted.
#
```

3.命令行显示：

```bash
Stopped at e35b8f3… reflog branch first commit
You can amend the commit now, with

git commit –amend

Once you are satisfied with your changes, run

git rebase –continue
```

```bash
#修改需要修改的地方（只是修改commit message就不用做)
git add . #这一步如果只是修改commit message不用输入
git commit --amend 
#输入修改后的commit message，保存
```

4.使用 git rebase –continue 完成操作

```bash
git rebase --continue
```

5.推送到远端（若还没有推送到远端，不用处理）

```bash
git push <remote> <branch> -f
```
