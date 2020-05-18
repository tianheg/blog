---
title: Hexo博客上传百度谷歌搜索引擎
date: 2020-05-18T14:22:54+08:00
categories: ["技术"]
series: ["Hexo"]
slug: Hexo blog allow googlebot and baiduspider
keywords: ["SEO","hexo"]
description: "部分记录了把网站添加到百度和谷歌的搜索列表的步骤"
---

针对 hexo 主题 even 来说，它的文件结构如下所示：

```
even
|---[.github]
|------[workflows]
|---------deploy.yml
|---[languages]
|------default.yml
|------en.yml
|------zh-CN.yml
|------zh-tw.yml
|---[layout]
|------[_macro]
|---------archive.swig
|---------post.swig
|------[_partial]
|---------[_footer]
|------------social.swig
|---------[_head]
|------------meta.swig
|---------[_post]
|------------copyright.swig
|------------reward.swig
|------------toc.swig
|---------comments.swig
|---------footer.swig
|---------head.swig
|---------header.swig
|---------pagination.swig
|---------slideout.swig
|------[_script]
|---------[_analytics]
|------------baidu-analytics.swig
|------------google-analytics.swig
|---------[_comments]
|------------changyan.swig
|------------disqus.swig
|------------gitalk.swig
|------------livere.swig
|------------utterances.swig
|---------analytics.swig
|---------comments.swig
|---------counter.swig
|---------libs.swig
|---------push.swig
|---------theme.swig
|------_layout.swig
|------archive.swig
|------categories.swig
|------index.swig
|------page.swig
|------post.swig
|------tags.swig
|---[source]
|------[css]
|------[fonts]
|------[js]
|------[lib]
|------alipay.jpg
|------favicon.ico
|------robots.txt
|------wechat.jpg
|---_config.yml
|---.all-contributorsrc
|---.eslintignore
|---.eslintrc
|---.gitignore
|---LICENSE
|---package.json
|---README.md
|---yarn.lock
```

谷歌百度站点收录，需要下载插件：

```
npm install hexo-generator-baidu-sitemap --save
npm install hexo-generator-sitemap --save
```

（可选）在根目录的 _config.yml 文件里添加如下内容：

```yaml
# 自动生成sitemap
sitemap:
  path: sitemap.xml
baidusitemap:
  path: baidusitemap.xml
```



对于主动推送，要下载插件： `hexo-baidu-url-submit`

然后在根目录的 _config.yml 文件里添加如下内容：

```yaml
baidu_url_submit:
  count: 1               # 提交最新的多少个链接
  host: www.yidajiabei.xyz    # 在百度站长平台中添加的域名
  token:       # 秘钥
  path: baidu_urls.txt   # 文本文档的地址， 新链接会保存在此文本文档里
```

