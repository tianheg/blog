---
title: 'Cognitive Load is what matters'
status: draft
date: 2026-07-08T20:33:17+08:00
---

与其追逐层出不穷的"最佳实践"，不如回到一个基本约束：**读代码时人脑的工作记忆只能同时容纳约 4 个信息块**（chunk：变量值、控制流、调用链……）。超过这个量，理解就变难，而理解困难直接换算成时间和钱。

作者把认知负荷分两类：

- **固有负荷（intrinsic）** —— 任务本身的难度。减不掉，它就是软件开发的核心。
- **无关负荷（extraneous）** —— 由**信息的呈现方式**造成：作者的炫技、过度抽象、层层继承。这部分可以大幅削减，文章只谈这一类。

几个典型对照（原文用 🧠 → 🤯 标注负荷升降）：

- **复杂条件** `if a && (b || c) && (d && !e)` —— 要在脑里同时抓住 4 个条件，属于过载。
  → 提取有意义的中间变量（`isValid` / `isAllowed` / `isSecure`），代码从「记住条件」变成「读变量名」。
- **嵌套 if** —— 每进一层就往工作记忆里塞一个「当前前提」。
  → 用 **early return** 提前排除，之后只需关注 happy path。
- **继承链** `AdminController extends UserController extends GuestController extends BaseController` —— 改一处要沿链上下追。
  → 组合优于继承。
- **教条式套用微服务 / SOLID / DRY** —— 抽象本身要花钱；收益不明确时它就是净负债。

贯穿全文的判断标准只有一句：**这个抽象让我更容易理解这段代码，还是更难？**

## 为什么在 AI 时代更重要

现在大量代码由 LLM 生成，需要**人脑**去消化。原文专门配了一份 [For AI agents](https://github.com/zakirullin/cognitive-load/blob/main/README.agents.md) 的版本——作者的立场是：AI 写出来的代码同样要过认知负荷这一关，否则只是把复杂度从「写」转移到了「读」。

来源: [zakirullin/cognitive-load](https://github.com/zakirullin/cognitive-load/blob/main/README.md)
