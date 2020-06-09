---
title: Hugo 博客添加百度搜索
date: 2020-06-09T16:58:48+08:00
categories: ["技术"]
tech: ["Hugo"]
slug: Hugo blog add baidu search
---

## 新增菜单

首先在 `~/config.toml` 配置文件中的相应位置添加以下代码：

```toml
    [[menu.main]]
        url = "/about/"
        name = "关于"
        weight = 7
        pre = "internal"
        post = "user-circle"
        identifier = "about"
+    [[menu.main]]
+       url = "/search/"
+       name = "搜索"
+       weight = 8
+       pre = "internal"
+       post = "search"
```

## 添加搜索样式

打开文件 `~/assets/scss/custom/_custom.scss`，加入以下代码：

```scss
//设置百度search样式
.searchbar {     
	border: rgb(120, 120, 120) solid 2px;
	border-radius: 2em;    /*左右边框为半圆*/
	width: 80%;
	height: 40px;
	box-shadow: 0px 0px 10px rgb(125, 125, 125);
	margin: 0 auto;  /*重要！整个搜索框居中对齐*/
	padding: 4px;
	/*margin-top: 90px;	*/
}
.search{ 
	height: 38px;
	border:none;    /*取消默认的边框以设置自定义边框*/
	outline:none;   /*取消浏览器默认的蓝光边框以设置自定义的输入框*/   
	vertical-align: middle;
	/*background: #000000*/
	background-color:transparent;/*搜索框与搜索按钮透明*/
	
	width: 90%;
	margin-left: 10px;
	font: bolder;
	font-size: 20px;
	color:rgb(120, 120, 120);	
}
```

## 新建“百度”菜单的_INDEX.MD

在文件夹`~/content/zh/`(我使用的多语言)下新建文件夹`search`，并在search文件夹下新建文件**_index.md**，并写入以下代码：

```markdown
<div class="searchbar">
<form action="https://www.baidu.com/baidu?ie=utf-8" target="blank">
<input class="search" type="text" placeholder="" autocomplete="off" name="word">
</form>
</div>
```

## 修改图标



