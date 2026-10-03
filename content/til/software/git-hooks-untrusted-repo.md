---
title: '陌生仓库的 .git/hooks：检出即执行'
status: draft
date: 2026-10-03T21:19:55+08:00
header: Git
---

把「别人的仓库」拿到本地看代码，本身是个可被利用的执行面 —— 不用你跑任何东西，
一次 `git checkout` 就够了。

## 先分清两种「拿到仓库」

- **`git clone`（走 URL / SSH）** —— hooks 与本地配置**不参与传输**。本地 `.git/hooks/`
  只会由 init 模板生成 `*.sample` 占位。纯 clone 是安全的。
- **拿到现成的 `.git` 目录** —— 压缩包、共享盘/网盘链接、`git bundle` 解出来的树、
  别人直接发整个项目文件夹。这种 `.git/hooks/` 是**对方写的真文件**，`.git/config` 也是对方写的。
  危险全在这一类。

所以「客户发来个 Dropbox 链接让你看看项目」和「`git clone` 一个开源库」不是同一件事。

## 执行的触发点

hook 在 Git 的对应动作发生时被自动执行，不需要额外确认：

- `post-checkout` —— `git checkout <branch>`、`git switch`、`git worktree`、
  以及 clone 的本地检出阶段
- `pre-commit` / `commit-msg` —— 提交时
- `pre-push` —— 推送时
- `post-merge` —— 合并 / `git pull` 后

「我只是切个分支看看」等于执行。真实案例里，诱饵正是「NDA 在 xxx 分支，切过去填一下」。

还有一条更隐蔽的：`.git/config` 里的 `core.hooksPath` 可以把 hook 目录指到仓库内任意路径，
于是 hook 不必待在 `.git/hooks/` 里，看起来像普通脚本文件。

## 拿到现成仓库先跑这几条

```bash
D=<收到的目录>

# 1. 有没有真 hook（非 *.sample）
find "$D/.git/hooks" -type f ! -name '*.sample' -print -exec head -40 {} \;

# 2. hooksPath 被改写没有
git -C "$D" config --local --list | grep -i hookspath

# 3. 本地配置里其它可疑项（别名、sshCommand、fsmonitor、remote helper）
git -C "$D" config --local --list

# 4. .git 下的可执行文件扫一眼
find "$D/.git" -type f -perm -u+x
```

非 `*.sample` 的 hook 文件一律先读完再决定，默认当恶意对待。

## 要动手时的切断方式

```bash
# 一次性把 hook 目录指向空目录，不改仓库里的任何文件
git -c core.hooksPath=/dev/null -C "$D" checkout <branch>
```

- `--no-verify` 只影响 `pre-commit` / `commit-msg` / `pre-push`，**管不到 `post-checkout`**
- 只读浏览根本不用检出：`git show <ref>:<path>`、`git ls-tree -r <ref>` 就够
- 真要跑代码，放隔离的虚拟机 / 容器里跑，别在主力机器上

## 边界：这是「接收代码」那一跳

`npm install` 的 postinstall、`make`、`pip install .`、`docker build` 是另一类风险面
（引入依赖时的供应链），这套检查覆盖不到。已经误执行过 hook 的，按凭据盘点的思路
先列一份 key / token 指纹清单（SSH key、托管平台 token、云 CLI 会话），再决定轮换范围。

来源: [I got targeted](https://frankwiles.com/posts/i-got-targeted/)
