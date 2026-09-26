---
title: '为Hugo博客制作epub格式电子书'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

## 三条路线，选第三条

把一个 Hugo 站点变成一本 EPUB，实测下来有三条路（基准：962 篇 posts，2018-12 到 2026-09，产出 2.3 MB）：

| 路线 | 做法 | 代价 |
|------|------|------|
| A | pandoc 直接读 `content/*.md` | 不动仓库，但 wikilink 得按站点规则自己复刻 —— 自己实现解析出 612 条，走站点规则出 642 条 |
| B | 纯 Hugo `outputFormats` → zip | 渲染 100% 复用，但 XHTML/OPF/NCX 模板、命名实体转换、CSS、打包四样都得自己写 |
| C | Hugo 渲染 XHTML → 合并单文档 → pandoc 打包 | 渲染走站点规则，规范结构交给 pandoc |

**选 C 的两个理由：**

1. **EPUB 规范语义由 pandoc 负责。** 实测产出里带着 `nav.xhtml` 的 `epub:type="toc"` 与 OPF 里的 `properties="nav"`、`<body epub:type="bodymatter">`、脚注的 `epub:type="noteref" role="doc-noteref"` 加 `epub:type="footnotes"`（**这是阅读器弹窗脚注的开关**）、以及必填的 `dcterms:modified`。走 B 要这些，就得自己在 Hugo 模板里写 —— 而 Hugo 的 markdown 渲染根本不知道 `epub:type`，它的脚注只是普通 `<a href="#fn:1">`。
2. **书不是站点的镜像。** 收哪些篇、按什么顺序、分不分卷、要不要版权页、剔除交互页，这些都是"编辑"动作。C 把它们放在中间脚本里，`content/` 一行不用改。

## EPUB 3.3 规范里与做书直接相关的部分

EPUB 3.3 是 W3C Recommendation（2025-03-27 发布），也是 EPUB 系列**第一个 W3C 正式推荐标准** —— EPUB 早先由 IDPF 维护，IDPF 2017 年并入 W3C，现在由 Publishing Maintenance WG 在 `w3c/epub-specs` 上开源维护。它**向后兼容 3.2**：任何合法的 3.2 出版物就是合法的 3.3，工作流不用改。

EPUB 3 由三份规范组成：**EPUB 3.3**（创作端，出版物要满足什么）、**Reading Systems 3.3**（消费端，阅读器要满足什么）、**Accessibility 1.1**（无障碍）。另有 informative 的 Notes，其中 Structural Semantics Vocabulary 1.1 是 `epub:type` 的取值全集。

结构从外到内：

- **OCF 容器**：ZIP 改后缀 `.epub`。两条硬约定 —— `mimetype` 必须是压缩包里**第一个条目且不压缩**；`META-INF/container.xml` 指向 package document
- **Package document（OPF）**：`metadata`（书名/作者/语言/identifier/`dcterms:modified`）、`manifest`（资源清单）、`spine`（默认阅读顺序）
- **EPUB content documents**：XHTML（HTML 的一个 profile）和 SVG
- **Navigation document**：EPUB 3 用一份 XHTML 写目录（`nav epub:type="toc"`，OPF 里标 `properties="nav"`）—— NCX 是 EPUB 2 的遗留
- **布局控制**：默认 reflowable（回流、适应屏幕），也可做像素级 fixed layout
- **Media overlays**（基于 SMIL）：文字与朗读音频同步

与 Web 的关系：HTML 是 living standard，EPUB **不锁版本**，所以自动跟上 Web 演进，代价是创作者要自己盯变化；CSS 走 CSS Snapshot 加少量带前缀属性。

三条直接影响做书的约束：

- XHTML profile **只认 5 个内建命名实体**（`&lt;` `&gt;` `&amp;` `&quot;` `&apos;`）。Hugo 输出的 `&mdash;` `&ldquo;` `&nbsp;` 全都不合法，必须转成数字实体
- 内容文档**不能随意引用远程脚本/样式**，所以站点的交互页（搜索、足迹地图）必须排除在书外
- Reading Systems 规范明说阅读器**可以覆盖字体、颜色、对齐** —— 样式要用相对单位、不能写死颜色，否则用户调不了

## 落地管线

1. **独立 Hugo 项目**，用 `module.mounts` 把站点的 `content/` 挂进来（只读，不改仓库）；`excludeFiles` 圈定要收的范围
2. **复用站点的三个 partial**：`_partials/content/render-content.html`、`functions/wikilink-map.html`、`functions/linkable-pages.html` —— wikilink、脚注、短代码全走站点自己的规则
3. **自定义 XHTML 输出格式**加一个 `single.xhtml` 模板（标题 + 元信息行 + 正文）
4. **后处理**：链接拍平、坏链接降级、去外图、页内锚点加页面前缀、还原被转义的 HTML
5. **合并成单个 HTML 文档** —— 这一步是必须的，见下方坑表第一行
6. **pandoc 打包**（`--toc --split-level=1 --css` + metadata + 封面），再用自写的 Python 校验器过一遍，0 error 才算完

## 踩过的坑

| 现象 | 原因与做法 |
|------|-----------|
| 657 条内链全断 | pandoc **不解析 HTML 输入的跨文件链接**，多文件模式（含 `--file-scope`）下 `<a href="posts/x.xhtml">` 原样保留。必须合并成单文档、内部链接写成 `#anchor` |
| 脚注引用全部失配 | 合并后各篇的 `#fn:1` 和小节 `id` 撞车，pandoc 会重命名重复项。所有 `id` 与页内 `#` 链接都要加同一套页面前缀 |
| 标记行样式不生效 | pandoc **丢弃 `<p class="x">` 的 class**（Para 不带 attributes）。标记要用 `<span>` 或 `<div>` 包 |
| 正则匹配不到要修的 HTML | typographer 已把 `--` 换成 `&ndash;`、XHTML 输出把引号转成 `&quot;`，字面量正则永远匹配不上。要放宽匹配并用贪婪的 `[^<]*` |
| 整个 XHTML 不是合法 XML | 命名实体问题，见上节 |
| 代码块没有语法高亮 | 导出配置没带站点的 `markup.highlight`（`style: dracula` + `noClasses: false`，内联配色，书里不需要额外 Chroma CSS） |
| wikilink 少解析 30 条 | 自己复刻站点规则会漏 aliases 和短标题形式。用站点自己的 partial |
| 阅读器报非法 URI | 源里的坏链接（空 host 的 `http://`、裸域名、org 时代相对路径残留）要降级成纯文本 |

## 样式：两套模板

**站点 token 版**：颜色全部从站点 CSS 换算成十六进制（`oklch()` 阅读器支持太差，用 Python 做 oklch → sRGB 精确转换）。暖纸 `#f7f5f3` / 暗底 `#121c22`、正文 `#4b4743` / `#9fb9d0`、链接 ink-600 `#3d5b7a` / ink-400 `#88a1bc`，暗色用 `@media (prefers-color-scheme: dark)` 切换（等价于站上的 `light-dark()`）。行高与字体栈照抄站点的。

**纸质书版**：换排版规则，不换配色 ——

- `p { margin: 0; text-indent: 2em }`，**首行缩进两字、段间不留空**（这一条是纸书和网页最本质的区别）
- 章标题居中加 `letter-spacing`，下方用 `h1::after` 画一条 2.6em 短装饰线；日期/分类居中、给足字距
- `hr` 不再是通栏横线：`hr::after { content: "· · ·" }`
- 引文左右各缩进 2em，不用竖线
- 正文用宋体、标题用黑体（中文纸书惯例），封面/扉页/书末版权页由 pandoc 的 `--epub-cover-image` 与 title page 加一个自定义章节组成

封面用 PIL 画（1600×2400），底色取站点纸色，书名用系统的思源宋体逐字绘制（PIL 没有 letter-spacing），不嵌字体让阅读器自己提供中文。

## 参考

- [Standard Ebooks: Producing an ebook step by step](https://standardebooks.org/contribute/producing-an-ebook-step-by-step)
- [darktable dtdocs](https://github.com/darktable-org/dtdocs)
- [EpubPressX](https://github.com/sunxen/EpubPressX)
- [hugoio/hugo issue 6332](https://github.com/gohugoio/hugo/issues/6332)
- [website2pdf](https://github.com/jgazeau/website2pdf)
- [print-css.com](https://print-css.com/)
- [print-css.rocks](https://print-css.rocks/)
- [CSS for printing](https://voussoir.net/writing/css_for_printing)
- [weitblick/epub](https://github.com/weitblick/epub) —— 唯一一个公开的 Hugo epub 主题，但最后提交停在 2021-02，模板是 Hugo 0.146 之前的结构、目录里德语硬编码、`ops:type` 拼错，只能当机制参考
- [Hugo 论坛：generate Hugo website as e-book](https://discourse.gohugo.io/t/generate-hugo-website-as-e-book-epub/29559)
- [EPUB 3.3](https://www.w3.org/TR/epub-33/) 与 [EPUB 3.3 总览页](https://www.w3.org/publishing/epub33/)
- [EPUB 3 Structural Semantics Vocabulary](https://www.w3.org/TR/epub-ssv-11/)

相关：[[write-a-good-prompt|write-a-good-prompt]]
