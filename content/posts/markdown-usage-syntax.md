---
title: "Markdown 使用语法"
date: 2020-05-10T17:39:28+08:00
description: "记录 Markdown 的使用语法"
tags: ["Markdown"]
keywords: ["Markdown"]
---

## 综述

### 设计哲学

Markdown 被设计得易于读写。

### 行内 HTML

Markdown 不是 HTML 的替代，或是接近它。如果有些标记 Markdown 没有，你大可以用 HTML。唯一限制使用的是块元素。跨度 HTML 标签可以在 Markdown 段落的任何地方使用。

### 自动转义特殊字符

在 HTML 中有两个字符需要特别对待：`<` 和 `&`。< 被用来作为标签的开始；& 被用来表示 HTML 实体。如果你想把它们用作文字字符，你必须把它们作为实体转义，例如 &lt; 和 &amp;，原形：`&lt;` 和 `&amp;`。

`&` 使网络作家特别困扰。如果你想写 `AT&T`，你需要写 `AT&amp;T`。

## 块元素

### 段落和换行符

段落就是纯文本，段落之间有至少一个空行，多个空行也只会形成一个空行。

### 标题（HEADERS）

Markdown 支持两种样式的标题，[Setext](https://docutils.sourceforge.io/mirror/setext.html) 和 [atx](http://www.aaronsw.com/2002/atx/)。

Setext 风格的标题分别使用 `=` 和 `-` 表示一级和二级标题（任何数量均可）。例子：

```md
一级标题
=

二级标题
-
```

Atx 风格的标题使用 1-6 个 #（数字记号）在标题开头处，对应标题的六个级别。例子：

```md
# 一级标题
## 二级标题
### 三级标题
……
```

当然，你还可以在标题后添加数量不等的 `=` 做做样子。这并不影响，开头 # 的数量才决定标题的级别。

### 块引用

Markdown 使用邮件风格的 > 作为块引用。换行时最好把 > 带上，这样更美观。

也可以只在段落的开头添加 > 以添加块引用，

也可以添加多级引用（blockquote-in-a-blockquote）。例子：

> This is the first level of quoting.
>
> > This is nested blockquote.
>
> Back to the first level.

```md
> This is the first level of quoting.
>
> > This is nested blockquote.
>
> Back to the first level.
```

块引用中还可以插入其他 Markdown 语法：标题、列表、代码块。

### 列表

Markdown 支持有序和无序列表。

无序列表可以使用 `*`、`+`、`-` 表示。

有序列表格式：`数字` + `.`。即便使用相同数字添加有序列表，依然按照从 1 开始的顺序显示。

1. 1
1. 1
1. 1

3. 1
1. 2
4. 8

```md
1. 1
1. 1
1. 1

3. 1
1. 2
4. 8
```

列表从左边开始，不多于三个空格为有效（四个空格为代码块）。

   1. 1
1. 2
2. 8

```md
   1. 1 <!-- `1.` 前有三个空格 -->
1. 2
2. 8
```

为了使列表更好看，你可以手动缩进：

```md
*   Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
    Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,
    viverra nec, fringilla in, laoreet vitae, risus.
*   Donec sit amet nisl. Aliquam semper ipsum sit amet velit.
    Suspendisse id sem consectetuer libero luctus adipiscing.
```

不过，懒得缩进也可以：

```md
*   Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,
viverra nec, fringilla in, laoreet vitae, risus.
*   Donec sit amet nisl. Aliquam semper ipsum sit amet velit.
Suspendisse id sem consectetuer libero luctus adipiscing.
```

如果列表之间有空行，转为 HTML 时会插入 `<p>`。例如，这个输入：

```md
*   Bird
*   Magic
```

会变成：

```html
<ul>
<li>Bird</li>
<li>Magic</li>
</ul>
```

但这个：

```md
*   Bird

*   Magic
```

会变成：

```html
<ul>
<li><p>Bird</p></li>
<li><p>Magic</p></li>
</ul>
```

列表中可能包含多个段落，其中每一个子段落必须以 3/4 个空格或一个 tab 缩进：

```md
1. This is a list item with two paragraphs. Lorem ipsum dolor
   sit amet, consectetuer adipiscing elit. Aliquam hendrerit
   mi posuere lectus.

   Vestibulum enim wisi, viverra nec, fringilla in, laoreet
   vitae, risus. Donec sit amet nisl. Aliquam semper ipsum
   sit amet velit.

2. Suspendisse id sem consectetuer libero luctus adipiscing.
```

1. This is a list item with two paragraphs. Lorem ipsum dolor
   sit amet, consectetuer adipiscing elit. Aliquam hendrerit
   mi posuere lectus.

   Vestibulum enim wisi, viverra nec, fringilla in, laoreet
   vitae, risus. Donec sit amet nisl. Aliquam semper ipsum
   sit amet velit.

2. Suspendisse id sem consectetuer libero luctus adipiscing.

缩进子段落是可选项。

如果在列表中插入块引用，> 要缩进。

在列表中使用代码块，用缩进 8 个空格或 2 个 tab。

值得注意，以下内容会偶然触发列表：

```md
1986. What a great season.
```

这种情况可以通过添加反斜杠 `\` 转义：

```md
1986\. What a great season.
```

### 代码块

在 Markdown 中可以通过 缩进 4 个空格或 1 个 tab 来显示代码块。

从代码块的每一行移除一个缩进级别：4 个空格或 1 个 tab。例子：

```md
Here is an example of AppleScript:

    tell application "Foo"
        beep
    end tell
```

会变成：

```html
<p>Here is an example of AppleScript:</p>

<pre><code>tell application "Foo"
    beep
end tell
</code></pre>
```

代码块会继续，直到没有缩进的那一行（或文章的结束）。

在代码块中，`&` 和 `<`、`>` 会自动转换成 HTML 实体。例如：

```md
<div class="footer">
    &copy; 2004 Foo Corporation
</div>
```

会变成

```html
<pre><code>&lt;div class="footer"&gt;
    &amp;copy; 2004 Foo Corporation
&lt;/div&gt;
</code></pre>
```

常规 Markdown 语法未在代码块内处理。 例如，星号只是代码块中的文字星号。 这意味着使用 Markdown 编写 Markdown 自己的语法也很容易。

### 分割线

在 Markdown 中添加分割线（`<hr />`）的方法：在同一行使用至少三个或多个星号 `*`、连字符 `-`、下划线 `_`：

```md
* * *

***

- - -

---

___

_ _ _
```

* * *

***

- - -

---

___

_ _ _

## 跨度元件（Span Elements）

### 链接

Markdown 支持两种形式的链接：行内和引用。

在这两种形式中，链接文本均由方括号 `[]` 分割。

为了创建行内链接，在方括号后使用常规括号，并在其中插入链接。`链接` 后还可以添加一个标题作为 HTML 的 title 文本。例子：

```md
This is [an example](http://example.com/ "Title") inline link.

[This link](http://example.net/) has no title attribute.
```

会产生：

```html
<p>This is <a href="http://example.com/" title="Title">
an example</a> inline link.</p>

<p><a href="http://example.net/">This link</a> has no
title attribute.</p>
```

如果使用同一服务器的本地资源，则可以使用相对路径：

```md
See my [About](/about/) page for details.
```

参考样式链接使用第二组方括号，在其中放置您选择的标签以标识该链接：

```md
This is [an example][id] reference-style link.
```

你还可以在两个方括号之间加入空格：

```md
This is [an example] [id] reference-style link.
```

This is [an example] [id] reference-style link.

然后，在这个文本的任何地方，单独一行，像这样定义标签：

```md
[id]: http://example.com/  "Optional Title Here"
```

   [id]:    http://example.com/  "Optional Title Here"

解释：

- 方括号内是识别链接（也可以不大于 3 个空格的缩进）；
- 后面是冒号；
- 再后面是至少一个空格；
- 再后面是链接；
- （可选）再后面是用 `""`、`''` 或 `()` 包裹的链接标题

*注意*：在 `Markdown.pl` 1.0.1 中，有个 bug 阻止单引号分隔链接标题。

链接还可以用 `<>` 包裹：

```md
[id]: <http://example.com/>  "Optional Title Here"
```

如果链接很长，你还可以把标题放到使用多余的 空格 或 tab 缩进下一行：

```md
[id]: http://example.com/longish/path/to/resource/here
    "Optional Title Here"
```

链接定义仅在 Markdown 处理期间用于创建链接，并在 HTML 输出中从文档中删除。

链接定义名称可以由字母，数字，空格和标点符号组成，但它们不区分大小写。 例如，这两个链接：

```md
[link text][a]
[link text][A]
```

隐式链接可以省略链接标签，例子：

```md
[Google][]
[Google]: https://www.google.com/
```

因为链接名称可能包含空格，所以对于包含多个单词的链接名称也是可行的：

```md
Visit [Daring Fireball][] for more information.
[Daring Fireball]: https://daringfireball.net/
```

### 强调

### 代码

### 照片

## 杂项

### 反斜线转义

### 自动链接

## 添加任务列表

- [ ] 「请帮我列出解决此问题的完整步骤」

- [x] 「有没有人能指个方向？（剩下的我可以自己来）」

- [x] 「麻烦看下我这还差点什么？」（指点一下我也许就能独自攻克此问题）

- [x] 「我应该查阅哪个文章或者哪个网站？」（大致指个方向都会对我有很大帮助）

```md
- [ ] 「请帮我列出解决此问题的完整步骤」

- [x] 「有没有人能指个方向？（剩下的我可以自己来）」

- [x] 「麻烦看下我这还差点什么？」（指点一下我也许就能独自攻克此问题）

- [x] 「我应该查阅哪个文章或者哪个网站？」（大致指个方向都会对我有很大帮助）
```

## 添加换行符

在 markdown 中，无法多次按 Enter 键，并不能形成多个空行，需要使用 HTML 语法

使用 `<br/>` 形成空行

## 添加脚注

```markdown
以前曾经学过《未选择的路》[^1]

[^1]: [未选择的路](https://baike.baidu.com/item/未选择的路/79357)
```

就是这样添加脚注的

---

**参考资料**：

1. <https://daringfireball.net/projects/markdown/syntax>
