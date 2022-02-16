+++
title = "Sass Basics"
date = 2022-02-10T00:00:00+08:00
lastmod = 2022-02-16T15:12:55+08:00
tags = ["技术", "Sass"]
draft = false
+++

<https://sass-lang.com/guide>


## Preprocessing {#preprocessing}

Sass 这一预处理工具，能够帮助我写作更具健壮性、可维护的 CSS。

可通过 `yarn global add sass` 全局安装。之后可以在 Terminal 执行：

```sh
# compile one file
sass input.scss output.css
# watch individual files or directories
sass --watch input.scss output.css
# watch input folder and ouput folder
sass --watch app/sass:public/stylesheets
```


## Variables {#variables}

变量（Variables）可以存储需要重复使用的信息。

```scss
$font-stack: Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}
```

```css
body {
  font: 100% Helvetica, sans-serif;
  color: #333;
}
```


## Nesting {#nesting}

Sass 能够处理和 HTML 一样，写出嵌套的 CSS。但注意不要滥用。

```scss
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li { display: inline-block; }

  a {
    display: block;
    padding: 6px 12px;
    text-decoration: none;
  }
}
```

```css
nav ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
nav li {
  display: inline-block;
}
nav a {
  display: block;
  padding: 6px 12px;
  text-decoration: none;
}
```


## Partials {#partials}

还可以创建一些小的代码片段，包含在一个主 Sass 文件中。代码片段可视为模块化的组件。代码片段文件的命名： `_filename.scss` ，有了 `_` 在编译时 不会生成 \*.css 文件。在主 Sass 文件中，使用 `@use` 调用 partial 文件。


## Modules {#modules}

目前只有 Dart Sass 支持使用 `@use` 导入模块，其他分支（LibSass，Ruby Sass）需使用 `@import rule` ，后者已经[不鼓励使用](https://sass-lang.com/documentation/at-rules/import)。

```scss
// _base.scss
$font-stack: Helvetica, sans-serif;
$primary-color: #333;

body {
  font: 100% $font-stack;
  color: $primary-color;
}
```

```scss
// styles.scss
@use 'base';

.inverse {
  background-color: base.$primary-color;
  color: white;
}
```

```css
body {
  font: 100% Helvetica, sans-serif;
  color: #333;
}

.inverse {
  background-color: #333;
  color: white;
}
```

Mixins
Extend/Inheritance
Operators