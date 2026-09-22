---
title: 长文本 embedding 不要硬截断
status: draft
date: 2026-09-21T02:46:00+08:00
header: Programming
---

## 问题

给长文本生成向量时，常见做法是先截断到固定长度（比如 3000 字符）再送模型。这个数往往是拍脑袋定的，代价又看不见：**被砍掉的尾巴不报错、不告警，只是那一页的向量从此只代表开头**。

本博客语义索引（1526 页 / BGE-M3 / 1024 维）实测，按 3000 字符硬截断的代价：

| 截断阈值 | 被截断页数 | 丢弃字符 |
|----------|-----------|----------|
| 3000（原值） | 185（12.1%） | 975,466 |
| 6000 | 68 | 623,405 |
| 8000 | 49 | 505,760 |
| 20000 | 12 | 175,845 |

最惨的一页 71,976 字符只 embed 了前 3000（4.2%）。长文正是最该被检索到的那批内容。

## 做法：chunk + 页面级聚合

1. 页面全文按 3000 字符切段，切点回退到最近的句末标点（`。！？；;.!?…`），避免切在句子中间
2. 每段单独送 embedding API
3. 同一页的所有段向量求平均，再 L2 归一化 → 每页一行（与原索引格式完全一致，bin 仍是定长）
4. 尾部不足 200 字符并入上一段，省掉「3 个字的尾巴也烧一次 API 调用」

切点回退的写法（Node）：

```js
let end = Math.min(pos + limit, text.length);
if (end < text.length) {
  // 只在窗口后半段找切点；找不到就硬切
  const from = pos + Math.floor(limit / 2);
  let cut = -1;
  for (const m of text.slice(from, end).matchAll(/[。！？；;.!?…]+[\s"”’)]*/g)) {
    cut = from + m.index + m[0].length;
  }
  if (cut > pos) end = cut;
}
```

一个容易混淆的点：BGE-M3 对**单个 chunk 内部**用的是 `[CLS]` token 的归一化 hidden state，不是 mean pooling（论文 §3.1：`e = norm(H[0])`）。这里说的 pooling 是**页面级**的——把同一页多个 chunk 的向量平均，属于应用层聚合，跟模型内部怎么产生单个向量无关。

成本：1526 页 → 1958 个 chunk（调用量 +28%），耗时 46 秒。

## 验收：逐页比对新旧向量

改完不能只看「脚本跑通了」。留一份旧 bin 做对照，逐页算 cos：

- **未截断的 1341 页：cos 0.9999** —— 只是重跑的浮点噪声，说明改动没污染不该动的页
- **被截断的 185 页：mean cos 0.9104（min 0.7780）** —— 这些页的向量真的换了

判据是双向的：若全站都掉到 0.9x，说明切分或池化写错了；若被截断页也接近 1.0，说明切分根本没生效。

侧证来自下游消费方：`data/related.json` 里有相关笔记的页 1284 → 1347，关系数 5029 → 5746。

## 取舍

**mean pooling 会稀释超长杂记的主题。** 48K 字符的大杂烩笔记，各段各说各的，平均后趋近「泛技术」，语义邻居会从具体的 `coding / how-to` 变成 `年度总结 / javascript`。分段越碎、主题越散，稀释越明显。

要更准得上多向量 late-interaction（ColBERT 式：保留各段向量，检索时取 max-sim）。BGE-M3 本身就同时输出 dense / sparse / colbert 三种向量，论文也针对长文本提了 MCLS 策略（多个 CLS token 聚合，推理期生效）—— 但那是模型内部的事，late-interaction 落到应用层要改存储格式（定长变变长）和检索端，收益/成本不划算，没做。

## 参考

- [BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation](https://arxiv.org/abs/2402.03216) — §3.1 dense retrieval 用 `[CLS]`；MCLS 长文本策略见 §3.3 / Appendix B.2
- [BGE 文档：BGE-M3](https://bge-model.com/bge/bge_m3.html)
