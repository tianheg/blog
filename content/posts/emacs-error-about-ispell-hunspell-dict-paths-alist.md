+++
title = "Emacs 未指定 ispell-hunspell-dict-paths-alist 报错"
date = 2021-10-28T00:00:00+08:00
lastmod = 2022-04-27T14:32:37+08:00
tags = ["技术", "Emacs"]
draft = false
+++

今天在使用过程中，出现错误：

```text
Error running timer ‘auto-save-buffers’: (error "Can’t find Hunspell dictionary with a .aff affi\
x file")
```

我的 Arch Linux 已安装 Hunspell，我又安装了 hunspell-en_us。

安装后错误变为：

```text
Error running timer ‘auto-save-buffers’: (error "ispell-phaf: No matching entry for hunspelldict\
 in ‘ispell-hunspell-dict-paths-alist’.
")
```

在这里[^fn:1]学会配置 Hunspell 环境，然后进行了修改[^fn:2]，问题解决。

对 `~/.emacs.d/lisp/init-spelling.el` 进行的修改：

```text
+    (setq ispell-hunspell-dict-paths-alist
+          '(("en_US" "/usr/share/hunspell/en_US.aff")))
+    (setq ispell-local-dictionary "en_US")
     (setq ispell-local-dictionary-alist
-          (list (list "hunspelldict" "[[:alpha:]]" "[^[:alpha:]]" "[']" nil (list "-d" my-default-spell-check-language) nil 'utf-8)))
+          (list (list "en_US" "[[:alpha:]]" "[^[:alpha:]]" "[']" nil (list "-d" my-default-spell-check-language) nil 'utf-8)))
```

[^fn:1]: <https://github.com/redguardtoo/emacs.d/blob/8ad48855ff/lisp/init-spelling.el#L61-L83>
[^fn:2]: <https://github.com/tianheg/emacs.d/commit/32fa8b8>
