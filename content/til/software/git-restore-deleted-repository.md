---
title: 'Git 仓库被删后的找回路径'
status: draft
date: 2026-09-20T02:21:37+08:00
header: Git
---

自删的 GitHub 仓库不会立刻消失，但窗口只有 90 天。过期之后，唯一能指望的是**另一份带 `.git` 的副本** —— 只有文件不算。

## 第一步：确认还能不能恢复

- 入口：`github.com/settings/repositories` 页面里的 **Deleted repositories** → Restore
- 删除后约 1 小时才会出现在这个列表里
- 超过 90 天永久清除
- 例外：仓库属于**非空的 fork network**（有人 fork 过且那些 fork 还在）时，网页自助恢复会被拒，只能找 GitHub Support —— 而这条路径要求账号是付费计划
- 恢复内容不含 release 附件与 team 权限

## 第二步：排查还有没有第二份历史

按成本从低到高：

1. **任意一台机器上的 clone** —— 关键是里面有 `.git`，光文件一样不算
2. **备份归档**（tar / zip / 网盘）—— 很多备份策略会排除 `.git`，翻之前先确认打包口径
3. **网页存档**：Wayback Machine 的 CDX API 能列出某个 URL 下的全部快照，含文件页 `/blob/...` 与提交页 `/commits/...`，可以拼出零散版本和 commit hash
4. **Software Heritage**：被它抓取过的仓库有完整快照，`archive.softwareheritage.org/api/1/origin/search/<user>%2F<repo>/`
5. **其他托管商 / 镜像**：GitLab、Codeberg、自建 Forgejo —— 只要迁移过，老平台可能还留着

CDX 的用法：

```bash
curl -s "http://web.archive.org/cdx/search/cdx?url=github.com/<user>/<repo>*&output=text&fl=timestamp,original,statuscode&limit=200"
```

注意它默认按 URL 排序而不是时间，取最近快照要用 `from=` / `to=` 过滤。

## 文件副本不是历史

`chezmoi`、Syncthing、网盘、`tar` 备份保存的都是**某一时刻的文件内容**，没有对象库，也就回答不了"哪次改了什么"。这次排查里好几个位置都有 `~/.emacs.d` 的完整文件，但没有一处带 `.git`，历史等于零。

## 重建

```bash
cd ~/.emacs.d
git init -b main
git add -A
# 提交前先做安全阀：确认没把包目录、缓存、临时文件带进去
git diff --cached --name-only | grep -E '^(elpa|eln-cache|server|auto-save-list)/|\.elc$|\.bak$|#'
git commit -F msg.txt
```

远程仓库要先建再推 —— 自建 Forgejo 默认没开 push-to-create，直接推不存在的仓库只会得到：

```
Forgejo: Push to create is not enabled for users.
```

建库走 API（`POST /api/v1/user/repos`，body 里 `auto_init` 设 false）或者网页点一下都行。

## 别再丢第二次

- 配置仓库保持**两份带 `.git` 的副本**：不同托管商，或者自托管 + 一份镜像
- `git bundle` 把完整历史打成单文件，可以直接塞进现有备份流程：

```bash
git bundle create ~/backup/emacs.d-$(date +%F).bundle --all
git clone ~/backup/emacs.d-2026-09-20.bundle /tmp/verify   # 验证真能还原
git -C /tmp/verify log --oneline -5
```

副本要定期验活：在上面跑 `git log` 能出日志才算数。
