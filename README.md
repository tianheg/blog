# blog

[![Generator is Hugo](https://img.shields.io/badge/Generator%20is-Hugo-ff4088?&logo=hugo)](https://github.com/gohugoio/hugo)
[![Source on GitHub](https://img.shields.io/badge/Source%20on-Forgejo-181717?&logo=forgejo)](https://git.tianheg.co/tianheg/blog)
[![Built with Cloudflare Workers](https://img.shields.io/badge/Built%20with-Cloudflare_Workers-orange?&logo=cloudflare)](https://workers.cloudflare.com/)

个人博客站点 - [tianheg.co](https://tianheg.co/)

## 目录

- [项目架构](#项目架构)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [内容规范](#内容规范)
- [模板体系](#模板体系)
- [常用命令](#常用命令)
- [资源存放](#资源存放)
- [输出格式](#输出格式)
- [部署](#部署)

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
├── layouts/             # Hugo 模板
│   ├── _default/        # 基础模板（section.json.json）
│   ├── _partials/       # 可复用组件（head, components）
│   ├── posts/           # 文章专用模板（single.html）
│   ├── til/             # TIL 专用模板（baseof, list, single）
│   ├── footprints/      # 足迹地图（single.html）
│   ├── important-now/   # 当前重点（single.html）
│   ├── graph/           # 知识图谱（list.json.json）
│   ├── section/         # 分类页（graph.html）
│   ├── baseof.html      # 所有页面基础框架
│   ├── home.html        # 首页
│   ├── single.html      # 独立单页（About, Now 等）
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
- 页面标题开头显示状态小字（draft=amber，reviewed=emerald，见 `layouts/partials/til/status.html`）

### Posts vs TIL 选择标准

| 类型 | 适合内容 | 示例 |
|------|----------|------|
| **Posts** | 长文、年度总结、随笔、书评、需要深度思考的内容 | 年终总结、音乐剧观后感、技术长文 |
| **TIL** | 技术知识点、操作步骤、命令备忘、可快速检索的笔记 | Git 命令、CSS 技巧、配置方法 |

### 标签（Tags）

- `tags` 是唯一的 taxonomy
- 在 `posts/` 中使用 front matter `tags: [a, b]` 添加
- `til/` 不推荐使用标签，文件夹分类已足够

### 内部链接与反链（2026-09-11 起）

正文引用其他笔记，两种写法都支持：

- 标准 Markdown：`[显示文字](/til/software/git-rebase/)`
- **Wikilink**：`[[git-rebase]]`、`[[git-rebase|显示文字]]`、`[[笔记本保养#小节]]`

wikilink 依次按 **文件名 → 完整标题 → 标题主名（`——`/`：`/`|` 之前那截）→ front matter aliases** 解析（`layouts/_partials/functions/wikilink-map.html`）。代码块与行内代码里的 `[[…]]` 被屏蔽，不会误解析。

**写错名字也不会产生死链**（三层保证，2026-09-11 起）：

1. **渲染兜底** — 解析不到时渲染成「站内搜索」链接（虚线下划线 + 悬停提示），读者看不到 `[[…]]` 原文，也点不到 404
2. **构建告警** — 构建时 `WARN`，日志里能看到是哪个名字
3. **发布闸门** — `npm run check-links` 汇总「未解析的 wikilink」+「失效内链」并返回退出码 1（`--warn-only` 只报告），且指出是哪个文件/哪一页写错了。判定逻辑复用 Hugo 构建结果，不另写一套解析规则

**写法约定（兼顾 Obsidian）**：

- 站内引用用 `[[文件名]]` —— Obsidian 的 wikilink 只按**文件名**解析，不认标题，所以这是两边都通的写法
- 要中文显示：`[[laptop-maintenance|笔记本保养]]`（两边都通）
- 想让 Obsidian 里也能用中文引用：给 frontmatter 加 `aliases: ["笔记本保养"]`（本站的 wikilink-map 也认 `.Aliases`）
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
| `_default/section.json.json` | 默认分类 JSON 输出 |
| `graph/list.json.json` | 知识图谱 JSON 数据 |
| `_shortcodes/` | 自定义 Hugo 短代码 |

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
| **单页** | HTML | 文章、TIL、独立页面 |
| **分类页** | HTML + JSON | JSON 用于知识图谱可视化（vis-network） |
| **标签页** | HTML | 标签聚合列表 |
| **标签详情** | HTML | 单个标签下的内容列表 |

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
