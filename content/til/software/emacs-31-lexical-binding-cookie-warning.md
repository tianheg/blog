---
title: Emacs 31 的 lexical-binding cookie 警告与 elpa 重编译
status: draft
date: 2026-09-17T00:17:46+08:00
header: Tools
---

从 Emacs 30 换到 31 之后，打开 org 文件会冒出一条警告：

```
Warning (files): Missing ‘lexical-binding’ cookie in "~/.emacs.d/elpa/toc-org-20260514.1415/toc-org.el".
You can add one with ‘M-x elisp-enable-lexical-binding RET’.
```

## 警告只在 `.el` 被选中时出现

这条检查针对的是没有 `-*- lexical-binding: t -*-` cookie 的**源文件**，而 `.elc` 不做这项检查 —— 所以正常加载字节码根本看不到它。Emacs 30 只在 byte-compile 时提出这件事，31 把它延伸到了加载阶段，于是升级之后才开始冒出来。

出现的前提只有两种：

1. `load-prefer-newer` 为 `t`，且 `.el` 比 `.elc` 新
2. 该包没有 `.elc`

配置从别的机器或别的 Emacs 版本整体拷过来时最典型：`elpa/` 里的 `.elc` 是旧版本编译的，与 `.el` 的 mtime 只差几十毫秒且顺序颠倒，于是每次加载都走源码。

看某个包实际加载了哪个文件：

```elisp
(let ((before (length load-history)))
  (load "/path/to/toc-org")
  (princ (car (nth (1- (- (length load-history) before)) load-history))))
;; => ".../toc-org.el"   走了源码
;; => ".../toc-org.elc"  走了字节码
```

批量找出 elpa 里被源码压过的包：

```bash
cd ~/.emacs.d/elpa
for f in */*.el; do [ -e "${f}c" ] && [ "$f" -nt "${f}c" ] && echo "$f"; done
```

## 修法一：按警告类型抑制

警告的 type 是嵌套列表 `(files missing-lexbind-cookie "<绝对路径>")`，可以按前缀匹配抑制：

```elisp
(setq warning-suppress-types '((files missing-lexbind-cookie))
      warning-suppress-log-types '((files missing-lexbind-cookie)))
```

这两个变量分工不同，只设第一个不生效（日志通道仍会输出），必须同时设。type 也必须写成嵌套列表：`((missing-lexbind-cookie))` 匹配不上，裸写 `'(files missing-lexbind-cookie)` 直接报 `wrong-type-argument listp`。

## 修法二：重编译 elpa

`M-x package-recompile-all` 比抑制治本：`.elc` 更新之后 `load-prefer-newer` 自然选字节码，警告消失，也省掉每次解释源码的开销。

```elisp
(require 'package)
(setq package-user-dir (expand-file-name "elpa" user-emacs-directory))
(package-initialize)          ; 关键：激活 load-path
(package-recompile-all)
```

```bash
emacs -Q --batch -l recompile.el > /tmp/rc.log 2>&1
```

三个坑：

- **必须 `package-initialize`**。只用 `package-load-all-descriptors` 读描述符的话，`load-path` 里没有其它包，编译时凡 `(require 'avy)`、`(require 'dash)` 一律 `Cannot open load file`，大面积失败
- **`byte-compile-file` 在编译前会删掉旧的 `.elc`**，所以编译失败等于字节码文件直接消失。动手前备份整个 `elpa/`，并且用 pax 格式（`tar --format=posix`）—— 普通 tar 把 mtime 截到整秒，恢复后同一秒内的源文件会被误判为「更新」
- **compat 包要单独补**：`compat-26..31.el` 按文件名 `load "compat-macs.el"`，而 compat 目录不在 `load-path` 里，必然失败。把该目录 push 进 `load-path` 后逐个 `byte-compile-file`（`compat-macs.el` 本身返回 `no-byte-compile`，宏文件正常）

编译过程会刷一堆 `file has no ‘lexical-binding’ directive`，那是编译期警告 —— 说明这些包按 dynamic binding 编译，语义和升级前一致。

## 为什么不直接给第三方包加 cookie

加 `lexical-binding: t` 会改变文件的求值语义（lexical 与 dynamic 对自由变量的处理不同），是包作者该判断的事，而且包一升级就被覆盖。抑制和重编译都不动源码。

相关：[[emacs-find-file-at-point]]
