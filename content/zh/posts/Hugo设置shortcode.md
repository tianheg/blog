---
title: Hugo 设置 shortcode
date: 2020-05-13T16:04:22+08:00
categories: ["技术"]
tech: ["Hugo"]
slug: hugo set shortcode
keywords: ["Hugo","shortcode"]
description: "记录我使用 Hugo 中的 shortcode 遇到的问题"
---

## 添加 `\layouts\shortcodes\myshortcode.html`：

```html
<myshortcode>
    <p>
        Hello <strong>World!</strong>
    </p>
</myshortcode>
```

无法 `hugo server`，显示如下内容：

```
E:\test>hugo server
Building sites … panic: runtime error: invalid memory address or nil pointer dereference
[signal 0xc0000005 code=0x0 addr=0x20 pc=0xfe8bf9]

goroutine 110 [running]:
github.com/gohugoio/hugo/hugolib.(*shortcodeHandler).extractShortcode(0xc000ad7040, 0x1, 0x0, 0xc000196410, 0x0, 0x0, 0x1af4ae0)
        /root/project/hugo/hugolib/shortcode.go:505 +0x889
github.com/gohugoio/hugo/hugolib.(*pageState).mapContent(0xc00113c180, 0xc000956840, 0xc00113a280, 0xc00112b4e0, 0x2402080)     
        /root/project/hugo/hugolib/page.go:783 +0xb87
github.com/gohugoio/hugo/hugolib.(*pageMap).newPageFromContentNode(0xc00060d610, 0xc000b2f590, 0xc000956840, 0x0, 0x0, 0x0, 0x0)
        /root/project/hugo/hugolib/content_map_page.go:164 +0x62c
github.com/gohugoio/hugo/hugolib.(*pageMap).assemblePages.func1(0xc0006b56b0, 0x24, 0x1bc0c80, 0xc000b2f590, 0xc000abdb00)      
        /root/project/hugo/hugolib/content_map_page.go:358 +0x157
github.com/armon/go-radix.recursiveWalk(0xc000b2f5f0, 0xc000abde10, 0x1bc0c00)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:519 +0xf7
github.com/armon/go-radix.recursiveWalk(0xc000b2f5c0, 0xc000abde10, 0x1bc0c00)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.recursiveWalk(0xc000b2e6f0, 0xc000abde10, 0x1bc0c00)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.recursiveWalk(0xc000b2f6e0, 0xc000abde10, 0x1bc0c00)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.recursiveWalk(0xc000b46b40, 0xc000abde10, 0xfc1700)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.recursiveWalk(0xc00068d0e0, 0xc000abde10, 0x0)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.recursiveWalk(0xc000586870, 0xc000abde10, 0x0)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:525 +0x85
github.com/armon/go-radix.(*Tree).Walk(...)
        /go/pkg/mod/github.com/armon/go-radix@v1.0.0/radix.go:447
github.com/gohugoio/hugo/hugolib.(*pageMap).assemblePages(0xc00060d610, 0x0, 0x0)
        /root/project/hugo/hugolib/content_map_page.go:331 +0xf3
github.com/gohugoio/hugo/hugolib.(*pageMaps).AssemblePages.func1(0xc00060d610, 0xc000aaf480, 0xc0004cbf00)
        /root/project/hugo/hugolib/content_map_page.go:721 +0x6f
github.com/gohugoio/hugo/hugolib.(*pageMaps).withMaps.func1(0xc000aaf480, 0xc0004cbf68)
        /root/project/hugo/hugolib/content_map_page.go:788 +0x35
github.com/gohugoio/hugo/common/para.(*errGroupRunner).Run.func1(0xc000aaf478, 0x0)
        /root/project/hugo/common/para/para.go:52 +0x36
golang.org/x/sync/errgroup.(*Group).Go.func1(0xc000ce6570, 0xc000b12cc0)
        /go/pkg/mod/golang.org/x/sync@v0.0.0-20190911185100-cd5d95a43a6e/errgroup/errgroup.go:57 +0x60
created by golang.org/x/sync/errgroup.(*Group).Go
        /go/pkg/mod/golang.org/x/sync@v0.0.0-20190911185100-cd5d95a43a6e/errgroup/errgroup.go:54 +0x6d
```

## 添加 `\layouts\shortcodes\highlight.html`：

```html
<highlight html >
<section id="main">
  <div>
   <h1 id="title">{{ .Title }}</h1>
    {{ range .Data.Pages }}
        {{ .Render "summary"}}
    {{ end }}
  </div>
</section>
</highlight >
```

<highlight>

print('hello world')

</highlight>

没有报错