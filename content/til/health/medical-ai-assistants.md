---
title: 医疗 AI 问答助手与循证搜索引擎
status: draft
date: 2026-09-14T00:06:43+08:00
---

2026 年医疗 AI 的分水岭不是「哪个模型更聪明」，而是**答案有没有锚到可以点开的文献段落**。按这条标准，工具分成两类：给医生用的循证助手确实可靠；给公众用的健康问答助手，独立评测里普遍不达标。

- 要真正可靠，绕不开**执业资质门槛** —— OpenEvidence、氢离子、DeepEvidence 都要求 HCP 身份
- 没有资质也别硬凑 —— 患者端里只有蚂蚁阿福做到了「AI 答完可请三甲医生复核」
- 任何一款都不能当诊断用。这不是免责套话，见下面的实测数据

## 面向医生/医学生：循证，免费，需资质

| 工具 | 语言 | 定位 | 免费模式 | 注册门槛 |
|------|------|------|----------|----------|
| OpenEvidence | 英文 | 临床决策支持 | 全功能免费无限，药企广告支撑 | 须验证 HCP 身份 |
| 氢离子 | 中文 | 医生端循证问答 + 文献/指南 | 免费，官方称三年不考虑商业化 | 医生身份 |
| DeepEvidence | 中文 | 循证决策 + 科研 | 八大核心功能全免费开放 | 医生/科研人员 |

**OpenEvidence** 是这个赛道的标杆：约 2/3 美国医生在用，另有 120 万国际用户。美国医生用 NPI 秒过验证；国际医生要上传资质人工审核，2026-09 才与加拿大 MINC#NIMC 打通通道 —— 非美身份存在认证摩擦。商业模式是药品/器械广告，CPM $70–1000+，是社交媒体的十倍以上，所以在医生端能维持免费无限。

**氢离子**（阿里健康）是中文里对标它最紧的产品：与中华医学会内容合作，独家拿到 BMJ 集团 70 本期刊，中英对照翻译不限次免费。定位明确只做医生端，不做患者咨询。

**DeepEvidence**（梅斯医学）走 RAG + 医学知识图谱，功能全免费。

## 面向公众：免费，但可靠性有硬伤

| 工具 | 免费模式 | 关键限制 |
|------|----------|----------|
| 蚂蚁阿福 | 基础功能免费；会员据报道年费 399 元 | 仅中文 |
| ChatGPT Health | 免费版/Go/Plus/Pro 均可用 | 仅美国 18 岁以上；病历整合限美国 |
| 通用大模型（Kimi/Claude/GPT） | 各有免费额度 | 无引用溯源 |

**蚂蚁阿福**（蚂蚁集团，前身 AQ，2025-12 更名）目前是中文患者端最实用的一个：官方口径月活超 3000 万、单日提问超 1000 万，55% 用户来自三线及以下城市。2026-06 上线「医生把关」—— AI 答完后可一键请三甲医院医生复核，实测约 5 秒匹配到医生。基础问答、报告解读永久免费，深度报告解读等走年费会员。

**ChatGPT Health** 2026-01-07 发布，免费版也能用，但功能和地理位置强绑：仅面向美国境内 18 岁以上用户，电子病历整合也只有美国可用。

## 可靠性证据（2026）

- **OpenEvidence**：*npj Digital Medicine* 2026-08 系统综述（11 项研究）—— 伪引用率显著低于通用大模型；指南类场景表现最强，复杂临床场景不稳定；多数时候是强化而非改变医生的决策。作者同时指出证据基础仍受样本小、方法异质、平台持续迭代的限制。
- **ChatGPT Health**：*Nature Medicine* 2026 分诊压力测试，960 组场景 —— **超过一半的紧急情况没有建议就医**，且频繁漏检自杀意念。NYT 同期独立测试的结论是「不比 Google 强」。Mayo Clinic 和 BBC 都发了提醒。
- **患者端横向对比**：山甲实验室 2026-05 测评，15 款产品对同一个复杂胸闷病例各采样 3 次 —— 通用大模型均分 75.45，垂直医疗产品均分 68.02；前三全是通用模型（ChatGPT 5.5 Thinking 85.23、Claude 4.7 Opus 82.77、Kimi 2.6 79.80）。该报告自陈局限：单轮文本采样，垂直产品的追问按钮和问诊流没被纳入评分。另一轮 14 款测评中讯飞晓医 41.7 分列第 13（二手报道）。

## 文献与证据检索（无门槛 freemium）

- **Consensus** — 医学文献问答，Basic 免费，答案带引用
- **Elicit** — 免费档无限搜索 1.38 亿篇 + 无限摘要，适合做证据表
- **Semantic Scholar** — 完全免费
- **MediSearch** — 4000 万篇同行评审文献，citation-first
- **Medscape** — 免费注册，药物库/疾病参考（是参考库，不是问答）
- **UpToDate / DynaMed / BMJ Best Practice** — 全部付费或机构订阅，个人不划算

## 怎么选

- 查自己的健康问题 → 蚂蚁阿福（中文，免费，能叫真人医生兜底）
- 英文提问 → Kimi / Claude / ChatGPT 这一档通用模型，患者端评测里反而更稳，但要自己盯红旗症状
- 查证据/文献 → Consensus 免费档 + Semantic Scholar
- 有执业资质 → OpenEvidence（英文）/ 氢离子（中文）
- 红旗症状（胸闷不缓解、气短加重、大汗、晕厥、放射痛）→ 直接急诊或 120，不要问 AI

相关：[[references-index|权威医学参考来源]]

## 参考

- [OpenEvidence 官网](https://www.openevidence.com/)
- [OpenEvidence clinical question-answering platform: systematic review of early evaluations — npj Digital Medicine](https://www.nature.com/articles/s41746-026-03077-4)
- [OpenEvidence outside the US: access, verification, and practical alternatives](https://www.iatrox.com/blog/openevidence-outside-us-access-verification-uk-alternatives)
- [Most U.S. doctors are quietly using this AI tool — NBC News](https://www.nbcnews.com/tech/tech-news/openevidence-ai-doctor-medical-physician-login-app-what-npi-uptodate-rcna341064)
- [How Does OpenEvidence Make Money?](https://researchdoc.org/how-does-openevidence-make-money-business-model-explained)
- [ChatGPT Health performance in a structured test of triage recommendations — Nature Medicine](https://www.nature.com/articles/s41591-026-04297-7)
- [Health Advice From A.I. Chatbots Is Frequently Wrong — NYT](https://www.nytimes.com/2026/02/09/well/chatgpt-health-advice.html)
- [ChatGPT 健康重磅登场 — OpenAI](https://openai.com/zh-Hans-CN/index/introducing-chatgpt-health/)
- [什么是 ChatGPT Health — OpenAI Help Center](https://help.openai.com/zh-hans-cn/articles/20001036-what-is-chatgpt-health)
- [AI 医生测评：蚂蚁阿福、字节小荷、京东小康、讯飞晓医…… — 山甲实验室](https://www.faxai.cn/archives/8721)
- [医生集体狂喜：DeepEvidence 全功能免费开放 — 梅斯医学](https://www.medsci.cn/article/show_article.do?id=608a923e88cb)
- [支持精准溯源、一键定位 阿里健康氢离子与中华医学会达成合作 — 新华网](http://www.news.cn/tech/20260130/3ad4f5d84ba9414094ff453e78513789/c.html)
- [中国 500 万医生的新 AI：顶刊独家联手，卷的就是证据源](https://www.qbitai.com/2026/05/418491.html)
- [蚂蚁集团 AQ 升级为「蚂蚁阿福」— 官方新闻稿](https://www.antgroup.com/news-media/press-releases/1765785600000)
- [蚂蚁阿福测试「医生把关」功能 — 经济参考报](http://jjckb.xinhuanet.com/20260615/658b848d303c491286f5a7a6a4ed8dcb/c.html)
- [Pricing — Elicit](https://elicit.com/pricing)
