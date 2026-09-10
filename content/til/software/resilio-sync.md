---
title: 'How to Use Resilio Sync'
status: draft
date: 2026-03-01T09:34:24+08:00
header: DevOps
---

### 安装

```bash
yay -S rslsync
```

### 配置

初始化配置文件：

```bash
mkdir -p ~/.config/rslsync
sudp cp /etc/rslsync.conf ~/.config/rslsync/rslsync.conf
cd ~/.config/rslsync
sudo chown archie:wheel rslsync.conf
```

修改如下设置：

- storage<sub>path</sub>
- pid<sub>file</sub>
- webui.listen
- webui.login
- webui.password

确保 `storage<sub>path</sub>` 和 `pid<sub>file</sub>` 路径的文件夹都已经新建完毕。

然后执行：

```bash
systemctl --user daemon-reload
systemctl --user start rslsync
systemctl --user status rslsync
systemctl --user enable rslsync # 为了开机自动启动
```

### Key

- 神Key（22年停更） `BCWHZRSLANR64CGPTXRE54ENNSIUE5SMO`
