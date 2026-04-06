# TIL 编写规范 — Today I Learned 知识管理 SKILL

**定位**: TIL (Today I Learned) 内容的结构化编写与维护方法论

## 一、核心理念

> **"每一个知识点都应该可被快速检索、溯源、复用"**

TIL 不是简单的笔记堆积，而是经过结构化处理的知识单元 (SKU)。

## 二、文件结构标准

### 2.1 文件名规范

**核心原则：TIL 目录下不再新增分类文件夹，统一使用前缀命名**

```
格式: {前缀}-{描述}.org
示例:
  - git-rebase.org          (Git 相关)
  - python-decorator.org    (Python 相关)
  - docker-compose.org      (Docker 相关)
  - css-flexbox.org         (CSS 相关)

存放位置:
  - software/git-rebase.org        → 软件/工具类
  - software/python-decorator.org  → 软件/工具类
  - health/sleep.org               → 非软件类保持原有分类

避免:
  - 无意义编号 (001.org, note1.org)
  - 过长名称 (>50字符)
  - 特殊符号 (空格、中文标点)
  - 创建新的分类文件夹 (如 git/、python/、docker/ 等 ❌)
```

### 2.2 文件结构模板

```org
* {标题/问题简述}

** 💡 重述理解
#+BEGIN_QUOTE
核心是：{用你自己的话概括}
记它是为了：{未来在什么场景下使用}
#+END_QUOTE

** 📋 内容主体
{自由书写区：操作步骤/学习笔记/经验总结/问题记录...}

```

### 2.3 元数据（不推荐）

**文件夹分类已足够，无需额外元数据。**

- TIL 文件按主题放在不同文件夹下（如 `git/`、`health/`、`python/`）
- 文件夹本身就是最自然的分类系统
- 无需 `:TAGS:`、`:STATUS:` 等冗余标记

如果确实需要添加来源，直接写在正文即可：

```org
* {标题}

来源: https://example.com

** 💡 重述理解
...
```

## 三、分类体系

分类通过**文件夹 + 文件名前缀**实现：

### 3.1 现有分类文件夹（固定，不再新增）

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
├── software/      # 软件/工具/编程 (统一存放所有技术类)
└── writing/       # 写作相关
```

### 3.2 前缀命名规范（software/ 目录专用）

对于 `software/` 目录下的文件，**必须使用前缀**来标识主题：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `git-` | Git 版本控制 | `git-rebase.org`, `git-stash.org` |
| `css-` | CSS 样式 | `css-flexbox.org`, `css-grid.org` |
| `js-` | JavaScript | `js-async.org`, `js-array.org` |
| `python-` | Python 编程 | `python-decorator.org` |
| `docker-` | Docker 容器 | `docker-compose.org` |
| `linux-` | Linux 系统 | `linux-iptables.org` |
| `arch-linux-` | Arch Linux 特定 | `arch-linux-font.org` |
| `firefox-` | Firefox 浏览器 | `firefox-addon.org` |
| `github-` | GitHub 平台 | `github-copilot.org` |
| `ai-` | 人工智能/LLM | `ai-tuning.org` |
| `design-` | 设计相关 | `design-figma.org` |
| `db-` | 数据库 | `db-mysql-reset.org` |

**规则：**
- 软件类内容统一放入 `software/` 目录
- 文件名使用 `{前缀}-{描述}.org` 格式
- 前缀使用小写字母，多个单词用连字符连接（如 `arch-linux-`）
- 不再创建新的分类文件夹（如不再创建 `git/`、`python/` 等）

## 四、标记符号体系

### 4.1 内联标记

```
【重点】      → 需要特别注意的内容
【代码】      → 一行代码或命令
【步骤】      → 操作步骤编号
【警告】      → 可能导致错误的操作
【提示】      → 有用的补充信息
```

### 4.2 代码块规范

```org
# 命令行
#+BEGIN_SRC bash
command --option value
#+END_SRC

# 配置文件
#+BEGIN_SRC conf
setting = value
#+END_SRC

# 简短命令（行内）
=inline command=
```

**注意**：所有 Org mode 标记（`#+` 开头）一律使用大写：
- `#+BEGIN_SRC` / `#+END_SRC`
- `#+BEGIN_QUOTE` / `#+END_QUOTE`
- `#+BEGIN_EXAMPLE` / `#+END_EXAMPLE`

## 五、质量控制检查清单

### 5.1 提交前自检

- [ ] 文件名符合规范（software 目录使用前缀命名，如 `git-xxx.org`）
- [ ] 文件放入正确的分类文件夹（软件类统一放 software/，不再新建分类文件夹）
- [ ] 包含"💡 重述理解"和"📋 内容主体"两部分
- [ ] 代码块指定语言
- [ ] Org mode 标记使用大写（`#+BEGIN_SRC`）
- [ ] 外部链接可访问
- [ ] 无临时文件 (*.org~)

### 5.2 定期审查

- [ ] 检查 broken links
- [ ] 合并相似 TIL
- [ ] 归档过时内容

## 六、工具链

### 6.1 Lint 脚本

```bash
# 检查 TIL 质量（临时文件、空文件、Org 标题、统计分布）
./scripts/til-lint.sh
```

## 七、示例

### 7.1 完整示例

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
git rebase -i HEAD~3  # 修改最近3个提交
#+END_SRC

【步骤】2. 在编辑器中选择操作
- pick: 保留提交
- reword: 修改提交信息
- squash: 合并到上一个提交
- drop: 删除提交

【警告】不要对已经推送到共享分支的提交进行 rebase
```

**注意**：文件放在 `software/` 目录下，使用 `git-` 前缀标识属于 Git 相关主题。

## 八、迭代演化

### v0.1 → v1.0
- 新增文件头元数据要求
- 统一分类标签体系
- 添加状态标记

### v1.0 → v2.0（当前）
- **移除元数据要求**：文件夹分类已足够，简化编写流程
- **移除 TAGS 体系**：避免与文件夹分类重复
- **移除状态标记**：通过文件位置管理状态（draft/ → 正式目录）

### v2.0 → v2.5（当前）
- **目录结构简化**：TIL 目录不再新增分类文件夹
- **前缀命名法**：software/ 目录统一使用 `{前缀}-{描述}.org` 格式
- 知识点依赖图谱（基于文件链接而非元数据）

### v2.5 → v3.0（规划中）
- 自动化前缀检测与分类建议

---

**核心原则**: 【一次记录，永久可用】— 每个 TIL 都应该写得足够清晰，让未来的自己（或他人）能在 30 秒内理解核心内容。