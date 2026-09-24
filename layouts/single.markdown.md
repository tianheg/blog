{{- /* Markdown 输出格式 —— 站内任意页面 URL 后加 `.md` 即得纯文本源文。

  内容 = 标题（H1）+ 正文。正文用 `.RawContent`（源文件正文，未渲染）：
  不含 front matter，wikilink 保持 [[…]] 原样，短代码不被展开。
  /til/ 的标题只存在于 front matter，所以补一行 H1，否则页面开头就是裸正文。

  发布路径由 hugo.yaml 的 outputFormats.markdown（ugly: true）决定：
  /posts/foo/ → /posts/foo.md（而不是 /posts/foo/index.md）。
  模板查找名：single.markdown.md（layout=single，output format=markdown，suffix=md）。 */ -}}
# {{ .Title }}

{{ .RawContent | strings.TrimSpace }}
