# blog 重构：Hugo → org-mode + Emacs 内置发布

- 日期：2026-10-17
- 状态：设计待审阅（未实施）
- 决策者：用户；分析/探针：Hermes Agent

---

## 1. 目标

1. 内容源**全部改为 org-mode**，Markdown 退役
2. **构建逻辑全部改用 Emacs 内置能力**（`org-publish` + 派生的 export backend），不再使用 Hugo
3. 三个 org 能力全部可用：**babel 求值**、**agenda**、**roam 式互链**
4. 站点保持可访问，URL 结构不变

## 2. 明确的非目标

- **不追求界面与现状一致**（此约束已由用户解除）
- 不使用 Tailwind，不使用 utility class，**HTML 不写任何 class**
  （注意：零 class ≠ 零属性。`id` 与 `data-*` 保留——PageFind 靠 `data-pagefind-*` 圈定索引范围，
  评论容器靠 `#Comments`，移动端菜单靠 `#menu-btn` / `#mobile-menu`）

- 不做 fingerprint / SRI
- 不保留关系图谱页、悬浮预览卡片

## 3. 已定决定

| 项 | 决定 |
|---|---|
| 样式 | 一个全局 CSS 文件 + 标签/结构选择器；HTML 零 class、零内联 style |
| JS | 删关系图谱；**保留** 全站搜索、评论、命令面板、回到顶部、移动端菜单、相册 |
| CSS 构建 | 无。不再有 CSS 构建步骤 |
| JS 构建 | 产物冻结提交；源仍是 TS，改动时临时跑一次 esbuild |
| 索引层 | 保留 wikilink-map、backlink-index；**砍掉** previews / graph 的 JSON 端点 |
| 内容迁移 | 1544 篇 md → org，一次性；`.md` 纯文本镜像改为 `.org` |
| 仓库外脚本 | Hermes cron 侧写 `content/` 的脚本**纳入改造范围** |
| 验收 | **正文文本零丢失**（不再要求 DOM 结构一致） |
| node 依赖 | **尽可能摆脱**。CI 常规流程只需 Emacs（+ htmlize）+ PageFind 官方二进制；node 仅在需要重建 JS 产物时才用（非 CI 常规步骤） |

## 4. 架构

```
org/            唯一源（Emacs 工作台：roam / agenda / babel 都在这里）
  │
  ├─ Emacs batch 导出器（纯 elisp）
  │    ├─ 站点模型：扫描 org/ → 页面对象
  │    ├─ 索引层：wikilink-map、backlink-index
  │    ├─ 渲染层：页面骨架 + 正文（产出零 class 的朴素 HTML）
  │    └─ 导出层：单文档管线（CJK 强调、wikilink、裸 HTML、标点）
  │
  └─ public/  →  CF Workers（assets + worker.js 不变）

外部（构建后跑，与生成器无关）：
  pagefind --site public        # 搜索索引
  node scripts/embed.mjs        # 语义索引（需改为读 org/）
```

## 5. 组件分解

| 文件 | 职责 |
|---|---|
| `site-model.el` | 全站扫描，产出页面对象（title/date/tags/section/permalink/lang/正文） |
| `site-index.el` | 派生数据：wikilink 解析表、backlink 索引 |
| `render.el` | 页面骨架与正文渲染（单文件，不拆分） |
| `doc-export.el` | 派生 backend + 单文档导出管线（四条硬伤修复都在这里） |
| `publish.el` | `org-publish-project-alist` 项目定义 + 构建入口 |
| `scripts/build.sh` | CI 入口：装 Emacs（pin 版本 + sha256）→ 跑 build → pagefind → embed |

管线顺序是硬约束：**建模 → 建索引 → 渲染输出**（渲染阶段要查表）。

## 6. 内容迁移方案

- 转换器基于 `md2org.py`（已有，2026-08 验证过 101 篇）扩展，必须处理：
  - `[[slug|desc]]` → `[[slug][desc]]`（406 篇在用，注意表格里的 `\|` 转义）
  - 裸 HTML → `@@html:...@@` 或 `#+BEGIN_EXPORT html`（org 默认转义正文里的裸标签）
  - 代码块、表格、脚注、图片、引用块
  - front matter → org 关键字（`#+TITLE` / `#+DATE` / `#+TAGS` / `#+STATUS` / `#+HEADER` / `#+LOCATION` / `#+ALIASES`）
- 节奏：**先试点 20 篇**（覆盖 src block / 表格 / 脚注 / CUSTOM_ID / quote / 裸 HTML / wikilink）→ 人工确认 → 全量 1544 篇 → 全站文本级校验
- 校验标准：逐篇正文文本与旧产物比对，**零丢失**（结构差异可接受）
- 存量一次性转换；转换脚本进 `scripts/`，随 git 走

## 7. CI 方案

- `scripts/build.sh`：下载预编译 Emacs 二进制 + sha256 校验（与现在下载 Hugo 二进制的模式同构），版本 pin 在一处
- htmlize 是必需的外部包（**不是 Emacs 内置**），需一并 pin
- 部署链不变：CF Workers Builds → `scripts/build.sh`

## 8. 验收与闸门

- 正文文本零丢失（逐篇比对）
- 输出页面集合与旧站一致（数量 + 路径）
- 搜索（PageFind）、评论、命令面板、相册、菜单、回到顶部实测可用
- 三条既有闸门（links / unicode / external）改造为扫 `org/` 后仍在 CI 里跑

## 9. 已知风险与陷阱（探针实测，全部有证据）

1. **CJK 强调**：`org-element--parse-generic-emphasis` 把边界硬编码为 ASCII，`org-emphasis-regexp-components` **不影响解析**（官方文档明说 + 上游 bug 报告 + 本机决定性实验：把边界改成极端值，解析行为不变）。上游 Unicode patch 未发布（在 9.8 分支）。
   **解法**：导出前在 CJK 边界的强调标记两侧插入 ZWSP，导出后用 filter 过滤掉。源文件不污染。实测通过（`这是*粗体*字` → `这是<strong>粗体</strong>字`）
2. **裸 HTML**：ox-html 默认转义正文里的 `<sub>` 等标签。解法：派生 backend 覆写 `plain-text` transcoder，白名单放行。实测通过
3. **代码高亮**：`htmlize` 不是内置包（ELPA/Debian 包），缺了会静默降级为纯文本。必须 pin
4. **标点转换**：md 侧 typographer 把 `------`→`——`、`......`→`……`、`---`→`—`，org 不转换。需在导出层补等价规则
5. **引用块内多段**：org 的 quote block 与 md 的引用块对空行的处理不同，段落切分有差异
6. **表格 / 脚注结构**：ox-html 输出 `<colgroup>` + `org-left` class、`class="footref"` 脚注结构，与目标不同，需覆写 transcoder
7. **精确写法要求**：`org-emphasis-regexp-components` 必须在 `require org` **之前**设置；用 `[:nonascii:]` 会破坏正则（实测全部强调失效），必须显式列全角标点 + CJK 范围
8. **切换当天的最大坑**：Hermes cron 侧有 6-8 个脚本直接写 `content/**/*.md`（`sync-linkding-to-blog`、`essay-finds-fetch`、`code-finds-fetch`、`sentences-daily`、`neodb-name-lookup` 等）。不一起改造，切换当天就会被写回 md
9. **fingerprint 移除的副作用**：文件名固定后 CF 缓存会导致更新不生效，需用 `?v=<构建时间戳>` 处理

## 10. 分阶段

| 阶段 | 内容 | 退出条件 |
|---|---|---|
| P0 | 探针（已完成） | 四条硬伤全部有可运行解法 |
| P1 | 导出层 + 迁移器 + 20 篇试点 | 试点文本零丢失，页面可读 |
| P2 | 全量迁移 1544 篇 | 全站文本校验通过 |
| P3 | 渲染层（各页面类型，零 class） | 所有页面类型都有产出 |
| P4 | 索引层（wikilink-map / backlink-index） | 406 篇 wikilink 全部解析，反向链接正确 |
| P5 | 全局 CSS（标签选择器） | 站点可读、可导航、移动端可用 |
| P6 | CI 切换 + cron 脚本改造 | CF Workers Builds 跑通，cron 不再写 md |
| P7 | 清理（Hugo / package.json / layouts / assets） | 仓库无 Hugo 残留 |

## 11. 探针证据位置

`~/.hermes/cache/scratch/`（一次性，24h 后自动清理）：
- `probe.org` / `probe2.out.html` — 全要素导出
- `diag5.el` / `diag7.el` — CJK 强调的决定性实验
- `org-html-site2.el` / `org-html-page.el` — 三条修复的合成版
- `probe-derived.el` — 派生 backend 验证
- `pretty-girl.org` / `pretty-girl.out.html` — 真实文章端到端（文本零丢失，8 处标点差异）

---

## 附：为什么这是可行的（对比最初的 A 路评估）

最初评估认为 A 路是「用 elisp 重写一个静态站生成器」，成本在模板层（53 文件 / 2454 行 / 1307 个动作块）和资产管线（Tailwind + esbuild + fingerprint）。

用户后续的决定移除了这两块：

- 不追求界面一致 → 模板层不必复刻，只需产出朴素 HTML
- 样式改标签选择器、无 CSS 构建 → 资产管线只剩「复制静态文件」
- 删图谱 → 最大的 JS 产物（1.1M vis-network）消失
- 砍 previews / graph JSON → 索引层只剩两项

剩下的核心工作是：**内容迁移（1544 篇）+ 导出层（四条硬伤已解）+ 一份手写 CSS + CI**。

---

## P1 实测结论（2026-10-17）

**产出**：`scripts/org2site/`（`md2org.py` / `export.el` / `verify_text.py` / `pilot.sh` / `tests/`）
**测试**：pytest 31 passed、导出冒烟 10 项全绿（CJK 粗斜体、汉字紧邻、裸 HTML、wikilink、代码块 data-lang、无 ZWSP、零 class、无 TOC）
**试点**：20 篇（覆盖 wikilink / 表格 / 代码块 / 脚注 / 裸 HTML / 引用块 / 单文件整页 HTML），**9 篇正文文本零差异**

### 已解决（累计 17 项）

标题未转换、脚注未转换、`{#id}` 属性残留、`<!--comment-->` 残留、`{{< figure >}}` 短代码、标题内联语法、斜体误伤 `*.md`、CJK 强调失效、verbatim 全角边界、裸 HTML 被转义、wikilink 丢失、代码块中文八进制转义、UTF-8 写入报错、filter 顺序倒置、pilot 读 stdin 被 emacs 吃掉、比对范围错（改为只比 `div.prose`）、**占位符嵌套泄漏 `\x00`**、**declass 误删代码块内的 class**、**zws 脚注模板丢内容**

### 仍存在的差异（试点剩余 11 篇）

| 类别 | 篇目 | 判定 |
|---|---|---|
| 脚注编号显式呈现（`1`、`2` 前缀） | arrival / emacs-install / the-road-not-taken | 可接受（编号是必要信息，CSS 可隐藏） |
| 旧站双重转义 `&gt;`，新站正常 | get-github-stars | 新站更正确 |
| 旧站未解析的链接/行内代码被正确渲染 | vue | 新站更正确 |
| 整页内联 `<style>`/`<script>` 不支持 | search | 平台差异，P3 重做该页 |
| `=x=` 被渲染成代码样式（旧站显示字面） | git / mdo-code-guide | 新站更美观，可接受 |
| 时间戳文本的 `\<` `\>` 转义 | hugo-could-not-render-org / where-have-been | 已加 filter，**待复验** |

### 给 P2（全量迁移）的前置

1. 转换器已覆盖的语法以 `tests/test_md2org.py` 为准；全量迁移前先跑一次「**只转换不导出** + 语法残留扫描」（在 org/ 里搜 `{#`、`{{<`、`` ``` ``、`<!--`、`\x00`）
2. `verify_text.py` 的 `_EQUIV` 已知等价映射需要随差异白名单一起扩充
3. 全量迁移后必须重跑三条闸门（links / unicode / external）的 org 版本
