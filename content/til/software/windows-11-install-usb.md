---
title: 'Windows 11 安装盘：制作与「安装驱动程序以显示硬件」报错'
status: draft
date: 2026-09-13T09:40:53+08:00
header: Windows
---

在一台 8 代 i5 的老 HP 笔记本上全新安装 Windows 11 时实测：那个报错的文案会把人引向完全错误的方向。

## 报错的真实含义

安装刚开始就弹 **「安装驱动程序以显示硬件」**，正文写着「缺少计算机需要的媒体驱动程序。这可能是 DVD、USB 或硬盘驱动程序。如果你的 CD、DVD 或 USB 闪存驱动器上有驱动程序，请立即插入。」

这段文案是误导 —— 它让人以为要去下存储驱动，**实际原因是启动 U 盘没做好、安装源读不到**。在确认是介质问题之前，不要浪费时间去下 IRST / VMD 驱动。

## 先判断，再动手

`Shift + F10` 开命令行：

```
diskpart
list disk
list volume
```

| 看到什么 | 结论 | 怎么修 |
|----------|------|--------|
| 内置 SSD + U 盘卷（标签 `ESD-USB`）都能列出 | WinPE 层存储与介质都正常，是安装源读不到 | 重做 U 盘，别碰存储驱动 |
| 内置 SSD 看不到 | 存储控制器驱动缺失 | BIOS 里 `SATA Mode` 改 AHCI，或手动加载 IRST F6 驱动 |
| U 盘看不到、内置盘看得到 | U 盘枚举失败 | 换 USB 2.0 口直插，或换一支盘 |

实测那次：两块 SSD（931G + 119G）和 U 盘卷全部可见，报错依旧 —— 说明 WinPE 认得出盘，问题在介质本身。

## 制作安装盘

**首选微软 MediaCreationTool**：自己下载最新版并写盘，不用另外准备 ISO；语言可在工具界面选。

限制：

- 版本**固定为当前最新**，要指定 build、旧版本或 LTSC 得自己下 ISO
- **不做任何绕过**：TPM 2.0 / Secure Boot / 微软账户检查全都在，老机器照样卡

想在做盘阶段就绕掉这些 → **Rufus + ISO**：分区类型 **GPT**、目标系统 **UEFI（非 CSM）**、文件系统 **NTFS**；勾 `Remove requirement for an online Microsoft account` 和 `Create a local account with username`。

MCT 出的盘也可能没做好 —— MCT 不是免检。

## 出不来的逃生顺序

1. 换 **USB 2.0 口**直插机身，不走 Hub / 扩展坞 / 转接
2. **换一支 U 盘**重做 —— MCT 出盘正确不等于这支盘能被这台机器的 WinPE 读出来，主控兼容性是硬件层的坑
3. 仍不行换 **23H2** 的 ISO —— 24H2 在这类老平台上有已知的介质识别问题

## 那台机器上另外两个坑

**没有 Intel VMD。** VMD 是 11 代酷睿才引入的，8 代 i5-8250U 上不存在这个东西，网上「关 VMD」的方案对老机器不适用。

**「隐藏与此计算机硬件不兼容的驱动程序」默认是勾上的。** 它会把正确驱动藏起来、让驱动列表永远空白。真要手动加载驱动，先把勾取消掉。

## 装完之后：C 盘会被 BitLocker 自动加密

全新安装 24H2 之后，C 盘会在**用户没有任何操作的情况下**被加密 —— DiskGenius 里显示成「本地磁盘(BitLocker加密)(C:)」，而用户并没有主动开过 BitLocker。

这是 24H2 起的自动设备加密（Auto-DE）默认行为。微软取消了原先的 Modern Standby / HSTI 验证与不受信任 DMA 总线检查，门槛降到两条，而这两条恰好是装这类老机器时的常规操作：

- 设备存在 TPM（1.2 或 2.0），例如开了 Intel PTT
- UEFI Secure Boot 已启用

只作用于**全新安装与重置**；从 Windows Update 升级到 24H2 的机器不会自动加密。

### 加密不等于已受保护

- 加密流程在 **OOBE 期间就启动**，所以磁盘上会出现 BitLocker 标记
- 但**保护（armed）只在用微软账户登录后才生效**；用本地账户时保护是**挂起（suspended）**的，数据实际未受保护，开机也不需要密钥

查状态（管理员）：

```
manage-bde -status C:
manage-bde -protectors -get C: -type RecoveryPassword
```

| `Protection Status` | 含义 | 恢复密钥在哪 |
|---------------------|------|--------------|
| `On` | 加密已生效 | 登录过微软账户 → `account.microsoft.com/devices/recoverykey`；本地账户 → 无云端托管，必须自己导出 |
| `Off` / `Suspended` | 保护挂起，数据未受保护 | —— |

### 有 CMOS 前科的机器建议直接关掉

刚动过 Secure Boot 密钥、TPM、清过 CMOS 的机器，BitLocker 是定时炸弹：**固件状态一变就要求恢复密钥，没有密钥就进恢复界面，而且没有后门**。

关掉：`设置 → 隐私和安全性 → 设备加密` 关滑块，或在管理员命令行执行

```
manage-bde -off C:
```

解密要跑几十分钟，期间别断电。代价是拆盘后数据明文可读。

要保留加密则必须做到三件：导出密钥并存两处（密码库 + 纸质/U 盘）；固件更新前先 `manage-bde -protectors -disable C: -rebootcount 1`；以及记住**删掉微软账户 = 密钥一起丢**。

### 下次安装直接跳过

1. OOBE 阶段 `Shift+F10` → `regedit` → `HKLM\SYSTEM\CurrentControlSet\Control\BitLocker` → 新建 DWORD `PreventDeviceEncryption` = 1
2. Rufus 做盘时勾「关闭 BitLocker 自动设备加密」—— 本质是往 `sources\$OEM$` 放一个含 `PreventDeviceEncryption` 的 `unattend.xml`

装完之后的新机清理与优化见 [[win11-new-pc-optimization|Win11 新机优化]]。

## 参考

- [OEM 的 Windows 11 中的 BitLocker 驱动器加密 — Microsoft Learn](https://learn.microsoft.com/zh-cn/windows-hardware/design/device-experiences/oem-bitlocker)
- [Microsoft is enabling BitLocker device encryption by default on Windows 11 — The Verge](https://www.theverge.com/2024/8/14/24220138/microsoft-bitlocker-device-encryption-windows-11-default)
- [Download Windows 11（MediaCreationTool）](https://www.microsoft.com/software-download/windows11)
- [Windows 11 Home install from USB immediately asks for a driver — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5601509/windows-11-home-install-from-usb-immediately-asks)
- [Fix Missing Storage Driver and No Drives Found in Windows Setup](https://umatechnology.org/how-to-fix-missing-storage-driver-and-no-drives-found-in-windows-setup/)
