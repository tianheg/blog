---
title: 'set -euo pipefail 遇上 head：偶发的 exit 141'
status: draft
date: 2026-09-21T08:45:00+08:00
header: Linux
---

`set -euo pipefail` 的脚本里，只要管道末尾是 `head`（或任何会提前退出的读取方），上游写者就可能吃到 SIGPIPE、以 141 退出，而 `pipefail` 会把这个 141 变成整条管道的退出码 —— 包在 `$(…)` 里就进一步变成整个脚本的退出码。**这是竞态，不是必现**，所以「我手动跑好几次都没事」完全不能作为排除依据。

## 机制

1. `head -N` 读够 N 行就退出，并关闭管道读端
2. 上游写者（常见是 `sort`、`grep`、`jq`、`cat`）下一次 `write()` 就撞上 EPIPE，内核给它发 `SIGPIPE`
3. `SIGPIPE` 是信号 13，默认动作是终止进程，退出码为 `128 + 13 = 141`
4. `set -o pipefail` 让管道的退出码变成「最后一个非 0 的成员」（而不是只看最后一个命令）
5. 管道放在命令替换 `x=$(…)` 里时，**赋值语句的退出码就是命令替换的退出码** → `set -e` 直接终止整个脚本

第 3 步的 `128+13=141` 是内核行为，`SIGPIPE` 被静默终止是默认的，程序不打印任何错误 —— 这也是它难查的原因。

## 为什么是偶发（关键）

管道有内核缓冲（Linux 默认 64KB）。**写者只要能赶在读取方关闭之前把所有输出写进缓冲并正常退出，就永远不会收到 SIGPIPE。**

```bash
# 前 20 行能塞进缓冲，子 shell 毫发无伤地 sleep 10
(seq 20; sleep 10; seq 10) | head
```

于是同一个脚本的成败取决于调度先后：输出量远小于 64KB → 基本必成；输出量在缓冲边缘（几十 KB）→ 时好时坏。实测那次是被统计的文件数 475 个、每行约 95 字节 ≈ 45KB，正好卡在边缘，表现为约 1/10 的概率失败。

**推论（用来判断一个管道有没有风险）**：读取方是否可能提前退出 × 写者输出是否可能超过 64KB。两个都成立才有风险；只有 `pipefail` 而没有 `set -e` 的脚本不会因此终止。

## 确定性复现

让输出量远超缓冲即可稳定复现，不必靠运气：

```bash
env -i PATH=/usr/bin:/bin bash -c \
  "set -euo pipefail; x=\$(seq 1 200000 | sort -rn | head -6); echo ok"; echo "exit=$?"
# exit=141
```

## 修法

- **`head -N` → `awk 'NR<=N'`**（首选）。`awk` 会读到 EOF，写者永远看不到关闭的管道
- **带条件的 Top-N**：用 `awk` 自己的计数器，别在末尾接 `| head -10`

  ```bash
  # 坏的：sort 可能被 SIGPIPE 打死
  oversized=$(find . -name SKILL.md | xargs wc -c | sort -rn \
    | awk '$1 > 50000 {print $2, $1"B"}' | head -10 || true)

  # 好的：单一 awk，读到底
  oversized=$(find . -name SKILL.md | xargs wc -c | sort -rn \
    | awk '$1 > 50000 && n < 10 {print $2, $1"B"; n++}')
  ```

- **同一类读取方都要提防**：`head`、`tail -n`、`grep -q`、`grep -m1`、`awk '…; exit'`、`less` —— 凡是「拿到够用的就退出」的，都会关掉读端
- **`|| true` 只是兜底，不是修复**：它能阻止脚本被终止，但变量拿到的可能是没写完的结果，错误被吞掉了
- **落临时文件**：先把结果写文件再读，从根上不存在管道

## 验收：必须在真实语境压测

手动跑一次通过说明不了任何事。压测要同时满足「脚本自己的 stdout 也是管道」和「环境接近目标环境（cron/CI 的 `env -i`）」：

```bash
for i in $(seq 1 60); do
  env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin HOME=/root \
    bash -c 'bash /path/to/script.sh 2>&1' | cat >/dev/null
  [ ${PIPESTATUS[0]} -ne 0 ] && echo "FAIL $i"
done
```

判据：逐次退出码必须为 0。另外 **`bash -x` 会改变时序，往往反而复现不出来** —— 别指望它抓到行号，要用「换掉可疑管道 + 压测」来证伪/证实。

## 定位线索

- 退出码 141 且**输出在某阶段标题之后整段消失**（该阶段一行都没有）→ 死点就在这一段所在的脚本
- 141 和 1 要分开统计，同一个脚本的历史失败可能是不同 bug 接力：`grep -rh 'exited with code' <日志目录> | sort | uniq -c`

## 2026-09-21 实测（周一巡检脚本）

一个每周跑的巡检脚本报 `Script exited with code 141`，输出停在第 2 阶段的标题之后。死因是指标收集段：

```bash
# set -euo pipefail 之下，这一行能杀掉整个脚本
heaviest=$(find "$SKILLS_DIR" -name SKILL.md | xargs wc -c | sort -rn | head -6)
```

改用 `awk 'NR<=6'` 后的 A/B 对照（各 60 次，cron 语境 `env -i` + stdout 接管道）：

- 旧写法：**4/60 失败**（≈7%）
- 新写法：**0/60 失败**
- 顺带记一笔：交互式手动跑旧写法连续 6 次全部退出 0 —— 这就是它潜伏了很久的原因

`set -euo pipefail` 这个组合本身就在 Bash Pitfalls 的条目里被专门列出来讨论（#60），它带来的是「静默失效」这一类最贵的故障。

## 参考

- [GNU Bash Manual — The Set Builtin（`pipefail` 的定义）](https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html)
- [Greg's Wiki — Bash Pitfalls #60: `set -euo pipefail`](https://mywiki.wooledge.org/BashPitfalls)
- [Why is bash broken pipe error generally silent?（`128+13=141`）](https://stackoverflow.com/questions/75807234/why-is-bash-broken-pipe-error-generally-silent)
- [How to exit early on pipe close?（管道缓冲决定成败）](https://unix.stackexchange.com/questions/404272/how-to-exit-early-on-pipe-close)
- [Pipefail Fail（`grep -q` 同类：提前退出 + `pipefail` = 141）](https://blog.philz.dev/blog/pipefail-fail/)
