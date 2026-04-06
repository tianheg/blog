# TIL 编写规范 — Today I Learned 知识管理 SKILL

**定位**: TIL (Today I Learned) 内容的结构化编写与维护方法论

## 一、核心理念

> **"每一个知识点都应该可被快速检索、溯源、复用"**

TIL 不是简单的笔记堆积，而是经过结构化处理的知识单元 (SKU)。

## 二、文件结构标准

### 2.1 文件名规范

```
格式: {topic}-{subtopic}.org
示例: 
  - git-rebase.org
  - health-sleep.org
  - python-decorator.org

避免:
  - 无意义编号 (001.org, note1.org)
  - 过长名称 (>50字符)
  - 特殊符号 (空格、中文标点)
```

### 2.2 文件结构模板

```org
* {标题}
  
** 问题/场景
{为什么需要这个知识？什么场景下用到？}

** 解决方案/知识点
{核心内容，代码示例、步骤说明}

** 延伸阅读
- [[URL][描述]]
- [[URL][描述]]

** 相关 TIL
- [[file:related-topic.org][相关主题]]
```

### 2.3 元数据（可选）

如需添加元数据，使用以下格式：

```org
* {标题}
:PROPERTIES:
:DATE: {YYYY-MM-DD}
:TAGS: {分类标签}
:SOURCE: {来源URL}
:STATUS: {draft | review | published}
:END:

#+BEGIN_ABSTRACT
{一句话核心洞察 — 50字以内}
#+END_ABSTRACT
```

## 三、分类体系（TAGS）

### 3.1 一级分类

| 标签 | 说明 | 示例 |
|------|------|------|
| #tech | 技术/编程 | #python #git #linux |
| #tool | 工具使用 | #emacs #docker #vim |
| #health | 健康/生活 | #sleep #exercise #diet |
| #learn | 学习方法 | #reading #note-taking |
| #career | 职业发展 | #interview #management |
| #life | 生活技巧 | #cooking #travel #finance |

### 3.2 状态标记

| 状态 | 含义 | 使用场景 |
|------|------|----------|
| draft | 草稿 | 刚记录，待整理 |
| review | 审核中 | 已整理，待验证 |
| published | 已发布 | 确认可用 |

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

## 五、质量控制检查清单

### 5.1 提交前自检

- [ ] 文件名符合规范
- [ ] 文件头元数据完整
- [ ] 有 #+ABSTRACT 摘要
- [ ] TAGS 使用规范标签
- [ ] 代码块指定语言
- [ ] 外部链接可访问
- [ ] 无临时文件 (*.org~)

### 5.2 定期审查

- [ ] 检查 broken links
- [ ] 更新 draft → review → published
- [ ] 合并相似 TIL
- [ ] 归档过时内容

## 六、工具链

### 6.1 Lint 脚本

```bash
# 检查文件名规范
./scripts/til-lint.sh

# 检查链接有效性
./scripts/til-check-links.sh

# 统计 TIL 分布
./scripts/til-stats.sh
```

## 七、示例

### 7.1 完整示例

```org
#+TITLE: Git Rebase 交互式变基
#+DATE: 2024-03-15
#+TAGS: #tech #git #workflow
#+SOURCE: https://git-scm.com/docs/git-rebase
#+STATUS: published

#+BEGIN_ABSTRACT
交互式 rebase 允许修改提交历史：合并、拆分、重排、修改提交信息。
#+END_ABSTRACT

* Git Rebase 交互式变基

** 问题/场景
需要清理提交历史，使其更整洁后再推送到远程。

** 解决方案

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

** 延伸阅读
- [[https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%8F%98%E5%9F%BA][Pro Git - 变基]]

** 相关 TIL
- [[file:git-cherry-pick.org][Git Cherry Pick]]
- [[file:git-reset.org][Git Reset]]
```

## 八、迭代演化

### v0.1 → v1.0
- 新增文件头元数据要求
- 统一分类标签体系
- 添加状态标记

### v1.0 → v1.5（规划中）
- 增加难度等级标记 (#beginner #intermediate #advanced)
- 增加预计阅读时间
- 增加知识点依赖图谱

---

**核心原则**: 【一次记录，永久可用】— 每个 TIL 都应该写得足够清晰，让未来的自己（或他人）能在 30 秒内理解核心内容。