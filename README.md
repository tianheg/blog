# blog

[![Generator is Hugo](https://img.shields.io/badge/Generator%20is-Hugo-ff4088?&logo=hugo)](https://github.com/gohugoio/hugo)
[![Source on GitHub](https://img.shields.io/badge/Source%20on-GitHub-181717?&logo=github)](https://github.com/tianheg/blog)
[![Built with Cloudflare Workers](https://img.shields.io/badge/Built%20with-Cloudflare_Workers-orange?&logo=cloudflare)](https://workers.cloudflare.com/)

个人博客站点 - [tianheg.co](https://tianheg.co/)

## 目录

- [项目架构](#项目架构)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [内容规范](#内容规范)
- [模板体系](#模板体系)
- [AI 工作流（skills/）](#ai-工作流skills)
- [常用命令](#常用命令)
- [资源存放](#资源存放)
- [输出格式](#输出格式)
- [部署](#部署)

## 项目架构

```
blog/
├── assets/              # 构建时处理的资源
│   ├── css/             # Tailwind CSS 入口（`main.css`）
│   └── ts/              # TypeScript 组件和库
├── content/             # 网站内容
│   ├── posts/           # 博客文章（长文、随笔、年度总结）
│   ├── til/             # Today I Learned 笔记（知识点、操作步骤）
│   │   ├── software/    # 软件/工具/编程类（使用前缀命名）
│   │   ├── life/        # 生活常识
│   │   ├── health/      # 健康相关
│   │   ├── emacs/       # Emacs 编辑器
│   │   ├── career/      # 职业发展
│   │   ├── homelab/     # 家庭实验室
│   │   ├── learning/    # 学习方法
│   │   ├── music/       # 音乐相关
│   │   ├── writing/     # 写作相关
│   │   ├── backup/      # 数据备份
│   │   └── misc/        # 杂项
│   └── *.org            # 独立页面（about, now, projects 等）
├── layouts/             # Hugo 模板
│   ├── _default/        # 基础模板（list.html, single.html）
│   ├── _partials/       # 可复用组件
│   ├── _shortcodes/     # 自定义 Hugo 短代码
│   ├── posts/           # 文章专用模板
│   ├── til/             # TIL 专用模板
│   ├── graph/           # 知识图谱可视化
│   ├── baseof.html      # 所有页面基础框架
│   ├── home.html        # 首页
│   ├── single.html      # 独立单页（About, Now 等）
│   └── section.html     # 分类列表页
├── static/              # 静态文件（直接复制到 public/）
│   ├── images/          # 图片资源
│   ├── fonts/           # 字体文件
│   └── projects/        # 项目展示相关文件
├── scripts/             # 构建和工具脚本
│   ├── build.sh         # 构建脚本
│   ├── hugo-setup.sh    # Hugo 环境设置
│   ├── til-lint.sh      # TIL 质量检查
│   └── til-fix-titles.sh # TIL 标题修复
└── skills/              # AI Agent 技能文档（元知识）
```

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 静态生成 | Hugo | 标准版，支持 PostCSS/Tailwind |
| 样式 | Tailwind CSS v4 + DaisyUI | 通过 `@tailwindcss/cli` 构建 |
| 搜索 | Pagefind | 静态搜索索引，基于构建后的 `public/` |
| 图谱可视化 | vis-network | 分类页 JSON 数据驱动 |
| 部署 | Cloudflare Workers | 参考 hosting-cloudflare-worker |

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Hugo | ≥ v0.140 | 标准版即可，Tailwind v4 需要 |
| Node.js | ≥ 18 | pnpm 管理依赖 |
| pnpm | ≥ 8 | 包管理器（`npm install -g pnpm`） |

首次克隆后执行：

```bash
pnpm install
```

## 内容规范

### 内容格式

| 目录 | 格式 | 原因 |
|------|------|------|
| `content/` 及根目录独立页面 | Org Mode (`.org`) | Hugo 原生渲染，个人偏好 |
| `skills/` | Markdown (`.md`) | AI Agent 技能标准格式，便于跨项目复用 |

### 文件命名规则

| 目录 | 推荐格式 | 示例 |
|------|----------|------|
| `posts/` | `{主题词}.org` | `2025.org`, `a-dream.org`, `about-good-posts.org` |
| `til/software/` | `{前缀}-{描述}.org` | `git-rebase.org`, `css-flexbox.org`, `python-decorator.org` |
| `til/其他分类/` | `{描述}.org` | `sleep.org`, `iptables.org` |

**通用约束：**
- ❌ 不能有大写字母
- ❌ 不能有空格
- ❌ 不能有中文标点
- ❌ 避免无意义编号（`001.org`, `note1.org`）

### Org Mode Frontmatter 示例

```org
#+TITLE: 文章标题
#+DATE: <2026-01-01 Thu 00:00>
#+TAGS[]: 标签1 标签2
```

独立页面（如 `about.org`）通常只需要 `#+TITLE`。

### Posts vs TIL 选择标准

| 类型 | 适合内容 | 示例 |
|------|----------|------|
| **Posts** | 长文、年度总结、随笔、书评、需要深度思考的内容 | 年终总结、音乐剧观后感、技术长文 |
| **TIL** | 技术知识点、操作步骤、命令备忘、可快速检索的笔记 | Git 命令、CSS 技巧、配置方法 |

### 标签（Tags）

- `tags` 是唯一的 taxonomy
- 在 `posts/` 中使用 `#+TAGS[]:` 添加
- `til/` 不推荐使用标签，文件夹分类已足够

## 模板体系

| 模板 | 用途 |
|------|------|
| `baseof.html` | 所有页面基础框架（HTML 骨架） |
| `home.html` | 首页 |
| `single.html` | 独立单页（About, Now, Projects 等） |
| `posts/single.html` | 博客文章详情页 |
| `til/single.html` | TIL 笔记详情页 |
| `section.html` | 分类列表页（Posts, TIL 索引等） |
| `_default/list.html` | 默认列表模板 |
| `_default/single.html` | 默认单页模板 |
| `_shortcodes/` | 自定义 Hugo 短代码 |

## AI 工作流（skills/）

`skills/` 目录存放 AI Agent 的元知识文档，是给 AI 看的操作手册。

**Agent 操作原则：**
1. 进入 `skills/` 后**先读 `SKILLS_INDEX.md`** — 统一索引，含快速决策表和调用策略
2. 根据场景选择对应 Skill，按需读取具体文件
3. 创建 `til/` 内容时，必须读取 `SKILL_TIL_编写规范.md`

| 文件 | 用途 |
|------|------|
| `SKILLS_INDEX.md` | **Skill 统一索引 — Agent 入口（必读）** |
| `SKILL_TIL_编写规范.md` | TIL 内容的结构化编写标准（P0 优先级） |
| `01-META-反思.md` | 内容质量审查与迭代修正（P1 优先级） |
| `02-META-迭代工作流.md` | 多轮优化策略设计（P1 优先级） |
| `03-META-冷启动.md` | 从零启动新任务 |
| `04-META-柳叶刀方法.md` | 复杂任务分解 |
| `00/05-13 META` | 其他通用方法论（按需读取） |

## 常用命令

```bash
# 开发服务器（含热重载）
npm run dev

# 构建站点（生产环境）
npm run build

# 构建 + 生成搜索索引（完整发布流程）
npm run all

# 仅生成搜索索引（需先构建）
npm run pagefind
```

### 新建内容工作流程

1. 根据内容类型选择 `content/posts/` 或 `content/til/` 下的正确分类
2. 按命名规范创建 `.org` 文件，填写 frontmatter
3. 运行 `npm run dev` 本地预览
4. 内容完成后运行 `npm run all` 构建并更新搜索索引
5. 提交变更

### 质量检查

```bash
# 检查 TIL 质量（临时文件、空文件、Org 标题、统计分布）
./scripts/til-lint.sh
```

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

- 搜索由 **Pagefind** 提供
- 索引基于 `public/` 构建后的 HTML 生成
- **必须先 `npm run build`，再 `npm run pagefind`**
- `pagefind_extended` 命令还会生成搜索 playground（本地调试搜索）

### 知识图谱

- Graph 页面（`/graph`）使用 vis-network 可视化内容关联
- 数据来源于分类页的 JSON 输出（`section` output format）
- 标签（tags）作为节点关联的依据

## 部署

- **平台**: Cloudflare Workers
- **参考实现**: [hosting-cloudflare-worker](https://github.com/jmooring/hosting-cloudflare-worker)
- **构建命令**: `npm run all`（Hugo 构建 + Pagefind 索引）
- **输出目录**: `public/`
- **部署方式**: 将 `public/` 内容上传至 Cloudflare Workers

> 实际部署脚本和配置见项目根目录的 `wrangler.jsonc` 和 `scripts/build.sh`。
