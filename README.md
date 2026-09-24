# blog

[![Generator is Hugo](https://img.shields.io/badge/Generator%20is-Hugo-ff4088?&logo=hugo)](https://github.com/gohugoio/hugo)
[![Source on GitHub](https://img.shields.io/badge/Source%20on-Forgejo-181717?&logo=forgejo)](https://git.tianheg.co/tianheg/blog)
[![Built with Cloudflare Workers](https://img.shields.io/badge/Built%20with-Cloudflare_Workers-orange?&logo=cloudflare)](https://workers.cloudflare.com/)

个人博客站点 - [tianheg.co](https://tianheg.co/)

## 目录

- [项目架构](#项目架构)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [站点理念与内容策略](#站点理念与内容策略)
- [内容规范](#内容规范)
- [模板体系](#模板体系)
- [常用命令](#常用命令)
- [资源存放](#资源存放)
- [输出格式](#输出格式)
- [部署](#部署)
- [站点变更记录](#站点变更记录)

## 项目架构

```
blog/
├── assets/              # 构建时处理的资源
│   ├── css/             # Tailwind CSS 入口（`main.css`）+ 独立样式（`table.css`）
│   └── ts/              # TypeScript 组件（`main.ts`, `graph.ts`）
├── content/             # 网站内容
│   ├── posts/           # 博客文章（长文、随笔、年度总结）
│   ├── til/             # Today I Learned 笔记（知识点、操作步骤）
│   │   ├── software/    # 软件/工具/编程类（flat files, header-based grouping）
│   │   ├── life/        # 生活经验与技巧
│   │   ├── health/      # 健康与医学
│   │   ├── learning/    # 学习方法与思维模型
│   │   ├── career/      # 职业发展与思考
│   │   ├── hardware/    # 硬件设计与工程
│   │   ├── homelab/     # 家庭实验室
│   │   ├── backup/      # 备份方案与策略
│   │   ├── writing/     # 写作
│   │   ├── music/       # 音乐
│   │   ├── media/       # 媒体与内容
│   │   ├── courses/     # 课程笔记
│   │   ├── science/     # 科学
│   │   └── history/     # 历史
│   └── *.md             # 独立页面（about, now, projects 等）
├── layouts/             # Hugo 模板（0.146+ 新结构：无 _default，标识写在文件名里）
│   ├── _partials/       # 可复用组件（head, components, functions）
│   ├── posts/           # 文章专用模板（single.html）
│   ├── til/             # TIL 专用模板（baseof, list, single）
│   ├── footprints/      # 足迹地图（single.html）
│   ├── graph/           # 知识图谱页（list.html + list.json.json）
│   ├── baseof.html      # 所有页面基础框架
│   ├── home.html        # 首页
│   ├── single.html      # 独立单页（About, Now 等）
│   ├── single.markdown.md  # 纯文本源文输出（URL 后加 .md）
│   ├── section.html     # 分类列表页
│   ├── taxonomy.html    # 标签聚合
│   ├── term.html        # 单标签详情
│   └── 404.html         # 404 页面
├── scripts/             # 构建和工具脚本
│   ├── build.sh         # CI 构建脚本（Cloudflare Workers）
│   ├── worker.js        # Cloudflare Worker（静态托管 + 语义搜索 API）
│   ├── generate-embeddings.mjs  # 语义搜索嵌入生成
├── static/              # 静态文件（直接复制到 public/）
│   ├── images/          # 图片资源
│   ├── fonts/           # 字体文件
│   ├── projects/        # 项目展示相关文件
│   └── pagefind-semantic/  # 语义搜索原始文本数据
├── hugo.yaml            # Hugo 配置
├── package.json         # npm 依赖和脚本
├── wrangler.jsonc       # Cloudflare Workers 配置
└── AGENTS.md            # AI agent 上下文（symlink → README）
```

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 静态生成 | Hugo | 标准版，支持 PostCSS/Tailwind |
| 样式 | Tailwind CSS v4 | 通过 `@tailwindcss/cli` 构建 |
| 搜索 | Pagefind | 静态搜索索引，基于构建后的 `public/` |
| 图谱可视化 | vis-network | 分类页 JSON 数据驱动 |
| 部署 | Cloudflare Workers | 参考 hosting-cloudflare-worker |

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Hugo | ≥ v0.140 | 标准版即可，Tailwind v4 需要 |
| Node.js | ≥ 18 | npm 管理依赖（`npm install`） |

首次克隆后执行：

```bash
npm install
```

## 站点理念与内容策略

几条决定内容怎么增删改的原则，动内容前先读：

- **链接会变，不做重定向。** 技术类、时效性强的文章会随时间推移、我理解程度的加深而改链接，或与其他文章合并、简化。如果你发现文章链接 404 了，最好在博客上找找。我不做重定向——维护重定向列表不是一件能坚持很久的事。博客的此时此刻，代表了我此时的状态；内容的改变反映了我状态的改变。
- **内容是活的。** 站上的内容不会静态不变，它永远在变化，永远反映我思维方式的改变、我情绪的变化。它是旺盛生命力的代表——没有它，我只是一个人；有了它，我能冲破现实的枷锁，和无尽的想象力相伴，让自己不断探索生命的奥义。
- **不配图。** 有时候一图胜万语，但我的博客不需要。
- **整理是长期的。** 合并同类文章、删除无价值文章、简化标签分类——自 2022-11-15 起持续在做。
- **写作人称。** 文章中的「他」不单指男性，也包括女性；写作中作者退居二线，多以「你」称呼。
- **内容定位。** 主要是随时学习的记录与生活感想；外语电影首选外语作标题，中文放在文中。

## 内容规范

### 内容格式

| 目录 | 格式 | 原因 |
|------|------|------|
| `content/` 及根目录独立页面 | Markdown (`.md`) | Hugo 原生渲染（Goldmark），2026-09 由 Org Mode 迁移 |
| `content/til/` | Markdown (`.md`) | 笔记类内容，按分类文件夹组织，子分类用 front matter `header` 标记 |

> 2026-09-10 完成 `.org` → `.md` 迁移：1581 篇内容 + 模板（graph-data 链接解析、`about.md` / `-en.md` 判断）+ hugo.yaml（`parser.attribute.block`、typographer 对齐 go-org、脚注 backlinkHTML、TOC endLevel）。转换脚本见 `scripts/org2md.py`。

### 文件命名规则

| 目录 | 推荐格式 | 示例 |
|------|----------|------|
| `posts/` | `{主题词}.md` | `2025.md`, `a-dream.md`, `about-good-posts.md` |
| `til/软件/` | `{前缀}-{描述}.md` | `git-rebase.md`, `css-flexbox.md` |
| `til/其他分类/` | `{描述}.md` | `sleep.md`, `iptables.md` |

### TIL header 标记

扁平化结构下，子分类用 `#+HEADER` 标记，不建立子目录：

```yaml
---
title: Git merge 与 rebase
header: Git
---
```

分类页按 header 分组展示，右侧边栏可折叠筛选。支持多 header（空格分隔）。

**通用约束：**
- ❌ 不能有大写字母
- ❌ 不能有空格
- ❌ 不能有中文标点
- ❌ 避免无意义编号（`001.md`, `note1.md`）

### TIL 笔记边界纪律（2026-09 对照 blackglory.me 树形笔记结论）

Blackglory 的笔记 = 每主题单页深层可折叠概念树（如 Linux 页 199 节点、最深 6 层、700KB）。对照后确认：**TIL 的分类 + #+HEADER 扁平结构是正确设计，不重建深目录树，不把主题合并成巨页**。理由：定位靠检索（Pagefind + 语义搜索），不靠层级导航；扁平结构 URL 稳定、git/STATUS 粒度清晰；巨页移动端不可读。

三条边界纪律：

1. **边界后置、就地生长** — 同主题碎片别急着开新文件或建目录，优先合进现有文件做 `*` 小节。只有文件内部层级到 4 层以上、且各小节需要独立引用时，才拆成新文件。
2. **检索宽容** — 一条内容同属多个 header 时随手放任意一处即可，不纠结归属（Pagefind 兜底）。多 header 参数支持真实多归属，但默认不为此花时间。
3. **深链可用** — Goldmark 按标题文本生成锚点（`#标题文本`，CJK 原样保留；重复标题自动加 `-1` 后缀），文件内小节可被 URL 直达。需要固定锚点时用 `{#custom-id}` 属性。

触发阈值（动边界的信号）：
- header 组 > ~60 篇且成员互相引用频繁 → 合小为大，内部 `*` 树结构化
- 单文件 > ~6 个平级 `*` 小节且语义独立 → 拆文件

### Markdown Frontmatter 示例

```yaml
---
title: 文章标题
date: 2026-01-01T00:00:00+08:00
tags: [标签1, 标签2]
---
```

独立页面（如 `about.md`）通常只需要 `title`。

**TIL 必带整理状态与日期**（状态 2026-09-01 起 / 日期 2026-09-10 起，全库强制）：

```yaml
---
title: 某知识点
status: draft      # AI 生成/代写，未经人工整理；人工复核后改 reviewed
date: 2026-07-19T10:36:24+08:00   # 首次入库时间
header: Linux      # 可选，子分类
---
```

- `til/` 下所有文件必须有 `status`，位于 `title` 下一行
- `date` 紧随 `status`（有 `header` 时在其前），ISO8601 格式 `YYYY-MM-DDThh:mm:ss+08:00`
- 日期语义是**首次入库时间**：新建 TIL 用当天时间；历史文件取 git 首次提交时间（`git log --diff-filter=A --follow`），无 git 历史时回退文件 mtime。2026-09-10 已全库补齐 574 篇
- 日期驱动 `/til/` 的「最近新增」排序（此前 fallback 到文件 mtime，克隆/检出后无意义）
- AI 代写一律 `draft`；用户用自己的话复核/补充后改为 `reviewed`
- 状态色只出现在「悬停预览卡片」与 `assets/ts/components/PagePreview.ts` 的 `statusBadge()`：draft=amber（未复核信号）、reviewed=中性灰（2026-09-20 起；此前是 emerald，随全站去绿统一）。页面上不显示状态小字

### Posts vs TIL 选择标准

| 类型 | 适合内容 | 示例 |
|------|----------|------|
| **Posts** | 长文、年度总结、随笔、书评、需要深度思考的内容 | 年终总结、音乐剧观后感、技术长文 |
| **TIL** | 技术知识点、操作步骤、命令备忘、可快速检索的笔记 | Git 命令、CSS 技巧、配置方法 |

### 标签（Tags）

- `tags` 是唯一的 taxonomy，**语义是栏目级分类**（这篇属于哪个栏目），不是技术关键词（用了哪个工具）
- **不给文章打工具/语言关键词标签**。这类标签已于 2026-09-20 全站移除：`CSS`、`Hugo`、`JavaScript`、`Org-mode`、`Nginx`、`HTML`、`Emacs`、`Linux`、`SSH`、`Cloudflare`、`Algorithm`、`NixOS`、`Arch-Linux`、`img`、`Android`（15 个标签 / 115 篇 / 122 处），技术文章统一收敛到 `技术`
- 当前 28 个标签即分类导航（`/tags/`）：

  随笔 · 技术 · 电影 · 读书记 · 诗作 · 音乐 · English · 健康 · 备忘 · 梦境 · 博客 · 公开课 · 音乐剧 · 年终总结 · 父母 · 剧集 · 纪录片 · 艺术 · 食 · 古文 · 动漫 · 天文 · 给自己的信 · 学习 · 摄影 · 英文用词 · 写作 · 安全

- 新增标签前先确认现有分类覆盖不了；能覆盖就别加
- 一篇文章可以有多个标签（如 `['电影', '随笔']`），但不要为同一维度堆同义词
- 格式：中文标签用单引号、英文裸写，单行数组 → `tags: ['技术', English]`
- `English` 与栏目正交，标记英文文章（英文原创 + 英文版），不与中文栏目混用
- `til/` 不使用标签，文件夹分类 + `header` 已足够
- 删标签等于 URL 消失（`/tags/<slug>/` 直接 404）——改完跑 `npm run check-links` 兜底

### 内部链接与反链（2026-09-11 起）

正文引用其他笔记，两种写法都支持：

- 标准 Markdown：`[显示文字](/til/software/git-rebase/)`
- **Wikilink**：`[[git-rebase]]`、`[[git-rebase|显示文字]]`、`[[笔记本保养#小节]]`

wikilink 依次按 **文件名 → 完整标题 → 标题主名（`——`/`：`/`|` 之前那截）→ front matter aliases** 解析（`layouts/_partials/functions/wikilink-map.html`）。代码块与行内代码里的 `[[…]]` 被屏蔽，不会误解析。

**写错名字也不会产生死链**（三层保证，2026-09-11 起）：

1. **渲染兜底** — 解析不到时渲染成「站内搜索」链接（虚线下划线 + 悬停提示），读者看不到 `[[…]]` 原文，也点不到 404
2. **构建告警** — 构建时 `WARN`，日志里能看到是哪个名字
3. **发布闸门** — `npm run check-links` 汇总「未解析的 wikilink」+「失效内链」并返回退出码 1（`--warn-only` 只报告），且指出是哪个文件/哪一页写错了。判定逻辑复用 Hugo 构建结果，不另写一套解析规则

**写法约定**：

- 站内引用用 `[[文件名]]` —— 文件名是唯一稳定的标识（标题会改、文件名不改），解析也最不容易歧义
- 要中文显示：`[[laptop-maintenance|笔记本保养]]`
- 也可给 frontmatter 加 `aliases: ["笔记本保养"]`，让中文名直接可解析（wikilink-map 认 `.Aliases`）
- 指小节、站外链接、静态文件仍用 Markdown 链接

每篇笔记底部自动渲染 **引用这篇的** 区（反链，见 `layouts/_partials/content/backlinks.html`）：

- 只做 incoming（谁引用了这篇）。出链在正文里本来就有，汇总一遍不增加信息，互链时还会在同一页出现两次
- 数据来自构建时全站扫描一次的关系索引（`layouts/_partials/functions/backlink-index.html`，partialCached），不是每页扫全站（网上常见的 Hugo backlink partial 是 O(n²)）
- 每条附上引用它的那句话（linked mention），超过 6 条自动折叠
- 链接腐烂在构建时暴露：`layouts/_markup/render-link.html` 校验内链，未解析即 WARN

### 链接悬浮预览（2026-09-11 起）

鼠标悬停站内链接弹出预览卡片（状态徽章 / 标题 / 分类 · header · 日期 / 开头摘录，**整卡可点进入**）——gwern.net 的 semantic zoom 做法：先读够再决定要不要跳。

- 数据由 `layouts/previews/list.json.json` 在构建时生成（`/previews/index.json`，约 1540 条 / 580KB，gzip ~150KB）
- 客户端 `assets/ts/components/PagePreview.ts`：懒加载 + 内存缓存 + 空闲预取，不为单个链接发请求；220ms 延迟防误触；视口内智能定位；Esc / 滚动 / 点击即收
- **只在文章/笔记详情页启用**（`baseof.html` 与 `til/baseof.html` 按 `.Kind == "page"` 给 body 打 `data-page-preview`），列表页、首页、图谱页、搜索页不响应悬停
- 只在真实鼠标指针出现时启用（判 `pointerType === "mouse"`，不依赖 `hover: hover` 媒体查询），触摸设备完全不受影响
- 想给某个链接关掉预览：在 `<a>` 上加 `data-no-preview`

### TIL 引用来源格式

TIL 的信息源链接统一放在文件末尾：

- **单一来源** → `来源: [描述文字](URL)`
- **多个来源** → `## 参考` 小节，Markdown 链接列表

```markdown
// 单一来源
来源: [Wikipedia: Asperger syndrome](https://en.wikipedia.org/wiki/Asperger_syndrome)

// 多个来源
## 参考
- [Wikipedia: Information retrieval](https://en.wikipedia.org/wiki/Information_retrieval)
- [Google Scholar Search Tips](https://scholar.google.com/intl/en/scholar/help.html)
```

注意：
- 内联引用（正文中随文出现的链接）不受此约束
- 推荐阅读/延伸资源不属于"信息源"，不用加到 `## 参考`，用 `### 推荐资源` 或其他合适的小节标题

## 模板体系

| 模板 | 用途 |
|------|------|
| `baseof.html` | 所有页面基础框架（HTML 骨架） |
| `home.html` | 首页 |
| `single.html` | 独立单页（About, Now, Projects 等） |
| `posts/single.html` | 博客文章详情页 |
| `til/single.html` | TIL 笔记详情页 |
| `section.html` | 分类列表页（Posts, TIL 索引等） |
| `graph/list.json.json` | 知识图谱 JSON 数据 |
| `_shortcodes/` | 自定义 Hugo 短代码 |

### 配色约定（2026-09-20 起）

全站只有**一套强调色**：`ink` 墨蓝，定义在 `assets/css/main.css` 的 `@theme`（`--color-ink-50..950`）。
正文链接一律 `prose-a:text-ink-600 dark:prose-a:text-ink-400`，
TIL 与文章页同一套；TIL 此前的 emerald 系（`#059669` 在暖纸底上仅 3.46:1，未达 AA）已全站退役。
标识类 UI（站名、header 徽章、返回顶部、`reviewed` 徽章）用中性灰，强调色只给链接与交互态。

**正文链接的下划线（2026-09-20 改）：常驻淡下划线，hover 加浓。**
规则在 `assets/css/prose.css`（作用域 `.prose-links`，挂在 `posts/single.html`、`single.html`、
`til/single.html` 三处正文容器上）：静止 = `currentColor` 45% alpha、1px、`text-underline-offset: .24em`；
hover = 实色 `currentColor`。此前是「静止无下划线、只在 `prose-a:hover:underline` 时出现」——
那条规则包在 `@media (hover:hover)` 里，**触屏设备的媒体查询永不匹配**，手机上链接只剩颜色可辨，
而 ink 是低彩度色，等于没有链接提示。作用域必须限定在正文容器：`<body>` 上也带 `prose` 类，
写全站 `.prose` 会把导航、按钮、标签 chip 一起卷进来；标记类链接用 `:not(.no-underline)` 排除。
列表页标题**不在此范围**（排版上是条目名，不是正文里的指向）。

### 字号阶梯（2026-09-20 定案：正文 16 / 列表条目 15 / 元信息 13）

**移动端与桌面同一套，不做任何 `@media` 分档。**

| 用途 | 值 | 落点 |
|---|---|---|
| 正文（文章 / TIL / 独立页） | `prose-p:text-[16px] prose-p:leading-[1.85]`（`li` 同） | `posts/single.html`、`single.html`、`til/single.html` 三处容器 |
| 列表页条目 | `text-[15px]` | `post-list-item.html`、`home.html`、`taxonomy.html`、`til/list.html`、`_partials/til/dashboard.html` |
| 元信息（日期 / 篇数计数） | `text-[13px] tabular-nums text-gray-600 dark:text-gray-400` | 同上 |
| 表格 / 代码块 | 15px（移动端 14）/ 14px | `assets/css/table.css` / `prose.css` |
| 页面 H1 / H2 | 由 prose 的 em 比例决定（16px 基准 → h1 36 / h2 24） | 模板只定 h1 的 `text-[28px]`（`/posts/`、`/til/`）等少数几处 |
| UI 层（TIL 侧栏、TOC 13px、反链/相关 14px、⌘K 14px、页头导航） | 不参与上面两档 | 界面不是内容，别跟着正文一起涨 |

两个坑（2026-09-20 踩过）：

1. `layouts/baseof.html` 的 `<body>` 上曾有 `lg:prose-sm` —— ≥1024px 把 prose 基准从 16px 压到 **14px**，
   于是**桌面比手机还小**，且中文一行 52 字（舒适区 25–35）。动字号先查这一行
2. prose 的标题是 **em** 换算：改基准会连带动 h1/h2（14 → 16 时桌面 h1 30 → 36、h2 20 → 24）。
   只想动正文就在容器上显式写 `prose-h1:text-[30px]`，别指望标题不动

次要文本另有两个 token（2026-09-20 加）：小字一律 `text-gray-600 dark:text-gray-400`（6.95:1）；
页头/栏头导航与 ⌘K 图标用 `text-muted`（`#646c7c`，暖纸 4.85:1）。旧的 `text-gray-500` 已全站停用 ——
它在暖纸底上只有 4.45:1，差 0.05 不到 AA（脚本实测，非目测）。

改配色只动 token，改完跑下面这行确认没有残留：

```bash
grep -rn 'emerald-\|text-blue-\|bg-blue-\|fill-blue-\|outline-blue-' layouts/ assets/ content/ \
  --include='*.html' --include='*.ts' --include='*.css' --include='*.md'   # 期望 0 命中
```

## 常用命令

```bash
# 开发服务器（含热重载）
npm run dev

# 构建站点
npm run build

# 构建 + 生成搜索索引（完整发布流程）
npm run all

# 仅生成搜索索引（需先构建）
npm run pagefind

# 生成语义搜索索引（调 Cloudflare Workers AI，需先 build；改动内容后发布前必跑）
npm run embed
```

### 新建内容工作流程

1. 根据内容类型选择 `content/posts/` 或 `content/til/` 下的正确分类
2. 按命名规范创建 `.md` 文件，填写 YAML frontmatter
3. 运行 `npm run dev` 本地预览
4. 内容完成后运行 `npm run all && npm run embed` 构建并更新搜索索引（关键词 + 语义）
5. 提交变更

## 资源存放

| 资源类型 | 存放位置 | 说明 |
|----------|----------|------|
| 图片（内容引用） | `static/images/` | 直接复制到 `public/images/` |
| 图片（构建处理） | `assets/` | Hugo 管道处理（当前项目较少使用） |
| 字体 | `static/fonts/` | 直接复制 |
| 项目展示文件 | `static/projects/` | 直接复制 |
| CSS | `assets/css/` | Tailwind 入口文件 |
| JS/TS | `assets/ts/` | TypeScript 组件 |

**注意：** `public/` 是 Hugo 构建输出目录，属于生成产物，请勿手动修改其中的文件。

## 输出格式

| 页面类型 | 输出 | 说明 |
|----------|------|------|
| **首页** | HTML + SectionsRSS | SectionsRSS 是按分类（section）分组的 RSS |
| **单页** | HTML + Markdown | 文章、TIL、独立页面；Markdown 为纯文本源文，见下节 |
| **分类页** | HTML | 知识图谱数据另走 `/graph/index.json`（见下） |
| **标签页** | HTML | 标签聚合列表 |
| **标签详情** | HTML | 单个标签下的内容列表 |

### 纯文本源文（页面 URL + `.md`）

任意单页 URL 后加 `.md` 即得该页纯文本源文：`/posts/2019/` → `/posts/2019.md`，`/til/software/a11y/` → `/til/software/a11y.md`。

- 由 Hugo 内置 `markdown` output format 生成（`hugo.yaml` 的 `outputFormats.markdown` 开 `ugly: true` —— 文件落在 `posts/2019.md`，而不是默认的 `posts/2019/index.md`）
- 模板 `layouts/single.markdown.md` 输出 `# 标题` + `.RawContent`（源文件正文）：不含 front matter，wikilink 保持 `[[…]]` 原样，短代码不展开
- 页面 `<head>` 带 `<link rel="alternate" type="text/markdown">`，便于阅读器/爬虫/LLM 发现（`_partials/head/markdown-link.html`）
- `static/_headers` 把 `*.md` 的 Content-Type 覆盖为 `text/plain; charset=utf-8`：CF 对 `.md` 默认发 `text/markdown` 且**不带 charset**，浏览器会按 latin-1 解码 → 中文乱码。（注意：CF 静态资产是 **assets-first**，Worker 脚本收不到资产请求，改不了这些响应头，必须走 `_headers`）
- 只对 `kind=page` 生效（`outputs.page`）；首页、列表页、图谱页等非 md 生成的页面没有

### 搜索索引

- 关键词搜索由 **Pagefind** 提供
- 索引基于 `public/` 构建后的 HTML 生成
- **必须先 `npm run build`，再 `npm run pagefind`**
- `pagefind_extended` 命令还会生成搜索 playground（本地调试搜索）

### 语义搜索索引

- 语义搜索（`/search` 的 AI tab）由 **构建时预生成的 embeddings** 驱动
- `npm run embed` 调 Cloudflare Workers AI（BGE-M3）生成全部页面向量 → `static/pagefind-semantic/embeddings.bin`（L2 归一化，提交 git）
- Worker 运行时只嵌入 query + dot product，**无冷启动、无 KV 缓存**
- ⚠️ 改内容后必须重新 `npm run embed` 并提交，否则语义搜索结果缺新内容

### 知识图谱

- Graph 页面（`/graph`）使用 vis-network 可视化内容关联
- 数据来源于分类页的 JSON 输出（`graph-data` partial → `graph/index.json`）
- Org-mode 内链（`[[path][title]]`）作为节点关联的依据
- vis-network 仅在含 `<content-network-graph>` 的页面加载（独立 `graph.ts` 入口）

## 部署

- **平台**: Cloudflare Workers
- **参考实现**: [hosting-cloudflare-worker](https://github.com/jmooring/hosting-cloudflare-worker)
- **构建命令**: `npm run all`（Hugo 构建 + Pagefind 索引）
- **输出目录**: `public/`
- **部署方式**: 将 `public/` 内容上传至 Cloudflare Workers

> 实际部署脚本和配置见项目根目录的 `wrangler.jsonc` 和 `scripts/build.sh`。

## 站点变更记录

站点结构、域名与工具链的编年史（2021–2026）。原为站点独立页面 `/changelog`，2026-09 该页移除后并入本文件；2024-02 之后的部分由 git 历史回溯补齐。

### 2026

- 2026-09-24 layouts 全量迁到 Hugo v0.146+ 新模板结构：删除 `_default/`、`partials/`、`section/` 三个兼容目录，改为 `single.markdown.md`（纯文本源文）、`_partials/til/dashboard.html`、`graph/list.html`（图谱页）——构建产物逐字节不变
- 2026-09-20 全站强调色统一为低饱和墨蓝 `ink`，TIL 绿色系退役；小字对比度补齐 AA 缺口（1362 处）
- 2026-09-20 正文链接改常驻淡下划线（触屏设备此前完全看不到链接）；标签规范定为栏目级分类，移除工具/语言关键词标签
- 2026-09-18 单页支持纯文本源文输出（URL 后加 `.md`）；weread 面板改由 R2 托管；构建加伪 ASCII 检查闸门；posts 页加年度发文热力图
- 2026-09-13 语义索引解码 HTML 实体（Hugo 转义不再进索引）；移动端长表格不再卡片化；小字元信息对比度提到 AA
- 2026-09-12 数字花园 UI 改造（Editorial Garden 方向）；加命令面板（⌘K）与笔记页关系侧栏；中文排版基础设施（CJK 三件套 + 中文字体栈）；表格与代码块重做
- 2026-09-11 **Org Mode → Markdown 全量迁移（1581 篇）**；建立站内链接体系 —— wikilink、反链、链接悬浮预览、`check-links` 发布闸门；笔记底部加「相关笔记（语义相似）」
- 2026-09-03 TIL 全库加 draft / reviewed 双状态标记；确定 TIL 笔记边界纪律（对照 blackglory 的树形笔记，保持扁平结构、不建深目录）
- 2026-09-01 加返回顶部按钮
- 2026-08-29 weread 页面改为 API dashboard（笔记增量更新 1m42s → 15s）
- 2026-08-20 用 `light-dark()` / `color-mix()` 重构颜色 token
- 2026-08-07 收紧 Worker API 访问控制，修 8 项安全项
- 2026-08-06 新增 Start Here 精选页、首页分类入口、中英文章互链、footer RSS
- 2026-08-03 新增钢琴练习记录页；语义索引镜像进 `public/`（此前 CI 生成的索引到不了线上）
- 2026-07-31 新增熬夜记录日历页
- 2026-07-28 评论系统落地 —— 自托管 Go 服务起步，随即换成 Artalk（`comments.tianheg.co`），由 Worker 同源代理
- 2026-07-25 简谱项目重构为 `music`（VexFlow 五线谱、Web Audio 试听、pushState 路由）
- 2026-07-22 把 watch / music / musical / sentences / feeds 的 API 数据落地为本地文件
- 2026-07-19 TIL 结构扁平化（子目录 → header 分组）；加汉堡菜单、前后篇导航；移除 daisyUI、Service Worker 与死脚本
- 2026-07-08 医学知识库并入 `til/health`；TIL 搜索改造（自定义 modal + Ctrl+K）；足迹地图自动关联文章
- 2026-07-05 移动端汉堡菜单（触摸目标 ≥48px）；7 项 a11y 修复（对比度 / 焦点环 / skip-link / reduced-motion）
- 2026-06-20 全站 Editorial UI 重构
- 2026-05-30 加 OG 标签 / Twitter Card / 动态 lang 属性 / 页脚导航；图谱性能与死代码清理
- 2026-05-20 TIL 分类重组（清空 `misc/`）；包管理器 npm/bun → pnpm
- 2026-05-18 layouts 性能优化与构建缓存
- 2026-04-07 改用标准版 Hugo，不再依赖 extended 版
- 2026-03-29 知识图谱与反链可视化（迁到 TypeScript）；首页改版（最近文章 + 最近 TIL）；导航加 Graph
- 2026-03-12 新增简谱项目 `music-jianpu` 与 `/projects` 菜单
- 2026-01-14 Pagefind 支持多语言搜索

### 2025

- 2025-11-08 加 TOC（含移动端）
- 2025-10-20 加「编辑」链接
- 2025-10-05 til2blog 独立仓库并入 blog
- 2025-09-08 `.` 快捷键编辑内容；开启 Pagefind playground
- 2025-06-15 独立 TIL 仓库并入 `content/til`；加 backlinks 函数（因性能问题当月移除，2026-03 重做）
- 2025-06-08 **从 Cloudflare Pages 迁到 Cloudflare Workers**；启用 Hugo v0.146 新模板系统；英文启用 Satoshi 字体；引入 biome / daisyUI
- 2025-05-25 移除 read 菜单
- 2025-02-14 新增 gotosocial 根页面与 API（08-17 移除）
- 2025-02-09 `hugo.yaml` 改成 YAML 配置风格
- 2025-01-18 社交展示从 Telegram 换成 Mastodon
- 2025-01-05 **从 Netlify 迁到 Cloudflare**

### 2024

- 2024-11-24 升级 TailwindCSS
- 2024-10-22 首页重新设计；移除 about 菜单
- 2024-09-20 移除 post-nav / related-posts
- 2024-08-13 整体 Hugo 结构重构；08-04 启用 TailwindCSS
- 2024-06-07 生成 posts.json 供向量搜索使用
- 2024-05-31 短暂接入 Chatwoot 客服组件（06-04 移除）
- 2024-04-26 加 `.` 键盘快捷键；修 Pagefind 索引语言
- 2024-03-03 调整亮色主题背景色
- 2024-02-25 写 Markdown → Org 转换脚本；加 `.editorconfig`
- 2024-02-20 升级 Hugo 到 0.123.0
- 2024-02-17 把 `themes/tianheg` 的文件移到仓库根路径（主题与站点合并）
- 2024-02-14 把单个页面的书影音数据导入 [NeoDB](https://neodb.social)

### 2021–2023

- 2023-09-24 【现在】页的更新，通过 [Memos](https://github.com/usememos/memos) API 实现，公开 Memo 作为自己现在在做什么的状态更新（已弃用）
- 2023-09-22 使用域名邮箱作为永久联系邮箱，之后可通过 Cloudflare Email Routing 配置邮件转发
- 2023-09-03 移除文章中使用的所有图片，博客将只使用文字表达
- 2023-07-26 改变博客域名为 `tianheg.co`，原域名 `tianheg.xyz`
- 2023-04-29 把 shortcodes 的样式放到了各自的 shortcode 文件中，减小总体 CSS 大小
- 2023-02-04 文章列表样式修改
- 2022-11-15 将所有他处的笔记移动到博客中，下一步计划——合并同类文章，删除无价值文章，简化标签分类
- 2022-10-22 在每页加上「编辑」链接，方便修改
- 2022-10-12 改变博客域名为 `tianheg.xyz`，原域名 `www.yidajiabei.xyz`
- 2022-10-10 弃用 [ox-hugo](https://github.com/kaushalmodi/ox-hugo)，使用 `*.org` 格式文件写作，直接在 `content/posts` 文件夹下新建
- 2022-02-09 借助 ox-hugo 重回 Hugo 怀抱
- 2022-02-06 借助 highlight.js 为代码添加高亮
- 2021-11-19 使用 [Emacs Org-mode](https://github.com/dirtysalt/dirtysalt.github.io)
- 2021-09-23 使用 [Tianheg](https://github.com/tianheg/hugo-theme-tianheg) 主题，已合并到 blog 仓库
- 2021-09-07 使用 [giscus.app](https://giscus.app/) 评论
- 2021-07-31 让博客的导航栏固定在窗口的边缘
- 2021-07-21 开启 Service Worker
- 2021-07-02 这里主要是随时学习的记录，生活感想；对于外语电影，首选外语作为文章标题，中文放在文中
- 2021-06-29 把「自我」中的内容再次放到博客里
- 2021-05-26 把 blog 的主题改成技术，以前是生活技术。生活部分的文章放到自我站点（已弃用）中（已全部移入 blog）
- 2021-01-26 可以使用 `[post-title](/posts/post-file-name/)` 和 `[tag-name](/tags/tag-name/)` 相互引用文章
