# 博客导出 EPUB——C 方案 SOP

把 tianheg.co 的文章导成一本 EPUB。**不改 `content/`**，产物不进仓库。
知识背景与三条路线对比见 TIL：[为 Hugo 博客制作 epub 格式电子书](/til/software/hugo-epub/)。

## 为什么是 C 方案

- **A** pandoc 直读 markdown：wikilink 得自己复刻站点解析规则，实测少 30 条内链
- **B** 纯 Hugo `outputFormats` + zip：XHTML/OPF/NCX 模板、命名实体转换、CSS、打包四样都得自己写
- **C**（本方案）Hugo 渲染 XHTML → 合并单文档 → pandoc 打包：渲染走站点真身规则，规范结构交给 pandoc

关键约束：**pandoc 不解析 HTML 输入的跨文件链接**，所以必须先把所有页面合并成一个文档、内部链接写成 `#锚点`，`--split-level` 分章时它才会把内链映射到正确的章节文件。

## 前置依赖

| 依赖 | 用途 | 说明 |
|------|------|------|
| `hugo` | 渲染 | 在 PATH（本机 `~/.local/bin/hugo`） |
| `pandoc` ≥ 3 | 打包 | 必须在 PATH，或用 `PANDOC=…` / `--pandoc` 指定 |
| `python3` + Pillow | 生成封面 | 只跑 `make_cover.py` 时需要 |

站点侧依赖（改站点 layouts 时要同步检查，脚本缺文件会直接报错退出）：三个 partial
`layouts/_partials/content/render-content.html`、`layouts/_partials/functions/wikilink-map.html`、`layouts/_partials/functions/linkable-pages.html`

## 一条命令

```bash
python3 scripts/epub/build_epub.py -o ~/book.epub --title "天河的博客：文章选辑"
```

| 参数 | 作用 |
|------|------|
| `-o` / `--title` | 输出路径 / 书名（必填） |
| `--style book\|site` | `book`＝纸质书排版（默认）；`site`＝站点 token 版 |
| `--css PATH` | 自定义样式表（覆盖 `--style`） |
| `--cover PATH` | 封面 png；默认取 `scripts/epub/cover.png`（存在才用） |
| `--limit N` | 只取前 N 篇，试跑用 |
| `--keep-build` | 保留中间构建目录（排查用） |

## 步骤与判据

每一步都会打印判据行，**看到对应输出才算过**：

| 步 | 做什么 | 判据 |
|----|--------|------|
| S1 | 建临时 Hugo 项目挂载 `content/`，只渲染 `EXCLUDE_LIST` 之外的页 | `S1 hugo exit: 0 \| wikilink 未解析警告: 0` |
| S2 | 收集 `.xhtml`，按渲染出的日期编年排序 | `S2 章节数: 966 \| 时间跨度: 2018-12-23 -> 2026-09-20` |
| S3 | 合并单文档：内链改 `#锚点`、`id` 加页面前缀、去图、修历史损坏 | `S3 合并文档 N KB \| 内链 X 站外 Y 去图 Z 计数行还原 W` |
| S4 | pandoc 打包（toc / split-level / css / metadata / 封面） | `S4 pandoc 警告: 0` + `S4 输出: … KB` |
| S5 | 运行 `validate_epub.py` | `0 error / 0 warning`，退出码 0 |

## 验收标准（DoD，5 条全过才算完成）

1. 校验器 **0 error**
2. 章节数 = `content/posts/*.md` 文件数 − 1（实测 963 → 962）
3. 内链数 > 0，随机抽 3 条在阅读器里能跳
4. spine 首项是封面、末项是「关于本书」
5. 体积与内容量匹配（≈960 篇 → 2.3 MB）

## 手工抽查

```bash
unzip -l book.epub | head -5                                  # mimetype 必须是第一项且不压缩
unzip -p book.epub EPUB/content.opf | grep -c itemref         # spine 条目数
unzip -p book.epub EPUB/nav.xhtml | head -40                  # 目录（应有 epub:type="toc"）
unzip -p book.epub EPUB/content.opf | grep -o 'properties="nav"'   # 导航文档标记
```

## 排障

| 症状 | 原因 | 处置 |
|------|------|------|
| `找不到 pandoc` | 不在 PATH 也没指定 | `PANDOC=/path/to/pandoc` 或 `--pandoc` |
| `站点 partial 缺失` | 站点 layouts 结构改了 | 核对三个 partial 路径后再跑 |
| `没有可打包的页面` | `EXCLUDE_LIST` 把目标目录也排掉了 | 检查 `build_epub.py` 顶部的 `EXCLUDE_LIST` |
| 全部内链失效 | 有人把多文件模式加回来了 | 必须合并单文档，且不加 `--file-scope` |
| 脚注引用错位 | 跨篇 `id` 重名 | `id` 与页内 `#` 链接都要加同一套页面前缀 |
| 代码块没有高亮 | 渲染配置少了 `markup.highlight` | 确认 `build_epub.py` 里的 `MARKUP_CONFIG` |
| 阅读器报非法 URI | 源里有空 host / 裸域名 / org 残留链接 | `clean_bad_links` 会降级为纯文本；若还有遗漏，补规则 |
| 书里多了旧文章 | 渲染目录残留 | 脚本每次 `rmtree` + `hugo --cleanDestinationDir`，已覆盖 |

## 改什么

- **收录范围** → `build_epub.py` 顶部的 `EXCLUDE_LIST`（列的是排除项）
- **排版** → `epub-book.css`（纸质书：首行缩进、章首装饰线、`· · ·` 花饰）/ `epub-tianheg.css`（站点 token）
- **封面** → `python3 scripts/epub/make_cover.py --title "…" --subtitle "…" --author tianhe`

## 已知坑（踩过的，改脚本前先读）

1. **必须合并单文档**：多文件模式（含 `--file-scope`）下跨文件链接会原样保留 → 657 条死链
2. **所有 `id` 加页面前缀**：跨篇重名会被 pandoc 重命名，脚注引用随之失配
3. **pandoc 丢弃 `<p class="x">` 的 class**：标记要用 `<span>` 或 `<div>` 包
4. **typographer 改写 + XHTML 转义**：源里 `--` 已变 `&ndash;`、引号已变 `&quot;`，正则要放宽
5. **命名实体**：XHTML 只认 5 个内建实体，`&mdash;` 之类必须先转成数字实体
6. **wikilink 用站点自己的 partial**：自己复刻会漏 aliases 与短标题（612 vs 642）
7. **坏链接降级**：空 host、裸域名、org 时代相对路径残留都是阅读器的硬失败
8. **历史损坏在书里修、不改源**：读书记计数行等被转义的 HTML 由脚本还原成 `<span class="dushuji-count">`，源文件的问题单独报告
