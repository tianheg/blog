---
title: Hugo 博客添加百度搜索
date: 2020-06-09T16:58:48+08:00
tags: ["Hugo"]
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
    /*margin-top: 90px;    */
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

在文件夹`~/content/zh/`(我使用的多语言)下新建文件夹`search`，并在 search 文件夹下新建文件**_index.md**，并写入以下代码：

```markdown
<div class="searchbar">
<form action="https://www.baidu.com/baidu?ie=utf-8" target="blank">
<input class="search" type="text" placeholder="" autocomplete="off" name="word">
</form>
</div>
```

## 修改图标

在网络中找到合适的 `search` svg 图标，并将其放入 `~/data/SVG.toml` 中：

```toml
search = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px" class="icon"><path d="M13.262,14.868l2.479,2.478c-0.376,0.725-0.415,1.445-0.017,1.843l4.525,4.526 c0.571,0.571,1.812,0.257,2.768-0.7c0.956-0.955,1.269-2.195,0.697-2.766l-4.524-4.526c-0.399-0.398-1.119-0.36-1.842,0.016 l-2.48-2.478L13.262,14.868z M8.5,0C3.806,0,0,3.806,0,8.5C0,13.194,3.806,17,8.5,17S17,13.194,17,8.5C17,3.806,13.194,0,8.5,0z M8.5,15C4.91,15,2,12.09,2,8.5S4.91,2,8.5,2S15,4.91,15,8.5S12.09,15,8.5,15z"/></svg>'
```

然后在 `config.toml` 中修改 search 菜单的 `post` 属性为 search。

这样，百度搜索就添加到博客中了。

---

参考链接：

1. [Blog 中加入百度搜索](https://ztygcs.github.io/posts/blog%E4%B8%AD%E5%8A%A0%E5%85%A5%E7%99%BE%E5%BA%A6%E6%90%9C%E7%B4%A2/)
