---
title: 'Windows 现代待机的两套自动休眠触发器'
status: draft
date: 2026-09-11T13:01:21+08:00
header: 'Windows'
---

笔记本会在没人使用的时段自动从睡眠落入休眠，唤醒必须按电源键、SSH 也连不上。查事件日志的结论：不是空闲超时，是 Modern Standby 的 **adaptive hibernate**（待机电池预算）在起作用。而且它和"休眠超时"是两套完全独立的机制，关掉一个不影响另一个——只关前者的话，问题会原样保留。

## 为什么会有这套机制

传统 S3 睡眠是"CPU 停机、只给内存供电"。现代待机（S0 Low Power Idle）不是：系统仍然活着，联网、收邮件、跑后台任务、装更新都能干。代价是待机耗电比 S3 高。

代价带来的风险是**恢复时发现电池已经耗干**——内存内容全丢，严重时开不了机。微软的对策就是 adaptive hibernate：在 S0 期间盯着耗电，超过预算就把内存写盘转 S4，彻底断电。设计目标写得很直白：宁可多睡一会儿，也别把电池放干。

所以只要机器支持 S0（多数 2021 年后的笔记本被固件锁成这样，`powercfg /a` 里没有 S3 可选），这套机制就**不是可选项**。

## 两套触发器

| 触发器 | 设置位置 | 判定依据 | 日志写法 |
|--------|----------|----------|----------|
| Fixed Timeout | `SUB_SLEEP\HIBERNATEIDLE` | 待机时长 | `Hibernate from Sleep - Fixed Timeout` |
| Adaptive Hibernate | `SUB_PRESENCE\STANDBYBUDGETPERCENT` | 待机耗电比例 | `Hibernate from Sleep - Standby Battery Budget Exceeded` |

关键点：预算那套在 **`SUB_PRESENCE`** 分组下，不在 `SUB_SLEEP` 里。查 `powercfg /q SCHEME_CURRENT SUB_SLEEP` 看不到它，会以为只关掉了定时器就没事了。

## 预算的判定逻辑

这套设置本身是**隐藏项**，要加 `/h` 才列得出来：

```bash
powercfg /qh SCHEME_CURRENT SUB_PRESENCE
```

全部为 DC-only（交流电下不生效），默认值与语义：

| 设置项 | 默认值 | 含义 |
|--------|--------|------|
| Standby Budget Percent | 5% | 待机期间允许消耗的电量 |
| Standby Budget Refresh Interval | 43200 秒（12h） | 预算刷新窗口 |
| Standby Budget Refresh Count | 4 | 最多刷新次数 |
| Standby Budget Grace Period | 900 秒（15min） | 触发前的宽限期 |
| Standby Reset Percentage | 75% | 电量回到此值以上时重置计数 |
| Standby Reserve Time | 1200 秒（20min） | 唤醒后保证的亮屏时间 |

读法：进入待机后开始计耗电，只要在刷新窗口内没耗穿预算就允许继续待机；耗穿了会**退出待机做降级处理**（Austerity / Restricted Standby：停维护、断网）再进待机——**并不必然转休眠**。宽限期保证不会一进待机就立刻触发。（2026-09-13 实测修正，见下文「预算超限只做降级」）

## powercfg 输出里的 AC 与 DC

```
Current AC Power Setting Index: 0x00000000   # 插电源适配器时的值
Current DC Power Setting Index: 0x00000005   # 靠电池供电时的值
```

AC = Alternating Current（墙上插座来的交流电，即"接通电源"），DC = Direct Current（电池放出的直流电，即"使用电池"）。每个电源设置都有这两列，改的时候要用对应的 `setacvalueindex` / `setdcvalueindex`，不然改的是另一栏。

## 诊断入口

进睡眠的事件是 Kernel-Power **42**，恢复是 **107**；S0 进出是 **506 / 507**。42 的 `Sleep Reason` 字段直接写明了触发原因：

```powershell
Get-WinEvent -FilterHashtable @{
  LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'; Id=42
} -MaxEvents 10 | ForEach-Object { $_.TimeCreated; $_.Message }
```

想知道唤醒源和实际待机时长，看 Power-Troubleshooter 的 Event ID 1（`Sleep Time` / `Wake Time` / `Wake Source`）。

## 修法：放宽预算，别关休眠

预算耗尽的判定是按百分比的，待机耗电越快、触发越早。放宽到 40% 意味着要掉 40% 才休眠，日常"晚上用几小时 + 隔夜待机"根本碰不到：

```bash
powercfg /setdcvalueindex SCHEME_CURRENT SUB_PRESENCE STANDBYBUDGETPERCENT 40
powercfg /setactive SCHEME_CURRENT
```

只动 DC 一栏，插电行为不变。回滚就是把 40 写回 5。

不建议 `powercfg /h off`：休眠一关，低电量临界动作会退化成关机，反而丢失内存数据——这个兜底正是这套机制存在的理由。真正的保命线是 `SUB_BATTERY` 的 Critical battery action（默认 5% 时 Hibernate），那条不要碰。

## 附带的坑：S4 之后键鼠唤不醒

`powercfg /devicequery wake_armed` 在 S4 下往往只列出少数几项（如 USB4 Root Router），键盘鼠标不在其中——于是只能按电源键。而 S0 下动一下鼠标就醒。如果机器的工作节奏是"每天用几小时 + 其余时间待机"，那么频繁转入 S4 是纯粹的体验退化，省下的电远不如"电池掉到 5% 需要几十小时"的余量值钱。

## 2026-09-13 实测修正：预算超限只做降级，不做兜底

上面「耗穿预算就转休眠」的表述被实测推翻。链路（本地时间，翼龙 15 Pro，插座断充后电池供电）：

- `13:40:53` 智能插座断充（80%）→ 转电池供电；`13:41:54` 进 Modern Standby
- `13:44:31–15:00:46` 这一次睡眠会话 99.5% 时间在低功耗，只掉 991 mWh（≈0.78 W）——完全正常
- `15:00:46` Kernel-Power 507/506：`Austerity Battery Drain Budget Exceeded`。**这不是休眠**，而是退出待机去套用 austerity（受限待机：停维护、断网）后再次进待机
- `15:00:46 → 20:18`：System / Application 日志双双全空（16–19 点整点各 0 条），sleepstudy 里没有对应会话记录，`SUB_BATTERY` 的 5% 临界休眠也没执行——**但电量从 77,276 mWh 掉到 1,981 mWh**（5h21m，≈12 W，健康待机 0.6 W 的 19 倍）
- `20:18:09` Event 41：电池耗尽硬断电（开机后靠 3 次 TrustedInstaller 重启，把当天 `08:19` 起就在装的累积更新装完）

结论：**adaptive hibernate 假定系统仍在正常跑自己的电源状态机**。一旦 S0 没真正进低功耗、电源管理停摆，预算判定与临界休眠都不会执行——它救不了场。此时还靠得住的兜底是**定时休眠**：由内核定时器 + 固件路径触发，不依赖预算模型。

### 兜底配置：只用 DC 一栏的定时休眠

```bash
# HIBERNATEIDLE：AC 0（插电不打扰）/ DC 7200（电池待机满 2h → S4）
powercfg /setacvalueindex SCHEME_CURRENT SUB_SLEEP 9d7815a6-7ee4-497e-8888-515a05f02364 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_SLEEP 9d7815a6-7ee4-497e-8888-515a05f02364 7200
powercfg /setactive SCHEME_CURRENT
```

效果：插电行为完全不变，只在「电池 + 待机超 2h」时写 S4。本例会在约 16:40 截停，电量停在 ~78%。

### 掉电取证清单

| 查什么 | 命令 / 位置 |
|--------|-------------|
| 当前电量与电源 | `(Get-CimInstance Win32_Battery).EstimatedChargeRemaining` / `.BatteryStatus`（2=AC，1=电池） |
| 电量时间线 | `powercfg /batteryreport`（看 Recent usage 表；`Suspended` 行的下一行时间差 = 记录断档区） |
| 待机会话细节 | `powercfg /sleepstudy /xml /output x.xml` —— **XML 干净可用；HTML 里嵌的 JSON 被转义损坏，别 parse HTML** |
| 待机进出原因 | System 日志 `Microsoft-Windows-Kernel-Power` 的 506（进）/ 507（出），Reason 字段即 `Idle Timeout` / `Austerity…Budget Exceeded` / `Input Keyboard` |
| 耗电速率判据 | 健康待机 ≈0.6 W（≤1%/h）；本次 ≈12 W |

⚠️ 一个反直觉点：**健康待机时每小时同样是 0 条事件**（对照 09-13 凌晨 03–06 点，事件数同样全空）。所以"日志没有记录"不能当卡死证据，判断要落在**耗电速率**上。

## 相关

[[smart-plug-battery-guard|米家智能插座实现笔记本电池 80% 保持充电]]、[[laptop-maintenance|笔记本保养]]、[[win11-new-pc-optimization|Win11 新机优化]]（那篇里的"关闭休眠释放 C 盘"要结合本文的取舍看）

## 参考

- [Adaptive Hibernate Overview - Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/customize/power-settings/adaptive-hibernate)
- [Modern Standby - Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby)
- [Powercfg command-line options - Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options)
