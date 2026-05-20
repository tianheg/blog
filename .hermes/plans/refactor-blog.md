# Blog 重构计划

> **目标：** 完成 pnpm 迁移收尾 → TIL 分类重整 → 文档对齐 → 性能优化

**架构：** Hugo 静态站点 + Tailwind v4 + DaisyUI + Pagefind 搜索 + Cloudflare Workers 部署

---

## 阶段一：构建系统清理

### 任务 1.1：替换 npm-run-all 为 pnpm 原生脚本

**目标：** 消除 `npm-run-all` 依赖，用 `&&` 替代 `run-s`

**文件：**
- Modify: `package.json`

### 任务 1.2：保留 postinstall hack（验证后确认仍需）

**结论：** Hugo v0.161.1 要求 `node_modules/.bin/tailwindcss` 是 Node.js 脚本，pnpm 生成的是 POSIX shell wrapper，`fix-tailwindcss-bin.sh` 仍然是必要的兼容层。**保留不动。**

### 任务 1.3：更新 CI build.sh 从 bun → pnpm

**文件：**
- Modify: `scripts/build.sh` (~L41)

**目标：** 让 Cloudflare Workers CI 使用 pnpm 而非 bun

**文件：**
- Modify: `scripts/build.sh` (~L41)

**操作：**
- 将 `bun run all` 改为 `pnpm run all`

### 任务 1.4：更新 README 中的构建命令

**目标：** README 中的 `npm run dev` 等命令更新为 pnpm

**文件：**
- Modify: `README.md`

---

## 阶段二：TIL 分类重整

### 任务 2.1：分析 misc/ 内容分布

**目标：** 对 210 篇 misc TIL 进行关键词聚类，找出可拆分的新分类

**操作：** 使用脚本提取所有 misc TIL 的标题和 tags，生成词频报告

### 任务 2.2：拆分 misc/ 内容

**目标：** 将 misc 中的内容按主题迁移到对应分类

**操作：** 根据词频分析，识别 3-5 个新分类或已有分类的候选

### 任务 2.3：合并过小分类

**目标：** 将 emacs(1), hardware(1), backup(4), career(4), writing(3) 合并到合适的父分类

---

## 阶段三：文档与元数据对齐

### 任务 3.1：更新 README

**目标：** README 反映实际项目结构，移除 skills/ 等不存在的目录描述

### 任务 3.2：更新 .gitignore

**目标：** 确保与 pnpm 工作流匹配（已确认）

### 任务 3.3：添加 CONTRIBUTING 或更新 AGENTS.md

**目标：** AI Agent 的开发指引与最新技术栈对齐

---

## 阶段四：性能优化（可选）

### 任务 4.1：Pagefind playground 取舍

**目标：** 移除 `--write-playground` 或保留（取决于是否需要本地调试）

### 任务 4.2：Service Worker 缓存策略审视

### 任务 4.3：构建缓存优化（Node modules 等）
