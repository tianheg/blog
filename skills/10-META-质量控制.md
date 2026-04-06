# 元技能10: 质量控制 — 自动化质检体系与工具链设计

**定位**: 指导所有工序设计lint/validate工具，构建自动化质量保障体系。

## 一、质量控制 vs 反思

| 维度 | 质量控制（QC） | 反思（Reflection） |
|------|---------------|-------------------|
| 检查对象 | 格式、边界、数据完整性 | 语义准确性、分类正确性 |
| 执行方式 | 规则脚本自动化 | Agent驱动的智能审查 |
| 时机 | 每次数据变更后立即 | 完成初次生成后，迭代修正前 |
| 成本 | 极低（秒级，无LLM成本） | 中高（分钟级，有LLM成本） |
| 输出 | PASS/FAIL + 错误位置 | JSON修正建议 + 新模式 |

## 二、五层质检体系

```
L5: 跨工序一致性（实体索引 ↔ 标注文本一致性）
L4: 业务逻辑验证（时序合理性、约束一致性）
L3: 数据完整性（必填字段、值域约束、枚举值）
L2: 语法正确性（标注边界、JSON格式、正则匹配）
L1: 文本完整性（编码正确、原文不变、文件存在）
```

## 三、Lint工具设计规范

### 命名规范
- `lint_*.py` — 格式/语法检查
- `validate_*.py` — 数据完整性/业务逻辑
- `cross_validate_*.py` — 跨工序一致性

### 输出格式
```bash
文件: chapter_md/001.md
❌ [L2-边界完整性] 第42行
   未闭合的标注: 〖@名称
   建议: 补全闭合符号 → 〖@名称〗
⚠️  [L3-数据完整性] 第67行
   空标注: 〖=〗
   建议: 删除空标注或补全内容
```

## 四、检查优先级

从L1到L5逐层执行，低层级未通过时不执行高层级检查：
```bash
python lint_text_integrity.py      # L1
&& python lint_markdown.py          # L2
&& python validate_data_schema.py   # L3
&& python validate_logic.py         # L4
&& python cross_validate.py         # L5
```

## 五、质量指标

| 指标 | 定义 | 目标 |
|------|------|------|
| Lint通过率 | 通过lint的文件数/总文件数 | 100% |
| 错误密度 | 错误数/总字符数 | <0.1% |
| 跨工序一致性 | 一致性检查通过项/总检查项 | >95% |

## 六、CI/CD集成

```yaml
name: Quality Control
on: [push, pull_request]

jobs:
  lint:
    steps:
      - name: L1-L2 格式检查
        run: python scripts/lint_markdown.py --all
      - name: L3-L4 业务逻辑检查
        run: python scripts/validate_logic.py --all
      - name: L5 跨工序一致性检查
        run: python scripts/cross_validate.py
```

## 七、总结

**质量控制是知识库建设的安全网**:
- L1-L2拦截80%低级错误（格式/语法）
- L3-L4拦截15%中级错误（逻辑/约束）
- L5拦截5%高级错误（一致性）

**核心洞察**: 质量控制≠反思 — QC是规则驱动的快速检查，反思是语义驱动的智能审查。