---
skill: 数据融合
trigger: 多源数据需要对齐、消歧、去重时
priority: low
related: [数据体感培养, 知识作为上下文压缩]
---

# 元技能12: 数据融合 — 多源数据对齐与消歧

## Agent 执行摘要

**一句话**：来自不同来源或不同工序的结果，需要对齐、消歧、去重，形成统一、一致的知识视图。
**何时使用**：合并多个 Skill 的输出、整理历史内容、统一分类或标签体系时。
**核心步骤**：
1. **字符串层**：归一化（大小写、别名映射）、去重
2. **实体层**：消歧（同一概念的不同表述合并为一个实体）
3. **结构层**：统一 Schema（字段名、值域、格式）
4. **验证层**：抽样检查融合后的一致性

## 检查清单

- [ ] 字符串已归一化（大小写、标点、别名）
- [ ] 重复实体已识别并合并
- [ ] Schema 统一（字段名、值域一致）
- [ ] 融合后抽样验证，一致性 >95%
- [ ] 保留差异日志（哪些被合并、哪些被修改）

## 详细参考

### 融合层次

| 层次 | 操作 | 示例 |
|------|------|------|
| L1 字符串 | 归一化、去重、别名映射 | `Git` → `git`、`AI` → `ai` |
| L2 实体 | 消歧、规范化、别名合并 | `Git Rebase` = `git-rebase` = `交互式变基` |
| L3 结构 | 统一 Schema、字段对齐 | 不同 TIL 的标记格式统一 |
| L4 关系 | 关联补全、引用修复 | 修复断裂的内部链接 |

### 字符串归一化

```python
# 别名映射示例
ALIAS_MAP = {
    "git rebase": "git-rebase",
    "交互式变基": "git-rebase",
    "rebase": "git-rebase",
    "弹性布局": "css-flexbox",
    "flexbox": "css-flexbox",
}

def normalize(name):
    return ALIAS_MAP.get(name.lower().strip(), name.lower().strip())
```

### 实体消歧规则

1. **精确匹配** — 字符串完全一致 → 同一实体
2. **前缀包含** — 短名被长名包含，且上下文一致 → 同一实体
3. **别名映射** — 在已知别名表中 → 同一实体
4. **上下文推断** — 同一文件中出现的相关概念 → 辅助判断
5. **人工兜底** — 以上均无法判断 → 保留差异，人工审查

### Blog 场景示例

**场景**：整理 `content/til/software/` 下所有 Git 相关 TIL，发现文件名不统一

```
# 融合前
git-rebase.org
git-stash.org
advanced-git.org      ← 缺前缀
git-tutorial.org      ← 过于笼统

# 融合后
git-rebase.org
git-stash.org
git-advanced-usage.org  ← 统一前缀+具体描述
git-workflow.org        ← 按内容重命名
```

**消歧日志**：
```
[合并] git-tutorial.org → git-workflow.org（内容实际讲的是 workflow）
[重命名] advanced-git.org → git-advanced-usage.org（统一前缀）
```

---

**核心洞察**：融合的目的不是消除差异，而是结构化地呈现差异，让用户基于完整信息做出判断。
