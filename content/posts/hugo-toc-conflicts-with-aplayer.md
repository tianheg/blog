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

---
参考链接

1.  [metingjs 与 hexo-toc 插件冲突，中文标题无法跳转](https://github.com/metowolf/MetingJS/issues/5)
2.  [Aplayer conflicts with hexo-toc](https://github.com/MoePlayer/APlayer/issues/242)
3.  [Update post.ejs](https://github.com/nqmysb/hexo-theme-huweihuang/commit/9896728accbda1f880c1216f443a5251d1b072f5)
4.  [Hugo 音乐短代码](https://immmmm.com/hugo-shortcodes-music/)