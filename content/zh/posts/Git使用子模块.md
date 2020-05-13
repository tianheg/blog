---
title: Git - 使用子模块
date: 2020-05-10T18:59:25+08:00
tags: []
categories: ["技术"]
series: ["Git"]
slug: Git use submodule
keywords: ["Git","submodule"]
description: ""
---

## git-submodule(1) Manual Page

NAME
git-submodule - Initialize, update or inspect submodules

SYNOPSIS
git submodule [--quiet] [--cached]
git submodule [--quiet] add [<options>] [--] <repository> [<path>]
git submodule [--quiet] status [--cached] [--recursive] [--] [<path>…​]
git submodule [--quiet] init [--] [<path>…​]
git submodule [--quiet] deinit [-f|--force] (--all|[--] <path>…​)
git submodule [--quiet] update [<options>] [--] [<path>…​]
git submodule [--quiet] set-branch [<options>] [--] <path>
git submodule [--quiet] set-url [--] <path> <newurl>
git submodule [--quiet] summary [<options>] [--] [<path>…​]
git submodule [--quiet] foreach [--recursive] <command>
git submodule [--quiet] sync [--recursive] [--] [<path>…​]
git submodule [--quiet] absorbgitdirs [--] [<path>…​]
DESCRIPTION
Inspects, updates and manages submodules.

For more information about submodules, see gitsubmodules(7).

COMMANDS
With no arguments, shows the status of existing submodules. Several subcommands are available to perform operations on the submodules.

add [-b <branch>] [-f|--force] [--name <name>] [--reference <repository>] [--depth <depth>] [--] <repository> [<path>]
Add the given repository as a submodule at the given path to the changeset to be committed next to the current project: the current project is termed the "superproject".

<repository> is the URL of the new submodule’s origin repository. This may be either an absolute URL, or (if it begins with ./ or ../), the location relative to the superproject’s default remote repository (Please note that to specify a repository foo.git which is located right next to a superproject bar.git, you’ll have to use ../foo.git instead of ./foo.git - as one might expect when following the rules for relative URLs - because the evaluation of relative URLs in Git is identical to that of relative directories).

The default remote is the remote of the remote-tracking branch of the current branch. If no such remote-tracking branch exists or the HEAD is detached, "origin" is assumed to be the default remote. If the superproject doesn’t have a default remote configured the superproject is its own authoritative upstream and the current working directory is used instead.

The optional argument <path> is the relative location for the cloned submodule to exist in the superproject. If <path> is not given, the canonical part of the source repository is used ("repo" for "/path/to/repo.git" and "foo" for "host.xz:foo/.git"). If <path> exists and is already a valid Git repository, then it is staged for commit without cloning. The <path> is also used as the submodule’s logical name in its configuration entries unless --name is used to specify a logical name.

The given URL is recorded into .gitmodules for use by subsequent users cloning the superproject. If the URL is given relative to the superproject’s repository, the presumption is the superproject and submodule repositories will be kept together in the same relative location, and only the superproject’s URL needs to be provided. git-submodule will correctly locate the submodule using the relative URL in .gitmodules.

status [--cached] [--recursive] [--] [<path>…​]
Show the status of the submodules. This will print the SHA-1 of the currently checked out commit for each submodule, along with the submodule path and the output of git describe for the SHA-1. Each SHA-1 will possibly be prefixed with - if the submodule is not initialized, + if the currently checked out submodule commit does not match the SHA-1 found in the index of the containing repository and U if the submodule has merge conflicts.

If --cached is specified, this command will instead print the SHA-1 recorded in the superproject for each submodule.

If --recursive is specified, this command will recurse into nested submodules, and show their status as well.

If you are only interested in changes of the currently initialized submodules with respect to the commit recorded in the index or the HEAD, git-status(1) and git-diff(1) will provide that information too (and can also report changes to a submodule’s work tree).

init [--] [<path>…​]
Initialize the submodules recorded in the index (which were added and committed elsewhere) by setting submodule.$name.url in .git/config. It uses the same setting from .gitmodules as a template. If the URL is relative, it will be resolved using the default remote. If there is no default remote, the current repository will be assumed to be upstream.

Optional <path> arguments limit which submodules will be initialized. If no path is specified and submodule.active has been configured, submodules configured to be active will be initialized, otherwise all submodules are initialized.

When present, it will also copy the value of submodule.$name.update. This command does not alter existing information in .git/config. You can then customize the submodule clone URLs in .git/config for your local setup and proceed to git submodule update; you can also just use git submodule update --init without the explicit init step if you do not intend to customize any submodule locations.

See the add subcommand for the definition of default remote.

deinit [-f|--force] (--all|[--] <path>…​)
Unregister the given submodules, i.e. remove the whole submodule.$name section from .git/config together with their work tree. Further calls to git submodule update, git submodule foreach and git submodule sync will skip any unregistered submodules until they are initialized again, so use this command if you don’t want to have a local checkout of the submodule in your working tree anymore.

When the command is run without pathspec, it errors out, instead of deinit-ing everything, to prevent mistakes.

If --force is specified, the submodule’s working tree will be removed even if it contains local modifications.

If you really want to remove a submodule from the repository and commit that use git-rm(1) instead. See gitsubmodules(7) for removal options.

update [--init] [--remote] [-N|--no-fetch] [--[no-]recommend-shallow] [-f|--force] [--checkout|--rebase|--merge] [--reference <repository>] [--depth <depth>] [--recursive] [--jobs <n>] [--[no-]single-branch] [--] [<path>…​]
Update the registered submodules to match what the superproject expects by cloning missing submodules, fetching missing commits in submodules and updating the working tree of the submodules. The "updating" can be done in several ways depending on command line options and the value of submodule.<name>.update configuration variable. The command line option takes precedence over the configuration variable. If neither is given, a checkout is performed. The update procedures supported both from the command line as well as through the submodule.<name>.update configuration are:

checkout
the commit recorded in the superproject will be checked out in the submodule on a detached HEAD.

If --force is specified, the submodule will be checked out (using git checkout --force), even if the commit specified in the index of the containing repository already matches the commit checked out in the submodule.

rebase
the current branch of the submodule will be rebased onto the commit recorded in the superproject.

merge
the commit recorded in the superproject will be merged into the current branch in the submodule.

The following update procedures are only available via the submodule.<name>.update configuration variable:

custom command
arbitrary shell command that takes a single argument (the sha1 of the commit recorded in the superproject) is executed. When submodule.<name>.update is set to !command, the remainder after the exclamation mark is the custom command.

none
the submodule is not updated.

If the submodule is not yet initialized, and you just want to use the setting as stored in .gitmodules, you can automatically initialize the submodule with the --init option.

If --recursive is specified, this command will recurse into the registered submodules, and update any nested submodules within.

set-branch (-b|--branch) <branch> [--] <path>
set-branch (-d|--default) [--] <path>
Sets the default remote tracking branch for the submodule. The --branch option allows the remote branch to be specified. The --default option removes the submodule.<name>.branch configuration key, which causes the tracking branch to default to master.

set-url [--] <path> <newurl>
Sets the URL of the specified submodule to <newurl>. Then, it will automatically synchronize the submodule’s new remote URL configuration.

summary [--cached|--files] [(-n|--summary-limit) <n>] [commit] [--] [<path>…​]
Show commit summary between the given commit (defaults to HEAD) and working tree/index. For a submodule in question, a series of commits in the submodule between the given super project commit and the index or working tree (switched by --cached) are shown. If the option --files is given, show the series of commits in the submodule between the index of the super project and the working tree of the submodule (this option doesn’t allow to use the --cached option or to provide an explicit commit).

Using the --submodule=log option with git-diff(1) will provide that information too.

foreach [--recursive] <command>
Evaluates an arbitrary shell command in each checked out submodule. The command has access to the variables $name, $sm_path, $displaypath, $sha1 and $toplevel: $name is the name of the relevant submodule section in .gitmodules, $sm_path is the path of the submodule as recorded in the immediate superproject, $displaypath contains the relative path from the current working directory to the submodules root directory, $sha1 is the commit as recorded in the immediate superproject, and $toplevel is the absolute path to the top-level of the immediate superproject. Note that to avoid conflicts with $PATH on Windows, the $path variable is now a deprecated synonym of $sm_path variable. Any submodules defined in the superproject but not checked out are ignored by this command. Unless given --quiet, foreach prints the name of each submodule before evaluating the command. If --recursive is given, submodules are traversed recursively (i.e. the given shell command is evaluated in nested submodules as well). A non-zero return from the command in any submodule causes the processing to terminate. This can be overridden by adding || : to the end of the command.

As an example, the command below will show the path and currently checked out commit for each submodule:

git submodule foreach 'echo $sm_path `git rev-parse HEAD`'
sync [--recursive] [--] [<path>…​]
Synchronizes submodules' remote URL configuration setting to the value specified in .gitmodules. It will only affect those submodules which already have a URL entry in .git/config (that is the case when they are initialized or freshly added). This is useful when submodule URLs change upstream and you need to update your local repositories accordingly.

git submodule sync synchronizes all submodules while git submodule sync -- A synchronizes submodule "A" only.

If --recursive is specified, this command will recurse into the registered submodules, and sync any nested submodules within.

absorbgitdirs
If a git directory of a submodule is inside the submodule, move the git directory of the submodule into its superproject’s $GIT_DIR/modules path and then connect the git directory and its working directory by setting the core.worktree and adding a .git file pointing to the git directory embedded in the superprojects git directory.

A repository that was cloned independently and later added as a submodule or old setups have the submodules git directory inside the submodule instead of embedded into the superprojects git directory.

This command is recursive by default.

OPTIONS
-q
--quiet
Only print error messages.

--progress
This option is only valid for add and update commands. Progress status is reported on the standard error stream by default when it is attached to a terminal, unless -q is specified. This flag forces progress status even if the standard error stream is not directed to a terminal.

--all
This option is only valid for the deinit command. Unregister all submodules in the working tree.

-b <branch>
--branch <branch>
Branch of repository to add as submodule. The name of the branch is recorded as submodule.<name>.branch in .gitmodules for update --remote. A special value of . is used to indicate that the name of the branch in the submodule should be the same name as the current branch in the current repository. If the option is not specified, it defaults to master.

-f
--force
This option is only valid for add, deinit and update commands. When running add, allow adding an otherwise ignored submodule path. When running deinit the submodule working trees will be removed even if they contain local changes. When running update (only effective with the checkout procedure), throw away local changes in submodules when switching to a different commit; and always run a checkout operation in the submodule, even if the commit listed in the index of the containing repository matches the commit checked out in the submodule.

--cached
This option is only valid for status and summary commands. These commands typically use the commit found in the submodule HEAD, but with this option, the commit stored in the index is used instead.

--files
This option is only valid for the summary command. This command compares the commit in the index with that in the submodule HEAD when this option is used.

-n
--summary-limit
This option is only valid for the summary command. Limit the summary size (number of commits shown in total). Giving 0 will disable the summary; a negative number means unlimited (the default). This limit only applies to modified submodules. The size is always limited to 1 for added/deleted/typechanged submodules.

--remote
This option is only valid for the update command. Instead of using the superproject’s recorded SHA-1 to update the submodule, use the status of the submodule’s remote-tracking branch. The remote used is branch’s remote (branch.<name>.remote), defaulting to origin. The remote branch used defaults to master, but the branch name may be overridden by setting the submodule.<name>.branch option in either .gitmodules or .git/config (with .git/config taking precedence).

This works for any of the supported update procedures (--checkout, --rebase, etc.). The only change is the source of the target SHA-1. For example, submodule update --remote --merge will merge upstream submodule changes into the submodules, while submodule update --merge will merge superproject gitlink changes into the submodules.

In order to ensure a current tracking branch state, update --remote fetches the submodule’s remote repository before calculating the SHA-1. If you don’t want to fetch, you should use submodule update --remote --no-fetch.

Use this option to integrate changes from the upstream subproject with your submodule’s current HEAD. Alternatively, you can run git pull from the submodule, which is equivalent except for the remote branch name: update --remote uses the default upstream repository and submodule.<name>.branch, while git pull uses the submodule’s branch.<name>.merge. Prefer submodule.<name>.branch if you want to distribute the default upstream branch with the superproject and branch.<name>.merge if you want a more native feel while working in the submodule itself.

-N
--no-fetch
This option is only valid for the update command. Don’t fetch new objects from the remote site.

--checkout
This option is only valid for the update command. Checkout the commit recorded in the superproject on a detached HEAD in the submodule. This is the default behavior, the main use of this option is to override submodule.$name.update when set to a value other than checkout. If the key submodule.$name.update is either not explicitly set or set to checkout, this option is implicit.

--merge
This option is only valid for the update command. Merge the commit recorded in the superproject into the current branch of the submodule. If this option is given, the submodule’s HEAD will not be detached. If a merge failure prevents this process, you will have to resolve the resulting conflicts within the submodule with the usual conflict resolution tools. If the key submodule.$name.update is set to merge, this option is implicit.

--rebase
This option is only valid for the update command. Rebase the current branch onto the commit recorded in the superproject. If this option is given, the submodule’s HEAD will not be detached. If a merge failure prevents this process, you will have to resolve these failures with git-rebase(1). If the key submodule.$name.update is set to rebase, this option is implicit.

--init
This option is only valid for the update command. Initialize all submodules for which "git submodule init" has not been called so far before updating.

--name
This option is only valid for the add command. It sets the submodule’s name to the given string instead of defaulting to its path. The name must be valid as a directory name and may not end with a /.

--reference <repository>
This option is only valid for add and update commands. These commands sometimes need to clone a remote repository. In this case, this option will be passed to the git-clone(1) command.

NOTE: Do not use this option unless you have read the note for git-clone(1)'s --reference, --shared, and --dissociate options carefully.

--dissociate
This option is only valid for add and update commands. These commands sometimes need to clone a remote repository. In this case, this option will be passed to the git-clone(1) command.

NOTE: see the NOTE for the --reference option.

--recursive
This option is only valid for foreach, update, status and sync commands. Traverse submodules recursively. The operation is performed not only in the submodules of the current repo, but also in any nested submodules inside those submodules (and so on).

--depth
This option is valid for add and update commands. Create a shallow clone with a history truncated to the specified number of revisions. See git-clone(1)

--[no-]recommend-shallow
This option is only valid for the update command. The initial clone of a submodule will use the recommended submodule.<name>.shallow as provided by the .gitmodules file by default. To ignore the suggestions use --no-recommend-shallow.

-j <n>
--jobs <n>
This option is only valid for the update command. Clone new submodules in parallel with as many jobs. Defaults to the submodule.fetchJobs option.

--[no-]single-branch
This option is only valid for the update command. Clone only one branch during update: HEAD or one specified by --branch.

<path>…​
Paths to submodule(s). When specified this will restrict the command to only operate on the submodules found at the specified paths. (This argument is required with add).

FILES
When initializing submodules, a .gitmodules file in the top-level directory of the containing repository is used to find the url of each submodule. This file should be formatted in the same way as $GIT_DIR/config. The key to each submodule url is "submodule.$name.url". See gitmodules(5) for details.

SEE ALSO
gitsubmodules(7), gitmodules(5).

GIT
Part of the git(1) suite

Last updated 2020-04-20 15:34:01 UTC

## git submodule add -b master https://github.com/USERNAME/USERNAME.github.io.git public 

This creates a git submodule. Now when you run the hugo command to build your site to public, the created public directory will have a different remote origin (i.e. hosted GitHub repository).

## git submodule update --init --recursive

更新子模块

## 待整理gitsubmodule相关链接

https://blog.csdn.net/guotianqing/article/details/82391665

## git中submodule子模块的添加、使用和删除

### 背景

项目中经常使用别人维护的模块，在git中使用子模块的功能能够大大提高开发效率。

使用子模块后，不必负责子模块的维护，只需要在必要的时候同步更新子模块即可。

### 子模块的添加

添加子模块非常简单，命令如下：
```
git submodule add <url> <path>
```
其中，url为子模块的路径，path为该子模块存储的目录路径。

执行成功后，git status会看到项目中修改了.gitmodules，并增加了一个新文件（为刚刚添加的路径）

`git diff --cached`查看修改内容可以看到增加了子模块，并且新文件下为子模块的提交hash摘要

`git commit`提交即完成子模块的添加

### 子模块的使用

克隆项目后，默认子模块目录下无任何内容。需要在项目根目录执行如下命令完成子模块的下载：
```
git submodule init
git submodule update
```
或：
```
git submodule update --init --recursive
```

执行后，子模块目录下就有了源码，再执行相应的makefile即可。

### 子模块的更新

子模块的维护者提交了更新后，使用子模块的项目必须手动更新才能包含最新的提交。

在项目中，进入到子模块目录下，执行 `git pull`更新，查看`git log`查看相应提交。

完成后返回到项目目录，可以看到子模块有待提交的更新，使用`git add`，提交即可。

### 删除子模块

有时子模块的项目维护地址发生了变化，或者需要替换子模块，就需要删除原有的子模块。

删除子模块较复杂，步骤如下：

1. `rm -rf 子模块目录` 删除子模块目录及源码
2. `vi .gitmodules` 删除项目目录下.gitmodules文件中子模块相关条目
3. `vi .git/config` 删除配置项中子模块相关条目
4. `rm .git/module/*` 删除模块下的子模块目录，每个子模块对应一个目录，注意只删除对应的子模块目录即可

---

执行完成后，再执行添加子模块命令即可，如果仍然报错，执行如下：

```
git rm --cached 子模块名称
```

完成删除后，提交到仓库即可。

## 发布子模块改动

现在我们的子模块目录中有一些改动。 其中有一些是我们通过更新从上游引入的，而另一些是本地生成的，由于我们还没有推送它们，所以对任何其他人都不可用。
```bash
$ git diff
Submodule DbConnector c87d55d..82d2ad3:
  > Merge from origin/stable
  > updated setup script
  > unicode support
  > remove unnecessary method
  > add new option for conn pooling
```

如果我们在主项目中提交并推送但并不推送子模块上的改动，其他尝试检出我们修改的人会遇到麻烦， 因为他们无法得到依赖的子模块改动。那些改动只存在于我们本地的拷贝中。

为了确保这不会发生，你可以让 Git 在推送到主项目前检查所有子模块是否已推送。 `git push` 命令接受可以设置为 “check” 或 “on-demand” 的 `--recurse-submodules` 参数。 如果任何提交的子模块改动没有推送那么 “check” 选项会直接使 `push` 操作失败。
```bash
$ git push --recurse-submodules=check
The following submodule paths contain changes that can
not be found on any remote:
  DbConnector

Please try

	git push --recurse-submodules=on-demand

or cd to the path and use

	git push

to push them to a remote.
```
如你所见，它也给我们了一些有用的建议，指导接下来该如何做。 最简单的选项是进入每一个子模块中然后手动推送到远程仓库，确保它们能被外部访问到，之后再次尝试这次推送。 如果你想要对所有推送都执行检查，那么可以通过设置 `git config push.recurseSubmodules check` 让它成为默认行为。

另一个选项是使用 “on-demand” 值，它会尝试为你这样做。
```bash
$ git push --recurse-submodules=on-demand
Pushing submodule 'DbConnector'
Counting objects: 9, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (8/8), done.
Writing objects: 100% (9/9), 917 bytes | 0 bytes/s, done.
Total 9 (delta 3), reused 0 (delta 0)
To https://github.com/chaconinc/DbConnector
   c75e92a..82d2ad3  stable -> stable
Counting objects: 2, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 266 bytes | 0 bytes/s, done.
Total 2 (delta 1), reused 0 (delta 0)
To https://github.com/chaconinc/MainProject
   3d6d338..9a377d1  master -> master
```
如你所见，Git 进入到 DbConnector 模块中然后在推送主项目前推送了它。 如果那个子模块因为某些原因推送失败，主项目也会推送失败。 你也可以通过设置 `git config push.recurseSubmodules on-demand` 让它成为默认行为。

## 合并子模块改动

如果你其他人同时改动了一个子模块引用，那么可能会遇到一些问题。 也就是说，如果子模块的历史已经分叉并且在父项目中分别提交到了分叉的分支上，那么你需要做一些工作来修复它。

如果一个提交是另一个的直接祖先（一个快进式合并），那么 Git 会简单地选择之后的提交来合并，这样没什么问题。

不过，Git 甚至不会尝试去进行一次简单的合并。 如果子模块提交已经分叉且需要合并，那你会得到类似下面的信息：
```bash
$ git pull
remote: Counting objects: 2, done.
remote: Compressing objects: 100% (1/1), done.
remote: Total 2 (delta 1), reused 2 (delta 1)
Unpacking objects: 100% (2/2), done.
From https://github.com/chaconinc/MainProject
   9a377d1..eb974f8  master     -> origin/master
Fetching submodule DbConnector
warning: Failed to merge submodule DbConnector (merge following commits not found)
Auto-merging DbConnector
CONFLICT (submodule): Merge conflict in DbConnector
Automatic merge failed; fix conflicts and then commit the result.
```
所以本质上 Git 在这里指出了子模块历史中的两个分支记录点已经分叉并且需要合并。 它将其解释为 “merge following commits not found” （未找到接下来需要合并的提交），虽然这有点令人困惑，不过之后我们会解释为什么是这样。

为了解决这个问题，你需要弄清楚子模块应该处于哪种状态。 奇怪的是，Git 并不会给你多少能帮你摆脱困境的信息，甚至连两边提交历史中的 SHA-1 值都没有。 幸运的是，这很容易解决。 如果你运行 `git diff`，就会得到试图合并的两个分支中记录的提交的 SHA-1 值。
```bash
$ git diff
diff --cc DbConnector
index eb41d76,c771610..0000000
--- a/DbConnector
+++ b/DbConnector
```
所以，在本例中，`eb41d76` 是我们的子模块中大家共有的提交，而 `c771610` 是上游拥有的提交。 如果我们进入子模块目录中，它应该已经在 `eb41d76` 上了，因为合并没有动过它。 如果不是的话，无论什么原因，你都可以简单地创建并检出一个指向它的分支。

来自另一边的提交的 SHA-1 值比较重要。 它是需要你来合并解决的。 你可以尝试直接通过 SHA-1 合并，也可以为它创建一个分支然后尝试合并。 我们建议后者，哪怕只是为了一个更漂亮的合并提交信息。

所以，我们将会进入子模块目录，基于 `git diff` 的第二个 SHA-1 创建一个分支然后手动合并。
```bash
$ cd DbConnector

$ git rev-parse HEAD
eb41d764bccf88be77aced643c13a7fa86714135

$ git branch try-merge c771610
(DbConnector) $ git merge try-merge
Auto-merging src/main.c
CONFLICT (content): Merge conflict in src/main.c
Recorded preimage for 'src/main.c'
Automatic merge failed; fix conflicts and then commit the result.
```
我们在这儿得到了一个真正的合并冲突，所以如果想要解决并提交它，那么只需简单地通过结果来更新主项目。
```
$ vim src/main.c (1)
$ git add src/main.c
$ git commit -am 'merged our changes'
Recorded resolution for 'src/main.c'.
[master 9fd905e] merged our changes

$ cd .. (2)
$ git diff (3)
diff --cc DbConnector
index eb41d76,c771610..0000000
--- a/DbConnector
+++ b/DbConnector
@@@ -1,1 -1,1 +1,1 @@@
- Subproject commit eb41d764bccf88be77aced643c13a7fa86714135
 -Subproject commit c77161012afbbe1f58b5053316ead08f4b7e6d1d
++Subproject commit 9fd905e5d7f45a0d4cbc43d1ee550f16a30e825a
$ git add DbConnector (4)

$ git commit -m "Merge Tom's Changes" (5)
[master 10d2c60] Merge Tom's Changes
```

1. 首先解决冲突
2. 然后返回到主项目目录中
3. 再次检查 SHA-1 值
4. 解决冲突的子模块记录
5. 提交我们的合并

这可能会让你有点儿困惑，但它确实不难。

有趣的是，Git 还能处理另一种情况。 如果子模块目录中存在着这样一个合并提交，它的历史中包含了的两边的提交，那么 Git 会建议你将它作为一个可行的解决方案。 它看到有人在子模块项目的某一点上合并了包含这两次提交的分支，所以你可能想要那个。

这就是为什么前面的错误信息是 “merge following commits not found”，因为它不能 **这样** 做。 它让人困惑是因为**谁能想到它会尝试这样做**？

如果它找到了一个可以接受的合并提交，你会看到类似下面的信息：
```bash
$ git merge origin/master
warning: Failed to merge submodule DbConnector (not fast-forward)
Found a possible merge resolution for the submodule:
 9fd905e5d7f45a0d4cbc43d1ee550f16a30e825a: > merged our changes
If this is correct simply add it to the index for example
by using:

  git update-index --cacheinfo 160000 9fd905e5d7f45a0d4cbc43d1ee550f16a30e825a "DbConnector"

which will accept this suggestion.
Auto-merging DbConnector
CONFLICT (submodule): Merge conflict in DbConnector
Automatic merge failed; fix conflicts and then commit the result.
```
Git 建议的命令是更新索引，就像你运行了 `git add` 那样，这样会清除冲突然后提交。 不过你可能不应该这样做。你可以轻松地进入子模块目录，查看差异是什么，快进到这次提交，恰当地测试，然后提交它。
```bash
$ cd DbConnector/
$ git merge 9fd905e
Updating eb41d76..9fd905e
Fast-forward

$ cd ..
$ git add DbConnector
$ git commit -am 'Fast forwarded to a common submodule child'
```
这些命令完成了同一件事，但是通过这种方式你至少可以验证工作是否有效，以及当你在完成时可以确保子模块目录中有你的代码。