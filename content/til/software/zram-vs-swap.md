---
title: 'zram 与 swap 的区别'
status: draft
date: 2026-09-26T17:57:13+08:00
header: Linux
---

## 一句话区别

zram 是把内存**塞得更紧**（压缩后仍留在 RAM 里），swap 是把内存**换到磁盘**。前者提高密度、上限还是物理内存；后者扩展容量、代价是速度。

| | zram | swap（磁盘） |
|---|---|---|
| 存放位置 | 内存里（压缩后） | 磁盘上 |
| 扩容量吗 | 否 | 是 |
| 速度 | 快（内存速度，只付压缩/解压的 CPU） | 慢（磁盘 I/O） |
| 对 OOM | 无救 | 兜底 |

## 为什么 zram 不增加总内存

zram 是一块**压缩的块设备**，通常当 swap 用。被换出的页压缩后仍然存放在 RAM 里，不落盘。压缩比经验值 2–4:1，所以一块 4 GiB 的 zram 能装下约 8–16 GiB 的原始数据 —— 但它吃掉的是真实物理内存。

于是有个必然结论：**zram 满了就等于物理内存真的到顶了**。压缩这条路走到头，没有下一步可退，内核只剩一个选择：杀进程。这是它和磁盘 swap 的关键差别 —— 磁盘 swap 是最后兜底，zram 只是"更紧的内存"。

（顺带区分：**zswap** 是另一个东西 —— 内存里的压缩**缓存**，配合真正的磁盘 swap 使用，满了会溢出写盘。它有兜底，zram 没有。）

## `free` 会骗你

在 zram 做 swap 的机器上，`free` 报的 swap used 是**压缩前**的虚拟量，物理占用只有它的 1/3 到 1/4。实测过一台机器：`Swap: 3.8Gi/4.0Gi` 看着快满了，真实物理占用只有约 1.5 GiB。

要拿真实值得读 `/sys/block/zram0/mm_stat` 的第 3 列 `mem_used_total`：

```bash
awk '{print $1, $2, $3}' /sys/block/zram0/mm_stat
# orig  compr  phys（字节），第 3 列才是真实物理占用
```

按 `free` 的虚拟量设阈值会长期误报，按物理量设才对。

## KVM 超配：guest 为什么感知不到宿主的内存压力

这是更反直觉的一条。**KVM 的内存是按需分配** —— guest 只占用它真正用到的物理页，不是启动时就吃掉 `-m` 指定的全部内存。所以：

- 宿主可以"超配"：把 20 GiB 分给两台 VM，而宿主只有 23 GiB。平时用量不高，侥幸不撞
- guest 内部的 `swappiness`、swapfile 全是 **guest 自己的**策略，它只看得到自己那块内存。**guest 永远不会知道宿主快撑不住了**
- 结果是：guest 自己还有余量（比如 16 GiB 里用了 14.5 GiB），它的内核不觉得有压力，没有理由换出任何页 → swap 使用量全程为 0

然后宿主的 OOM killer 出手，把整个 QEMU 进程杀掉 —— guest 被硬杀，日志停在被杀前一刻的正常心跳，什么错误都看不到。

**推论**：给 guest 加 swapfile、调 guest 的 swappiness，**防不了宿主 OOM**。要防只有两条路 —— 限制 VM 内的内存峰值，或者别超配。

## 实战：一次宿主 OOM 的完整推导

一台 PVE 宿主，23 GiB 内存，跑两台 VM（一台 16 GiB 的 Docker 宿主 + 一台 4 GiB 的 HAOS），另有宿主自身和 ZFS ARC 要占。某天下午：

- 内核日志：`kvm invoked oom-killer` → `Out of memory: Killed process (kvm) anon-rss:14549280kB`，`task_memcg=/qemu.slice/102.scope` —— 被杀的就是那台 16 GiB 的 VM，当时占 14.5 GB 物理内存
- guest 侧：`journalctl -b -1` 显示死前最后一条是正常的心跳 200，之后戛然而止
- guest 有 4 GiB swapfile、`swappiness = 60`（内核默认、完全正常），但 used = 0 —— 它从没觉得有压力
- 算账：14.5 + 4（另一台 VM）+ 宿主自身 + ZFS ARC > 23 GiB，宿主先撑不住

诊断顺序（可复用）：

```bash
# 1. 确认是不是 OOM 杀的，被杀的哪个 cgroup
journalctl -k --since '<时间>' | grep -iE 'oom|killed process'

# 2. 看 guest 死前日志（journald 持久化时 boot -1 还在）
ssh <guest> 'journalctl -b -1 --since ... --until ...'

# 3. 对比 guest 内的 swap 策略与实际使用
ssh <guest> 'cat /proc/sys/vm/swappiness; swapon --show'
```

## 防 OOM 的有效手段

按性价比排：

1. **给容器设内存上限**（compose 的 `mem_limit`，或运行时的 `docker update --memory`）。单个服务爆内存时只死它自己，不会拖垮整机。注意 `docker update` 只改运行时 cgroup，容器/VM 重启即失，持久化要写进 compose
2. **找出会瞬时吃满内存的应用**，限制它的峰值
3. **别超配，或给宿主加真内存**。宿主 swap 在 ZFS root 上有死锁风险（ZFS 需要内存回收才能写盘，而 swap 恰恰在内存回收时才写），要加就用独立分区
4. **监控密度要够**：每日一次的巡检能说明"当时内存紧"，但挡不住"9 小时后才出事"。宿主内存水位值得单独做一个高频、静默的 watchdog —— 低于阈值才推送

来源: 本机实测（2026-09-26）
