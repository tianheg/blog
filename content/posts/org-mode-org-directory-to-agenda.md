+++
title = "Orgmode 加载文件夹下的所有 Org 文件到 Agenda"
date = 2022-02-12T00:00:00+08:00
lastmod = 2022-03-13T09:57:26+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

1.  <https://www.emacswiki.org/emacs/OrgMode>
2.  <https://orgmode.org/manual/Agenda-Files.html>
3.  <https://orgmode.org/worg/org-tutorials/orgtutorial_dto.html>
4.  <http://doc.norang.ca/org-mode.html#AgendaSetup>

<!--listend-->

```elisp
(setq org-agenda-files (file-expand-wildcards "~/org/*.org"))
```

这种方法不好用。

最好还是 `M-x org-agenda-file-to-front` 添加一个个文件。

终于找到错误原因了：

> Ensure you don't have org-agenda-files set in a "customize" block in your .Emacs file. This is a common source of errors.
>
> -- <https://stackoverflow.com/a/21376228>