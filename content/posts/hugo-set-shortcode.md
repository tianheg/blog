---
title: "Hugo 设置 shortcode"
date: 2020-05-13T16:04:22+08:00
description: "Hugo 设置 shortcode"
tags: ["Hugo"]
keywords: ["Hugo"]
---

## align

对文字进行居中、居左、居右的设置。在 `~/layouts/shortcodes/` 下创建 `align.html`，内容如下：

```html
<!-- 文件位置：~/layouts/shortcodes/align.html -->

<p style="text-align:{{ index .Params 0 }}">{{ index .Params 1 | markdownify }}</p>
```

具体简码样式：

```markdown
{{</* align left "文字" */>}}

{{</* align center "文字" */>}}

{{</* align right "文字" */>}}
```

{{< align left "文字" >}}

{{< align center "文字" >}}

{{< align right "文字" >}}

## github

新建文件 github.html

```html
<!-- 文件位置：~/layouts/shortcodes/github.html -->

<div class="github">
    <div class="logo">
        {{ replace $.Site.Data.SVG.repository "icon" "icon github-icon" | safeHTML }}
        <a class="name" href={{ .Get "link" }} target="_blank">{{ .Get "name" }}</a>
    </div>
    <div class="description">{{ .Get "description" }}</div> 
    <div class="language">
        <span class="language-color" style="background-color: {{ .Get "color" }}"></span>
        <span class="language-name">{{ .Get "language" }}</span>
    </div>
</div>
```

然后添加自定义 CSS 样式。在 `~/assets/scss/custom/_custom.scss` 文件中添加如下内容：

```scss
// 文件位置：~/assets/scss/custom/_custom.scss

.github {
    border: 1px solid var(--color-contrast-low);
    border-radius: 3px;
    margin: 0 auto;
    margin-bottom: 1em;
    padding: 1em;
    .github-icon {
        width: 1.2em;
        height: 1.2em;
        margin-right: 0.5em;
        margin-bottom: 0.2em;
        fill: var(--color-contrast-high);
        transition: all .5s;
    }
    .name {
        font-weight: bold;
        color: var(--color-primary);
        text-decoration: none;
    }
    .description {
        margin-top: 0.5em;
        margin-bottom: 1em;
        color: var(--color-contrast-high);
        text-align: justify;
        font-size: 90%;
        transition: all .5s;
    }
    .language-color {
        position: relative;
        top: 1px;
        display: inline-block;
        width: 0.75em;
        height: 0.75em;
        border-radius: 50%;
    }
    .language-name {
        color: var(--color-contrast-high);
        font-size: 90%;
        margin-left: 0.5em;
        transition: all .5s;
    }
}
```

最后需要在 `~/data/SVG.toml` 文件中插入图标：

```toml
# 文件位置：~/data/SVG.toml

# GitHub Icon
repository = '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 2.5C2 1.83696 2.26339 1.20107 2.73223 0.732233C3.20108 0.263392 3.83696 0 4.5 0L13.25 0C13.4489 0 13.6397 0.0790176 13.7803 0.21967C13.921 0.360322 14 0.551088 14 0.75V13.25C14 13.4489 13.921 13.6397 13.7803 13.7803C13.6397 13.921 13.4489 14 13.25 14H10.75C10.5511 14 10.3603 13.921 10.2197 13.7803C10.079 13.6397 10 13.4489 10 13.25C10 13.0511 10.079 12.8603 10.2197 12.7197C10.3603 12.579 10.5511 12.5 10.75 12.5H12.5V10.5H4.5C4.30308 10.5 4.11056 10.5582 3.94657 10.6672C3.78257 10.7762 3.65442 10.9312 3.57816 11.1128C3.50191 11.2943 3.48096 11.4943 3.51793 11.6878C3.5549 11.8812 3.64816 12.0594 3.786 12.2C3.92524 12.3422 4.0023 12.5338 4.00024 12.7328C3.99818 12.9318 3.91716 13.1218 3.775 13.261C3.63285 13.4002 3.4412 13.4773 3.24222 13.4752C3.04325 13.4732 2.85324 13.3922 2.714 13.25C2.25571 12.7829 1.99929 12.1544 2 11.5V2.5ZM12.5 1.5V9H4.5C4.144 9 3.806 9.074 3.5 9.208V2.5C3.5 2.23478 3.60536 1.98043 3.79289 1.79289C3.98043 1.60536 4.23478 1.5 4.5 1.5H12.5ZM5 12.25V15.5C5 15.5464 5.01293 15.5919 5.03734 15.6314C5.06175 15.6709 5.09667 15.7028 5.1382 15.7236C5.17972 15.7444 5.22621 15.7532 5.27245 15.749C5.31869 15.7448 5.36286 15.7279 5.4 15.7L6.85 14.613C6.89328 14.5805 6.94591 14.563 7 14.563C7.05409 14.563 7.10673 14.5805 7.15 14.613L8.6 15.7C8.63714 15.7279 8.68131 15.7448 8.72755 15.749C8.77379 15.7532 8.82028 15.7444 8.8618 15.7236C8.90333 15.7028 8.93826 15.6709 8.96266 15.6314C8.98707 15.5919 9 15.5464 9 15.5V12.25C9 12.1837 8.97366 12.1201 8.92678 12.0732C8.87989 12.0263 8.81631 12 8.75 12H5.25C5.1837 12 5.12011 12.0263 5.07322 12.0732C5.02634 12.1201 5 12.1837 5 12.25Z"/></svg>'
```

你需要在简码中填写仓库名 `name`，仓库链接 `link`，仓库描述 `description`，代码语言 `language`，代码语言对应的颜色 `color`。

具体简码和样式如下：

```markdown
{{</* github name="blog" link="https://github.com/tianheg/blog" description="Blog Source Files" color="#E34C26" language="HTML" */>}}
```

{{< github name="blog" link="https://github.com/tianheg/blog" description="Blog Source Files" color="#E34C26" language="HTML">}}

## gallery

```html
{{</* gallery dir="/images/friends/" />}} {{< load-photoswipe */>}}
# 这是添加组合图片的短代码
```

## notice

{{<notice notice-warning>}}
内容
{{</notice>}}

```html
{{</*notice notice-warning>}}
内容
{{</notice*/>}}
```

{{<notice notice-tip>}}
内容
{{</notice>}}

```html
{{</*notice notice-tip>}}
内容
{{</notice*/>}}
```

{{<notice notice-info>}}
内容
{{</notice>}}

```html
{{</*notice notice-info>}}
内容
{{</notice*/>}}
```

{{<notice notice-note>}}
内容
{{</notice>}}

```html
{{</*notice notice-note>}}
内容
{{</notice*/>}}
```

## gist

{{< gist tianheg 1ce40c3e06eddab6bc72b87cc26ec067 >}}

```html
{{</* gist tianheg 1ce40c3e06eddab6bc72b87cc26ec067 */>}}
```

## year

{{< year >}}

```html
{{</* year */>}}
```

## highlight

<mark>highlighted text</mark>

```html
<mark>highlighted text</mark>
```

```html
添加\layouts\shortcodes\highlight.html：
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

没有报错，但是没有高亮

## quote

中文：

{{< quote >}}
教育，特别是未成年人的教育，一定要尽量将偏见和仇恨压到最低，以至于无。我们唯一要仇恨的就是仇恨本身，我们最应该对偏见本身有偏见。我不希望我们的下一代生活在仇恨之中，我不希望我们的下一代还有战争和屠杀，我不希望我们的下一代还有“儿童党卫军”等组织，我不希望我们的下一代还高唱忠于领袖、忠于组织的赞歌。我希望我们的下一代在和平的环境中，享受面包和音乐；我希望我们的下一代，无论什么肤色和信仰都可以平等和平的交流；我希望我们的下一代自由地选择自己喜欢的生活，而不是做任何人或任何组织的“螺丝钉”；我希望我们的下一代都内心甜美、热爱自由，各美其美；我希望我们的下一代忠于自己的良知和责任，成为有思想、有智慧、有爱心的好人。
{{< /quote >}}

```html
{{</* quote >}}
教育，特别是未成年人的教育，一定要尽量将偏见和仇恨压到最低，以至于无。我们唯一要仇恨的就是仇恨本身，我们最应该对偏见本身有偏见。我不希望我们的下一代生活在仇恨之中，我不希望我们的下一代还有战争和屠杀，我不希望我们的下一代还有“儿童党卫军”等组织，我不希望我们的下一代还高唱忠于领袖、忠于组织的赞歌。我希望我们的下一代在和平的环境中，享受面包和音乐；我希望我们的下一代，无论什么肤色和信仰都可以平等和平的交流；我希望我们的下一代自由地选择自己喜欢的生活，而不是做任何人或任何组织的“螺丝钉”；我希望我们的下一代都内心甜美、热爱自由，各美其美；我希望我们的下一代忠于自己的良知和责任，成为有思想、有智慧、有爱心的好人。
{{< /quote */>}}
```

英文：

{{< quote en >}}
*We don't read and write poetry because it's cute. We read and write poetry because we are members of the human race. And the human race is filled with passion.*
{{< /quote >}}

```html
{{</* quote en >}}
*We don't read and write poetry because it's cute. We read and write poetry because we are members of the human race. And the human race is filled with passion.*
{{< /quote */>}}
```

<br>

{{< quote-center >}}
毕竟西湖六月中<br>风光不与四时同<br>接天莲叶无穷碧<br>映日荷花别样红

{{< /quote-center >}}

```html
{{</* quote-center >}}
毕竟西湖六月中<br>风光不与四时同<br>接天莲叶无穷碧<br>映日荷花别样红
{{< /quote-center */>}}
```

{{< wp tag="Wikipedia:历史上的今天" lang="zh" title="历史上的今天" >}}

```html
{{</* wp tag="Wikipedia:历史上的今天" lang="zh" title="历史上的今天" */>}}
```

```html
{{</* bili aid="625811282" cid="197006223" */>}}
# aid 和 cid 可以通过页面的源码获得(按 Ctrl+U 打开页面源码)
```

---

**参考链接**：

1. [自定义 Hugo Shortcodes 简码](https://guanqr.com/tech/website/hugo-shortcodes-customization/)
2. [主题文档 - 扩展 Shortcodes](https://hugoloveit.com/zh-cn/theme-documentation-extended-shortcodes/)
