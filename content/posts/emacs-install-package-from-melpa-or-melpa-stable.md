+++
title = "选择从 MELPA 或者 MELPA-stable 安装某个包"
date = 2022-02-14T00:00:00+08:00
lastmod = 2022-02-14T13:10:54+08:00
tags = ["Emacs", "技术"]
draft = false
+++

<https://stackoverflow.com/a/38648126>

以下代码原作者写于 2016 年，现在我根据自己对 Emacs 的理解进行修改，没有测试时候可行。

在使用前务必查看最新官方文档[^fn:1]。

```elisp
(require 'package)

(add-to-list 'package-archives
         '("melpa-stable" . "https://stable.melpa.org/packages/") t)
(add-to-list 'package-archives
         '("melpa" . "https://melpa.org/packages/") t)

(setq package-pinned-packages
      '((imenu-anywhere . "melpa-stable")
        (evil-commentary . "melpa")))
```

感谢 Kaushal Modi 的推荐[^fn:2]。

[^fn:1]: <https://stable.melpa.org/#/getting-started>
[^fn:2]: <https://github.com/kaushalmodi/ox-hugo/issues/563#issuecomment-1038604785>