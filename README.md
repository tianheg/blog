# blog

[![Generator is Hugo](https://img.shields.io/badge/Generator%20is-Hugo-ff4088?&logo=hugo)](https://github.com/gohugoio/hugo)
[![Source on GitHub](https://img.shields.io/badge/Source%20on-GitHub-181717?&logo=github)](https://github.com/tianheg/blog)
[![Built with Cloudflare Workers](https://img.shields.io/badge/Built%20with-Cloudflare_Workers-orange?&logo=cloudflare)](https://workers.cloudflare.com/)

个人博客站点 - [tianheg.co](https://tianheg.co/)

## 项目架构

```
blog/
├── assets/              # 构建时处理的资源
│   ├── css/             # Tailwind CSS 入口
│   └── ts/              # TypeScript 组件和库
├── content/             # 网站内容 (Org Mode)
│   ├── posts/           # 博客文章
│   ├── til/             # Today I Learned 笔记
│   └── *.org            # 独立页面 (about, projects等)
├── layouts/             # Hugo 模板
│   ├── _default/        # 基础模板
│   ├── _partials/       # 可复用组件
│   ├── _shortcodes/     # 短代码
│   ├── posts/           # 文章专用模板
│   ├── til/             # TIL专用模板
│   └── graph/           # 知识图谱可视化
├── static/              # 静态文件 (直接复制)
├── scripts/             # 构建和工具脚本
└── skills/              # AI Agent 技能文档（给 AI 看的元知识）
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 静态生成 | Hugo |
| 样式 | Tailwind CSS v4 + DaisyUI |
| 搜索 | Pagefind |
| 图谱可视化 | vis-network |
| 部署 | Cloudflare Workers |

## 内容规范

**文件命名规则：**
- ❌ 不能有大写字母
- ❌ 不能有空格

**内容格式：** Org Mode (`.org`)

## 常用命令

```bash
# 开发服务器
npm run dev

# 构建站点
npm run build

# 构建 + 生成搜索索引
npm run all

# 仅生成搜索索引
npm run pagefind
```

## 输出格式

- **首页**: HTML + SectionsRSS (按分类的RSS)
- **页面**: HTML
- **分类页**: HTML + JSON (用于图谱)
- **标签**: HTML

## 部署

通过 Cloudflare Workers 部署，参考 [hosting-cloudflare-worker](https://github.com/jmooring/hosting-cloudflare-worker)。