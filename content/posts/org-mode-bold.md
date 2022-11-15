+++
title = "Bold in Org-mode"
date = 2021-11-25T00:00:00+08:00
lastmod = 2022-02-12T21:40:46+08:00
tags = ["Org-mode", "技术"]
draft = false
+++

以下是对 Emacs 下的 Orgmode 的文本加粗测试。

**精神** 是人在思考时表现出来的意志和持久的追求。 **态度** 是人在思考时表现出来的当下的意愿和倾向。将当下的意愿和持久的追求结合起来，就会形成诸如理性的谦逊、执著、公正、勇敢、诚实、勤奋等好的 **理性美德。**

**迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。**

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。
**迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。**

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。 **迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。**

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭
**代器会暴露迭代其关联可迭代对象的 API。迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。**

**Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C with a focus on code safety and concise syntax.**

Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C **with a focus on code safety and concise syntax.**

Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C **with a focus on code safety and concise syntax**.

**Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C**
++ or C with a focus on code safety and concise syntax.

原来的文本：

```nil
*精神* 是人在思考时表现出来的意志和持久的追求。 *态度* 是人在思考时表现出来的当下的意愿和倾向。将当下的意愿和持久的追求结合起来，就会形成诸如理性的谦逊、执著、公正、勇敢、诚实、勤奋等好的 *理性美德。*

*迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。*

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。
*迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。*

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭代器会暴露迭代其关联可迭代对象的 API。 *迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。*

迭代器（iterator）是按需创建的一次性对象。每个迭代器都会关联一个可迭代对象，而迭
*代器会暴露迭代其关联可迭代对象的 API。迭代器不关心可迭代对象的内部结构，只关心如何取得连续的值。*

*Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C with a focus on code safety and concise syntax.*

Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C *with a focus on code safety and concise syntax.*

Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C++ or C *with a focus on code safety and concise syntax*.

*Rust helps developers write fast software that's memory-efficient. It's a modern replacement for languages like C*
++ or C with a focus on code safety and concise syntax.
```

由以上测试可得出结论：

1.  对于英文文本，加粗前要确保目标文本前后存在空格或空行
2.  对于中文文本，加粗前要确保目标文本前后存在空格或空行
3.  对于中文文本，加粗要包含标点

> While in Org, by default at least, emphasis markers have to be delimited by whitespace or punctuation.[^fn:1]

[^fn:1]: <https://emacs.stackexchange.com/a/42188/30800>