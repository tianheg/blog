+++
title = "Hugo 目录和音乐播放器 APlayer 的冲突问题"
date = 2020-05-18T00:00:00+08:00
lastmod = 2022-02-26T15:23:57+08:00
tags = ["技术", "Hugo"]
draft = false
+++

我是今天刚刚弄好 "关于" 页面的音乐播放器，然后突然发现：目录锚点失效了。

正常情况下，点击每篇文章前生成的目录，是能够跳转到对应位置的。现在不行了。我猜测可能是[MetingJS](https://github.com/metowolf/MetingJS) 的问题，于是找它的 issues ，终于找到了[它](https://github.com/metowolf/MetingJS/issues/5) 。而这个问题指向了 APlayer。因为 MetingJS 就是基于 APlayer 开发的。

我从 MetingJS 的那个 issue 中，得到了 APlayer 中对应问题的 issue。发现了一段对该问题解答很有用的评论：

> 这个问题是 APlayer 依赖的 webpack 引入的 [smoothscroll.js](https://github.com/alicelieutier/smoothScroll) 导致的，它给 hashtag 链接的 click 事件增加了 listener，但是却不能正确处理含有中文的 hashtag 链接（因为 url 编码）。这玩意儿 17 年到现在都没更新过，也难怪。
>
> 解决方法是将含有 hashtag 链接的 node 复制一份替换掉原来的，这样就能移除掉所有的 event listener，详见 <https://stackoverflow.com/a/9251864>
>
> 不过有一说一，一个音乐播放器，为什么要依赖另一个功能完全无关（用于平滑滚动页面）的脚本呢？
>
> ——[该回答](https://github.com/MoePlayer/APlayer/issues/242#issuecomment-602471423)出自 [ZeppLu](https://github.com/ZeppLu)

我最后把目录和播放器的问题解决了。我的办法是把：

```html
<!-- require APlayer -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<!-- require MetingJS -->
<script src="https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js"></script>
```

直接放进 "关于" 的 markdown 文件里，然后再加上我的网易云歌单：

```html
<meting-js
server="netease"
type="playlist"
id="967686417">
</meting-js>
```

没想到成功了。真是太好了。


## 另外一个尝试 {#另外一个尝试}

可以使用 shortcode 来嵌入。

新建 `~/layouts/shortcodes/music.html` ，在其中添加如下代码：

```html
{{- $scratch := .Page.Scratch.Get "scratch" -}}
<!-- require APlayer -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
<style type="text/css">.dark-theme .aplayer{background:#212121}.dark-theme .aplayer.aplayer-withlist .aplayer-info{border-bottom-color:#5c5c5c}.dark-theme .aplayer.aplayer-fixed .aplayer-list{border-color:#5c5c5c}.dark-theme .aplayer .aplayer-body{background-color:#212121}.dark-theme .aplayer .aplayer-info{border-top-color:#212121}.dark-theme .aplayer .aplayer-info .aplayer-music .aplayer-title{color:#fff}.dark-theme .aplayer .aplayer-info .aplayer-music .aplayer-author{color:#fff}.dark-theme .aplayer .aplayer-info .aplayer-controller .aplayer-time{color:#eee}.dark-theme .aplayer .aplayer-info .aplayer-controller .aplayer-time .aplayer-icon path{fill:#eee}.dark-theme .aplayer .aplayer-list{background-color:#212121}.dark-theme .aplayer .aplayer-list::-webkit-scrollbar-thumb{background-color:#999}.dark-theme .aplayer .aplayer-list::-webkit-scrollbar-thumb:hover{background-color:#bbb}.dark-theme .aplayer .aplayer-list li{color:#fff;border-top-color:#666}.dark-theme .aplayer .aplayer-list li:hover{background:#4e4e4e}.dark-theme .aplayer .aplayer-list li.aplayer-list-light{background:#6c6c6c}.dark-theme .aplayer .aplayer-list li .aplayer-list-index{color:#ddd}.dark-theme .aplayer .aplayer-list li .aplayer-list-author{color:#ddd}.dark-theme .aplayer .aplayer-lrc{text-shadow:-1px -1px 0 #666}.dark-theme .aplayer .aplayer-lrc:before{background:-moz-linear-gradient(top, #212121 0%, rgba(33,33,33,0) 100%);background:-webkit-linear-gradient(top, #212121 0%, rgba(33,33,33,0) 100%);background:linear-gradient(to bottom, #212121 0%, rgba(33,33,33,0) 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr='#212121', endColorstr='#00212121',GradientType=0 )}.dark-theme .aplayer .aplayer-lrc:after{background:-moz-linear-gradient(top, rgba(33,33,33,0) 0%, rgba(33,33,33,0.8) 100%);background:-webkit-linear-gradient(top, rgba(33,33,33,0) 0%, rgba(33,33,33,0.8) 100%);background:linear-gradient(to bottom, rgba(33,33,33,0) 0%, rgba(33,33,33,0.8) 100%);filter:progid:DXImageTransform.Microsoft.gradient( startColorstr='#00212121', endColorstr='#cc212121',GradientType=0 )}.dark-theme .aplayer .aplayer-lrc p{color:#fff}.dark-theme .aplayer .aplayer-miniswitcher{background:#484848}.dark-theme .aplayer .aplayer-miniswitcher .aplayer-icon path{fill:#eee}</style>
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<!-- require MetingJS -->
<script src="https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js"></script>
{{- if .IsNamedParams -}}
    {{- if .Get "url" -}}
        <meting-js url="{{ .Get `url` }}" name="{{ .Get `name` }}" artist="{{ .Get `artist` }}" cover="{{ .Get `cover` }}" theme="{{ .Get `theme` | default `#2980b9` }}"
        {{- with .Get "fixed" }} fixed="{{ . }}"{{ end -}}
        {{- with .Get "mini" }} mini="{{ . }}"{{ end -}}
        {{- with .Get "autoplay" }} autoplay="{{ . }}"{{ end -}}
        {{- with .Get "volume" }} volume="{{ . }}"{{ end -}}
        {{- with .Get "mutex" }} mutex="{{ . }}"{{ end -}}
        ></meting-js>
    {{- else if .Get "auto" -}}
        <meting-js auto="{{ .Get `auto` }}" theme="{{ .Get `theme` | default `#2980b9` }}"
        {{- with .Get "fixed" }} fixed="{{ . }}"{{ end -}}
        {{- with .Get "mini" }} mini="{{ . }}"{{ end -}}
        {{- with .Get "autoplay" }} autoplay="{{ . }}"{{ end -}}
        {{- with .Get "loop" }} loop="{{ . }}"{{ end -}}
        {{- with .Get "order" }} order="{{ . }}"{{ end -}}
        {{- with .Get "volume" }} volume="{{ . }}"{{ end -}}
        {{- with .Get "mutex" }} mutex="{{ . }}"{{ end -}}
        {{- with .Get "list-folded" }} list-folded="{{ . }}"{{ end -}}
        {{- with .Get "list-max-height" }} list-max-height="{{ . }}"{{ end -}}
        ></meting-js>
    {{- else -}}
        <meting-js server="{{ .Get `server` }}" type="{{ .Get `type` }}" id="{{ .Get `id` }}" theme="{{ .Get `theme` | default `#2980b9` }}"
        {{- with .Get "fixed" }} fixed="{{ . }}"{{ end -}}
        {{- with .Get "mini" }} mini="{{ . }}"{{ end -}}
        {{- with .Get "autoplay" }} autoplay="{{ . }}"{{ end -}}
        {{- with .Get "loop" }} loop="{{ . }}"{{ end -}}
        {{- with .Get "order" }} order="{{ . }}"{{ end -}}
        {{- with .Get "volume" }} volume="{{ . }}"{{ end -}}
        {{- with .Get "mutex" }} mutex="{{ . }}"{{ end -}}
        {{- with .Get "list-folded" }} list-folded="{{ . }}"{{ end -}}
        {{- with .Get "list-max-height" }} list-max-height="{{ . }}"{{ end -}}
        ></meting-js>
    {{- end -}}
{{- else if strings.HasSuffix (.Get 0) "http" -}}
    <meting-js auto="{{ .Get 0 }}" theme="#2980b9"></meting-js>
{{- else -}}
    <meting-js server="{{ .Get 0 }}" type="{{ .Get 1 }}" id="{{ .Get 2 }}" theme="#2980b9"></meting-js>
{{- end -}}
{{- $scratch.Set "music" true -}}
```

然后直接在 md 文档中引用即可：

```md
{{</* music auto="https://music.163.com/#/playlist?id=5043861211" */>}}
```

{{< music auto="https://music.163.com/#/playlist?id=5043861211">}}

还是没有解决问题。

---
参考链接

1.  [metingjs 与 hexo-toc 插件冲突，中文标题无法跳转](https://github.com/metowolf/MetingJS/issues/5)
2.  [Aplayer conflicts with hexo-toc](https://github.com/MoePlayer/APlayer/issues/242)
3.  [Update post.ejs](https://github.com/nqmysb/hexo-theme-huweihuang/commit/9896728accbda1f880c1216f443a5251d1b072f5)
4.  [Hugo 音乐短代码](https://immmmm.com/hugo-shortcodes-music/)