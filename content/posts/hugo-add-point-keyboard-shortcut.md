---
title: 'Hugo Add . Keyboard Shortcut'
date: 2024-04-26T07:40:00+08:00
tags: [Hugo, '技术']
---

I read a [post](https://garrit.xyz/posts/2022-10-05-simple-guestbook), like the idea of press `.` then take me to the edit page. I made
some modifications to the code, here is mine:

```javascript
  window.addEventListener("keypress", (event) => {
    const isEditKey = event.key === ".";
    const isHomePage = window.location.pathname === "/";
    const isPostsPage = window.location.pathname === "/posts/";
    const isTagsPage = window.location.pathname.startsWith("/tags/");

    const isInputOrTextArea =
      event.target.nodeName === "INPUT" || event.target.nodeName === "TEXTAREA";

    if (
      isEditKey &&
      !isHomePage &&
      !isPostsPage &&
      !isTagsPage &&
      !isInputOrTextArea
    ) {
      const contentPath = window.location.pathname.split("/");
      const fileName =
        contentPath.length === 3
          ? `${contentPath[contentPath.length - 2]}.org`
          : `posts/${contentPath[contentPath.length - 2]}.org`;
      const editUrl = `https://github.com/tianheg/blog/edit/main/content/${fileName}`;
      window.location.href = editUrl;
    }
  });
```
