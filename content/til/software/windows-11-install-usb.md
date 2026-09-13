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

装完之后的新机清理与优化见 [[win11-new-pc-optimization|Win11 新机优化]]。

## 参考

- [Download Windows 11（MediaCreationTool）](https://www.microsoft.com/software-download/windows11)
- [Windows 11 Home install from USB immediately asks for a driver — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5601509/windows-11-home-install-from-usb-immediately-asks)
- [Fix Missing Storage Driver and No Drives Found in Windows Setup](https://umatechnology.org/how-to-fix-missing-storage-driver-and-no-drives-found-in-windows-setup/)
