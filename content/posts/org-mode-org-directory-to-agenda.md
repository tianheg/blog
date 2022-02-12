+++
title = "Orgmode 加载文件夹下的所有 Org 文件到 Agenda"
date = 2022-02-12T00:00:00+08:00
lastmod = 2022-02-12T21:38:02+08:00
tags = ["Orgmode", "技术"]
draft = false
+++

<https://www.emacswiki.org/emacs/OrgMode>

```elisp
(setq org-agenda-files (file-expand-wildcards "~/org/*.org"))
```