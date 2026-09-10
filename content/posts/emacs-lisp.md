---
title: 'Emacs Lisp(Elisp)'
date: 2022-11-09T15:28:00+08:00
tags: ['技术', Emacs]
---

## Docs
- [An Introduction to Programming in Emacs Lisp](https://www.gnu.org/software/emacs/manual/html_node/eintr/index.html)
- [Emacs Lisp](https://www.gnu.org/software/emacs/manual/html_node/elisp/index.html)
## Tutorials
- [Learn elisp in Y Minutes](https://learnxinyminutes.com/docs/elisp/)

## 总是出现的错误提示

```bash
Symbol’s function definition is void: greeting
```

函数要先执行一次，在 minibuffer 处出现函数名称后，才能调用。

```lisp
(insert "test")
testnil
```

不该出现 nil，为了找到异常原因，我重新包管理器安装一次、编译安装一次、通过 Vagrant 在 Ubuntu22.04 下安装一次，都是 28.2 版本，都存在这种情况。

稍后尝试其他版本。知道原因了，这不是异常，C-j 执行时，[会插入 nil](https://stackoverflow.com/a/4790821/12539782)。改成 `C-x C-e` 就没有了（再次尝试还是不行，有 nil）。
