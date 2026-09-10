---
title: 'Use =use-package='
status: draft
date: 2025-06-15T19:22:54+08:00
header: Tools
---

```lisp
;; package
(require 'package)
(setq package-archives '(("melpa" . "https://melpa.org/packages/")
                         ("gnu" . "https://elpa.gnu.org/packages/")))
(package-initialize)

(unless package-archive-contents
  (package-refresh-contents))

(unless (package-installed-p 'use-package)
  (package-install 'use-package))

(eval-when-compile
  (require 'use-package))

;; Optional
(setq use-package-always-ensure t)
```
