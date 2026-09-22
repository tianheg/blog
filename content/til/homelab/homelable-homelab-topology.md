---
title: 'Homelable：homelab 拓扑可视化 + 只读 PVE 接入'
status: draft
date: 2026-09-13T08:18:04+08:00
---

内网地址用 `<PVE-IP>` / `<VM-IP>` / `<LAN>/24` 占位，实际部署时换成自己的；token 与密钥只进 `.env`，不进 git。

## 它解决什么

[Homelable](https://github.com/Pouzor/homelable) 是自托管的 homelab 可视化：把机器、设备、服务画成一张可交互的拓扑图，节点上挂实时状态。和"写份文档画张图"的区别在于它是活的——网络扫描把发现的设备塞进待确认队列，状态检查每 60 秒把在线/离线画回图上。

三个能力，按实际使用频率排：

1. **网络扫描**：`nmap -sV --open` 扫配置的 CIDR 段，结果进 Pending 队列，人工 approve / hide / ignore 后才上画布
2. **节点健康检查**：每个节点可挑 ping / http / https / tcp / ssh / prometheus / health 七种方式之一
3. **MCP server**（可选）：把拓扑的读写暴露给 AI 客户端。另有 Zigbee2MQTT / Z-Wave JS 的 MQTT 导入，没有对应设备就用不上

## 部署

官方给的是预构建镜像（backend / frontend / mcp，都在 GHCR），不需要本地 build，`docker compose pull` 直接拉。几处必须按自己环境改：

- **前端默认占用 3000**。这台机器上若已有服务在用，必须换端口，否则 `up` 时端口冲突
- **`CORS_ORIGINS` 要改成真实访问地址**。上游的预构建 compose 把它硬编码成 `http://localhost:3000`，不改的话界面能打开、所有 API 调用失败
- **端口只绑内网地址**（`<VM-IP>:端口:端口`），不要 `0.0.0.0`
- **backend 保留 `cap_add: NET_RAW`**：ping 检查和 nmap 的 SYN 扫描都要它。漏掉的表现是"扫描跑完什么都没发现"
- 数据是 SQLite，绑定挂载一个目录即可（平面图上传也在里面）

自检顺序：容器是否 healthy → 首页返回 200 → 经反代/前端的 `/api/v1/health` 是否回 `{"status":"ok"}` → 用 `docker exec <backend> nmap -sV --open <宿主IP>` 确认扫描真的能跑。

## 扫描结果长什么样

`/24` 全段扫一次大概几分钟，捞出来的就是网关、PVE 宿主、docker 宿主机、手机、智能插座、音箱，以及它自己。每台带发现的开放端口。MAC 厂商信息在 bridge 网络里拿不全，要更准得 `network_mode: host`。

## Proxmox 只读接入（坑最深的一步）

Homelable 能从 PVE 的 REST API 直接拉宿主 / VM / LXC，省掉手敲清单。凭证用一个只读 token：

```bash
pveum user add homelable@pve --comment "Homelable read-only import"
pveum user token add homelable@pve homelable --privsep 1 --output-format json   # secret 只显示一次
pveum acl modify / --tokens 'homelable@pve!homelable' --roles PVEAuditor
pveum acl modify / --users  homelable@pve            --roles PVEAuditor   # ← 少这行不生效
```

**`--privsep 1` 的 token 只给自己授 ACL 是不够的**（PVE 9.2.18 实测）：token 能通过认证，但权限为零——`/access/permissions` 返回空对象、`/cluster/resources` 只列出宿主节点、看不到任何 VM/LXC，界面上的连接测试会回一句 "this API token has no permissions"。给**所属用户**也授上同一角色后立刻正常。

验证别靠界面，直接打 API：

```bash
curl -sk -H "Authorization: PVEAPIToken=<tokenid>=<secret>" \
  https://<PVE-IP>:8006/api2/json/nodes/pve/qemu    # 应列出 VM
```

`.env` 里对应五项：`PROXMOX_HOST`、`PROXMOX_PORT`、`PROXMOX_TOKEN_ID`、`PROXMOX_TOKEN_SECRET`、`PROXMOX_VERIFY_TLS=false`（PVE 默认自签证书）。改完重启 backend，`GET /api/v1/proxmox/config` 应回 `token_configured: true`。

导入后还有两个细节：PVE 宿主条目落进队列时 `ip` 是空的（API 不返回节点 IP，得手填）；MCP 的 `list_proxmox_children` 要的是**待确认队列里的条目 id**，传画布节点 id 会 404。

权限面只有 `PVEAuditor`（`*Audit` 类），宿主用户没设密码、无法交互登录。真实风险是 token 泄露，所以只留在内网，别过隧道。

## MCP 接口

MCP 是单独一个容器，端点在 `http://<VM-IP>:8001/mcp`。两个坑：

- **路径尾斜杠**：`POST /mcp` 回 307 跳到 `/mcp/`，客户端不跟随重定向的话，看起来就像"服务坏了"
- **鉴权只有 `X-API-Key` 一个头**，而工具集里有创建/删除/改画布的写操作——所以 MCP 端口不能经 Cloudflare Tunnel 之类暴露出去

接进 agent 客户端后能读全部节点/边/待确认设备，也能加节点、连边、触发扫描、批量 approve。

## 值不值得

真省事的是**扫描 + 自动上画布**这一段，以及 Proxmox 导入。健康检查那部分与已有的巡检脚本重叠，锦上添花。长期价值在 MCP：拓扑变成 agent 能读能改的数据，而不是一张死图。

代价是一个要维护的容器组和一个只读 token。若只想要那张图，它确实比手画好看；但要它长期活着，得接受它成为又一个待升级的服务。

相关：[[pve-first-setup|PVE: First setup]]、[[pve-dual-nvme-storage-migration|PVE 双 NVMe 存储]]、[[docker|Docker]]

## 参考

- [Pouzor/homelable](https://github.com/Pouzor/homelable)
- [Homelable 安装文档 INSTALLATION.md](https://github.com/Pouzor/homelable/blob/main/INSTALLATION.md)
- [Proxmox VE 用户与权限管理](https://pve.proxmox.com/wiki/User_Management)
