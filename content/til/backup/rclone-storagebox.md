---
title: '用 rclone 备份到 StorageBox'
status: draft
date: 2026-10-03T10:20:00+08:00
---

rclone 是把文件送到 Hetzner StorageBox 最省心的方式：跨平台、能断点续传、带校验、能列能删能算哈希。适合「手工或脚本把一批文件推上去」这种场景。

## 配置

`~/.config/rclone/rclone.conf`：

```ini
[storagebox]
type = sftp
host = uXXXXXX.your-storagebox.de
user = uXXXXXX
port = 23
```

- **端口用 23**：StorageBox 的 22 只给 SCP/SFTP，23 才是 rsync 那套受限环境。rclone 走 23 才能用上服务端的 rsync 能力，速度也更好
- 密码不想存明文就先 `rclone obscure '你的密码'`，把输出填进 `pass =`
- 想改用 SSH 公钥认证：`key_file = ~/.ssh/id_ed25519`。注意子账户的 key 得手动加（见下）

## 常用命令

```bash
rclone copy   ~/pics storagebox:pics      # 只增：目标端多出来的文件不动
rclone sync   ~/pics storagebox:pics      # 镜像：目标端不在源里的会被删掉
rclone check  ~/pics storagebox:pics      # 比对差异
rclone about  storagebox:                 # 配额用量
rclone lsl    storagebox:                 # 列文件（带大小与时间）
```

## `sync` 会删，这是最容易踩的一脚

`rclone sync` 的语义是**镜像**：源端删了，目标端跟着删。省空间、不用每次判断该留哪份，但源端一次误删（或者路径写错、挂载点没挂上）会立刻反映到备份上。

所以用 `sync` 的前提是**存储侧有快照**，否则被删掉的那份在两边同时消失。只要备份不要删，用 `copy`。这条与本站在照片备份上的取舍是同一个道理，见 [[my-backup-practice|我的备份实践]]。

## 传完了不等于传对了

- 默认 `rclone check` 只比**大小与修改时间**，很快，但发现不了「内容变了、字节数没变」的静默损坏
- 要真校验就 `rclone check --checksum`（强制算哈希，慢很多）；StorageBox 侧的 rsync 后端支持算和校验哈希
- 数据量小就别省这一步：几千个文件、几 GB，全量过一遍哈希是分钟级的事

## 认证：密码，或者手动装一把公钥

子账户的 SSH 公钥**没法在 Console/Robot 里加**——Storage Box 建成之后就只能手动改它的 `~/.ssh/authorized_keys`。而且是**按端口分格式**的：

- 22 端口只认 **RFC4716**（`ssh-keygen -e -m RFC4716`）
- 23 端口只认 **OpenSSH 单行**（`id_ed25519.pub` 的原样）

两个都放进去，哪个端口都能用。另外：新建的子账户如果 23 端口一直提示认证失败，先确认它在 Console 里**单独开过 SSH support**——没开的时候症状极像「钥匙不对」，实际是开关没开。

## 手机端：WebDAV 那一系

不想在手机上装 rclone 时，两条替代路：

- 支持 WebDAV 的文件管理器（如 MaterialFiles）直接连 StorageBox 上传
- 用 [OpenList](https://github.com/OpenListTeam/OpenList) 把 WebDAV 挂成网盘界面再选文件

两者都是「手动/半自动」：没有增量比对，也没有校验，传完得自己确认。适合偶尔补几张图，不适合当日常链路。

## 参考

- [Hetzner Docs: Storage Box — rclone](https://docs.hetzner.com/storage/storage-box/access/access-ssh-rsync-borg/#rclone)
- [Hetzner Docs: Storage Box — SSH keys](https://docs.hetzner.com/storage/storage-box/backup-space-ssh-keys/)
- [rclone: SFTP 后端](https://rclone.org/sftp/)
- [rclone: check 命令](https://rclone.org/commands/rclone_check/)
