---
skill: 知识作为上下文压缩
trigger: 设计知识管理架构、评估知识图谱价值时
priority: low
related: [数据融合]
---

# 元技能05: 知识作为上下文压缩 — KG 的价值论证

## Agent 执行摘要

**一句话**：知识的价值在于压缩——用更少的符号表达更多的信息，让 Agent 在有限上下文中获得最大认知收益。
**何时使用**：设计分类体系、标签系统、知识组织方式时。
**核心步骤**：
1. 识别重复出现的查询/决策场景
2. 提取实体和关系，建立别名映射
3. 用结构化格式（YAML/JSON）存储，通过 frontmatter 注入
4. 定期审查压缩率：是否用更少的规则覆盖了更多的场景

## 检查清单

- [ ] 有明确的查询场景驱动（非为了建图谱而建图谱）
- [ ] 实体有唯一标识和别名映射
- [ ] 关系有明确的语义定义
- [ ] 压缩率可量化（规则数/覆盖场景数）
- [ ] 维护成本 < 查询收益

## 详细参考

### 核心思想

**"知识图谱的价值就是上下文记忆的高效压缩"**

- 不压缩：每次查询都携带完整上下文（10,000 字）
- 压缩后：通过图谱关联，只需携带关键节点（100 字）

### 压缩层次

| 层次 | 内容 | 压缩比 |
|------|------|--------|
| L1 字符串 | 归一化、去重、别名映射 | - |
| L2 实体 | 消歧、规范化、别名合并 | 10x |
| L3 事件 | 跨文档合并、多源整合 | 100x |
| L4 SKU | 结构化知识单元拼接 | 1,000x |
| L5 知识图谱 | 全局一致性、关系网络 | 10,000x |

### Agent 实施检查清单

1. 列出 Top 10 重复查询场景
2. 提取实体到 `data/entities.yaml`
3. 定义别名映射表
4. 通过 frontmatter 或配置文件注入 Agent 上下文
5. 每月 review：压缩率是否提升？维护成本是否合理？

### YAML 模板示例

```yaml
# data/entities.yaml
entities:
  git-rebase:
    aliases: [rebase, interactive rebase, git rebase -i]
    category: software
    related: [git-commit, git-branch]
    summary: 交互式修改提交历史

  css-flexbox:
    aliases: [flexbox, flex layout, 弹性布局]
    category: software
    related: [css-grid, css-layout]
    summary: 一维布局系统
```

---

**核心洞察**：压缩即理解 — 理解就是找到更短的描述。AI 的进化不是更长的上下文，而是更好的知识压缩。
