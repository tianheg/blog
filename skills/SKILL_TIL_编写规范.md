---
skill: TIL编写规范
trigger: 在 content/til/ 下创建或修改 .org 文件时
priority: high
related: []
---

# TIL 编写规范 — Today I Learned 知识管理 SKILL

## Agent 执行摘要

**一句话**：在 `content/til/` 下创建结构化的 `.org` 知识笔记，确保可被快速检索和复用。
**何时使用**：需要记录技术知识点、操作步骤、命令备忘时。
**核心步骤**：
1. 确定分类文件夹（软件类统一放 `software/`，非软件类按现有分类）
2. `software/` 目录下文件名必须使用 `{前缀}-{描述}.org` 格式
3. 文件必须包含 `💡 重述理解` 和 `📋 内容主体` 两部分
4. 代码块指定语言，Org 标记使用大写（`#+BEGIN_SRC`）
5. 运行 `./scripts/til-lint.sh` 验证

## 检查清单

- [ ] 文件名：无大写、无空格、无中文标点、无意义编号
- [ ] `software/` 目录：使用前缀命名（如 `git-rebase.org`）
- [ ] 其他目录：使用描述性命名（如 `sleep.org`）
- [ ] 包含 `** 💡 重述理解` 和 `** 📋 内容主体`
- [ ] 代码块指定语言（`bash`/`conf`/`python` 等）
- [ ] Org 标记大写：`#+BEGIN_SRC` / `#+END_SRC`
- [ ] 无临时文件（`*.org~`）

## 详细参考

### 分类文件夹（固定，不再新增）

```
content/til/
├── backup/        # 数据备份
├── career/        # 职业发展
├── emacs/         # Emacs 编辑器
├── hardware/      # 硬件相关
├── health/        # 健康/生活
├── homelab/       # 家庭实验室
├── learning/      # 学习方法
├── life/          # 生活常识
├── misc/          # 杂项
├── music/         # 音乐相关
├── software/      # 软件/工具/编程（统一存放所有技术类）
└── writing/       # 写作相关
```

**规则**：软件类内容统一放入 `software/`，不再创建新的分类文件夹。

### software/ 目录前缀规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `git-` | Git 版本控制 | `git-rebase.org` |
| `css-` | CSS 样式 | `css-flexbox.org` |
| `js-` | JavaScript | `js-async.org` |
| `python-` | Python 编程 | `python-decorator.org` |
| `docker-` | Docker 容器 | `docker-compose.org` |
| `linux-` | Linux 系统 | `linux-iptables.org` |
| `arch-linux-` | Arch Linux 特定 | `arch-linux-font.org` |
| `firefox-` | Firefox 浏览器 | `firefox-addon.org` |
| `github-` | GitHub 平台 | `github-copilot.org` |
| `ai-` | 人工智能/LLM | `ai-tuning.org` |
| `design-` | 设计相关 | `design-figma.org` |
| `db-` | 数据库 | `db-mysql-reset.org` |

### 文件结构模板

```org
* {标题/问题简述}

来源: https://example.com（可选）

** 💡 重述理解
#+BEGIN_QUOTE
核心是：{用你自己的话概括}
记它是为了：{未来在什么场景下使用}
#+END_QUOTE

** 📋 内容主体

【步骤】1. 第一步
#+BEGIN_SRC bash
command --option value
#+END_SRC

【步骤】2. 第二步
- 要点 A
- 要点 B

【警告】可能导致错误的操作
【提示】有用的补充信息
```

### 标记符号

| 符号 | 用途 |
|------|------|
| 【重点】 | 需要特别注意的内容 |
| 【代码】 | 一行代码或命令 |
| 【步骤】 | 操作步骤编号 |
| 【警告】 | 可能导致错误的操作 |
| 【提示】 | 有用的补充信息 |

### 元数据

**不推荐添加元数据**。文件夹分类已足够，无需 `:TAGS:`、`:STATUS:` 等冗余标记。来源直接写在正文即可。

### 完整示例

文件路径: `content/til/software/git-rebase.org`

```org
* Git Rebase 交互式变基

来源: https://git-scm.com/docs/git-rebase

** 💡 重述理解
#+BEGIN_QUOTE
核心是：交互式 rebase 允许修改提交历史（合并、拆分、重排、修改提交信息）
记它是为了：在推送代码前清理本地提交历史，使其更整洁
#+END_QUOTE

** 📋 内容主体

【步骤】1. 启动交互式 rebase
#+BEGIN_SRC bash
git rebase -i HEAD~3
#+END_SRC

【步骤】2. 在编辑器中选择操作
- pick: 保留提交
- reword: 修改提交信息
- squash: 合并到上一个提交
- drop: 删除提交

【警告】不要对已经推送到共享分支的提交进行 rebase
```

### 工具链

```bash
# 检查 TIL 质量（临时文件、空文件、Org 标题、统计分布）
./scripts/til-lint.sh
```

---

**核心原则**：【一次记录，永久可用】— 每个 TIL 都应该写得足够清晰，让未来的自己（或他人）能在 30 秒内理解核心内容。
