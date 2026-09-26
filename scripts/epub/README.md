# 博客导出 EPUB SOP

把 tianheg.co 的文章导成一本 EPUB。**不改 `content/`**，产物不进仓库。
知识背景见 TIL：[为 Hugo 博客制作 epub 格式电子书](/til/software/hugo-epub/)。

## 为什么这样做

对比过三种做法，最后落在最后一种：

- **pandoc 直读 markdown**：wikilink 得自己复刻站点解析规则，实测少 30 条内链
- **纯 Hugo `outputFormats` + zip**：XHTML/OPF/NCX 模板、命名实体转换、CSS、打包四样都得自己写
- **本流程**：Hugo 渲染 XHTML → 合并单文档 → pandoc 打包。渲染走站点真身规则，规范结构交给 pandoc

关键约束：**pandoc 不解析 HTML 输入的跨文件链接**，所以必须先把所有页面合并成一个文档、内部链接写成 `#锚点`，`--split-level` 分章时它才会把内链映射到正确的章节文件。

## 前置依赖

| 依赖 | 用途 | 说明 |
|------|------|------|
| `hugo` | 渲染 | 在 PATH（本机 `~/.local/bin/hugo`） |
| `pandoc` ≥ 3 | 打包 | 必须在 PATH，或用 `PANDOC=…` / `--pandoc` 指定 |
| `python3` + Pillow | 生成封面 | 只跑 `make_cover.py` 时需要 |
| `pyyaml` | 聚合 `dc:subject` | 缺失时跳过 subject，不报错 |

站点侧依赖（改站点 layouts 时要同步检查，脚本缺文件会直接报错退出）：三个 partial
`layouts/_partials/content/render-content.html`、`layouts/_partials/functions/wikilink-map.html`、`layouts/_partials/functions/linkable-pages.html`

## 一条命令

```bash
python3 scripts/epub/build_epub.py -o ~/book.epub --title "天河的博客" --subtitle "文章选辑"
```

| 参数 | 作用 |
|------|------|
| `-o` / `--title` | 输出路径 / 书名（必填） |
| `--subtitle` | 副标题（可选）；进 OPF 的 `subtitle` 标记，也出现在标题页 |
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
| S2 | 收集 `.xhtml`，按渲染出的日期编年排序 | `S2 章节数: 962 \| 时间跨度: 2018-12-23 -> 2026-09-20` |
| S3 | 合并单文档：内链改 `#锚点`、`id` 加页面前缀、去图、修历史损坏 | `S3 合并文档 N KB \| 内链 X 站外 Y 去图 Z 计数行还原 W` |
| S4 | pandoc 打包 + `patch_opf()` 补元数据 | `S4 pandoc 警告: 0` + `S4 OPF 补充: …` + `S4 输出: … KB` |
| S5 | 运行 `validate_epub.py` | `0 error / 0 warning`，退出码 0 |

## 元信息（阅读器书库看到的东西）

| 字段 | 值 | 谁写的 |
|------|-----|--------|
| `dc:identifier` | `urn:uuid:` + UUIDv5(`https://tianheg.co/posts`) | 脚本固定 |
| `dc:title` + `title-type` | 书名 main / 副标题 subtitle | `--title` `--subtitle` + OPF 补 |
| `dc:creator` + `role` `file-as` | tianhe，角色 aut | pandoc + OPF 补 |
| `dc:description` | 站点描述 = `layouts/baseof.html` 里 `$description` 的默认值 | 脚本（`SITE_DESCRIPTION`） |
| `dc:subject` | 从 `content/posts` 的 tags/categories 聚合 top 8 | 脚本（`collect_subjects()`） |
| `dc:publisher` / `dc:source` | tianheg.co / 站点 posts 地址 | 脚本 |
| `dc:date` / `dcterms:modified` | 构建日期 / 构建时间 | 脚本 / pandoc |
| 无障碍 7 条 + `accessibilitySummary` | textual、结构导航、无危险内容… | pandoc + OPF 补 |

**`dc:identifier` 必须固定**：pandoc 默认每次生成随机 UUID，同一本书重新构建后会被阅读器当成**另一本新书**（重复导入、阅读进度不继承）。脚本用 `uuid5(NAMESPACE_URL, "https://tianheg.co/posts")` 派生，永远同一个值——实测连跑两次一致。分册时按册派生（`…#2023`）即可保证各册稳定且互不相同。

**为什么需要 `patch_opf()`**：pandoc 的 EPUB writer 只写它认识的字段，`title-type` / `file-as` / `accessibilitySummary` 这类 `refines` 元数据写不进去（实测 `--metadata subtitle` 只进标题页，OPF 里没有 subtitle 标记），只能在构建后改写 OPF 再重打包。**重打包时 mimetype 必须仍是第一个条目且不压缩**（OCF 要求），否则书直接打不开——改这个函数后务必重跑 `validate_epub.py`。

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
unzip -p book.epub EPUB/content.opf | sed -n '/<metadata/,/<\/metadata>/p'   # 元信息
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
| 书打不开（OPF 错误） | `patch_opf()` 重打包时 mimetype 被压缩或挪位 | mimetype 必须是第一个条目且 `ZIP_STORED`；跑 `validate_epub.py` 确认 |
| 阅读器里出现重复的书 | identifier 变成了随机值 | 确认有传 `--metadata identifier=`（`book_id` 那段） |

## 改什么

- **收录范围** → `build_epub.py` 顶部的 `EXCLUDE_LIST`（列的是排除项）
- **排版** → `epub-book.css`（纸质书：首行缩进、章首装饰线、`· · ·` 花饰）/ `epub-tianheg.css`（站点 token）
- **元信息** → `SITE_DESCRIPTION`（站点描述）、`collect_subjects()`（主题）、`patch_opf()`（OPF 补充项）
- **封面** → `python3 scripts/epub/make_cover.py --title "…" --subtitle "…" --author tianhe`

## 已知坑（踩过的，改脚本前先读）

1. **必须合并单文档**：多文件模式（含 `--file-scope`）下跨文件链接会原样保留 → 657 条死链
2. **所有 `id` 加页面前缀**：跨篇重名会被 pandoc 重命名，脚注引用随之失配
3. **`id` 前缀要用双连字符**：单连字符会和 h1 的 anchor 撞名（文章里手写 `{#flexbox}` 时实测撞过一次）
4. **pandoc 丢弃 `<p class="x">` 的 class**：标记要用 `<span>` 或 `<div>` 包
5. **typographer 改写 + XHTML 转义**：源里 `--` 已变 `&ndash;`、引号已变 `&quot;`，正则要放宽
6. **命名实体**：XHTML 只认 5 个内建实体，`&mdash;` 之类必须先转成数字实体
7. **wikilink 用站点自己的 partial**：自己复刻会漏 aliases 与短标题（612 vs 642）
8. **坏链接降级**：空 host、裸域名、org 时代相对路径残留都是阅读器的硬失败
9. **历史损坏在书里修、不改源**：转义的读书记计数行有还原逻辑（`计数行还原 N`）。源里仍是转义状态时 N>0；源修好后 N=0 属正常。样式表必须定义 `--dushuji-count-color`（浅色 `#8b0000` / 深色 `#f87171`），否则这些行掉色
10. **不要用两端对齐**：`text-align: justify` 叠加中文标点压缩会让行尾标点与下一个字重叠（实测反馈），正文用 `left` + `text-spacing-trim: space-all`
11. **书名里的 `{#…}` 残留**：源里有 `### 01 {#01} {#section}` 这种双属性块叠加时 goldmark 只认最后一个，`{#01}` 会留在标题文字里——脚本在合并阶段清掉
