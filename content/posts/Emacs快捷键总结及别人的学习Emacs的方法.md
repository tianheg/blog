---
title: Emacs 快捷键总结及别人的学习 Emacs 的方法
date: 2020-05-18T14:06:58+08:00
tags: ["Emacs"]
slug: Emacs Shortcuts and way to learn
---

C - <chr> : Ctrl + chr || M - <chr> : Alt + chr

ESC key and then type <chr>. We write <ESC> for the ESC key.

## Important note:

To end the Emacs session -- type C-x C-c

To quit a partially entered command, type C-g

To stop the tutorial, type C-x k, then <Return> at the prompt

The characters ">>" at the left margin indicate directions for you to try using a command.

## keyboard shortcuts

C - v : view next screen

M - v : view previous screen

C - n : view next row

C - p : view previous row

C-f     向右移动一个字符
C-b    向左移动一个字符

M-f    向右移动一个词【对中文是移动到下一个标记符号】
M-b   向左移动一个词【对中文是移动到上一个标点符号】

C-n    移动到下一行
C-p    移动到上一行

C-a    移动到行首
C-e    移动到行尾

M-a   移动到句首
M-e   移动到句尾

<DEL>(backspace)  删除光标前的一个字符
C-d     删除光标后的一个字符

M-<DEL>      移除光标前的一个词
M-d(delete)   移除光标后的一个词

C-k(kill)       移除从光标到“行尾”间的字符
M-k             移除从光标到“句尾”间的字符

移除（kill）与删除（delete）的区别：
kill移除的东西可以被重新插入（在任何位置），delete删除的东西则不能使用相同的方法重新插入（不过可以通过撤销一个删除命令来做到）【移除掉的东西虽然看起来“消失”了，但是被Emacs记录下来，因此还可以找回来；而删除掉的东西虽然也可能还在内存里，但是已经被Emacs“抛弃”了，所以就找不回来了。】

重新插入被移除的文字称为“召回（yank）”。一般而言，那些可能消除很多文字的命令会把消除掉的文字记录下来（他们被设定成了“可召回”），而那些只消除一个字符或者只消除空白的命令就不会记录被消除的内容（自然你也就无法召回了）。

删除指定文字的命令步骤：
移动光标到指定文字的第一个字
输入C-<SPC>（空格），Emacs应该会在屏幕下方显示一个“Mark set”的消息【如果C-<SPC>热键被锁定，则改用C-@，这时注意要同时按住shift键】
输入C-w，从“你”开始到“端”之前的文字被全部移除。

## 以你多年的经验，请写出一个新手学习emacs的路线建议

学习Emacs有几条曲线:
先会用基本的快捷键, 安装各种简单的插件, 抄各种各样的配置, 先体验一下Emacs的强大功能。

1. 安装复杂插件, 被各种配置搞崩溃了, 越改挂的越厉害, 大部分人卡在这个阶段, 因为不会Elisp, 导致东拼西凑的方法对于复杂插件行不通
2. 你搞不懂Emacs复杂的配置的原因是因为你不懂 Elisp 编程, 学习Elisp的方法: 老老实实读Emacs内置的 Elisp reference manual, 这么厚的手册怎么学?
   * 一页一页的挨着看, 一个API一个API的读, 不要跳过
   * 每个API, 都在 ielm 里面实践一下
   * 遇到不知道啥鬼用的API, 去Google或EmacsWiki上搜索一下, 看看别人怎么用这些API的?
3. 如果你花了一个月耐下心读完 Elisp reference manual 以后, Emacs 90% 以上的代码你都可以看懂了, 继续折腾复杂插件, 知道 require, autoload, set-key, 各种 hook, defadvice 的在不同环境下的细微差别, 编程上知道 save-excursion, ignore-errors 这些风骚 macro 的用法. 这个阶段可以尝试手动来写一写复杂的配置了, 这个阶段你已经是 Emacs 高级用户了.
4. 如果还不满足, 可以像我这样造点有趣的轮子: My Emacs Plugins 30 , 如果你自己会写Elisp插件, 你会发现Emacs其实是越用越简单的, 因为包括正则表达式, 语法高亮, 模式, 异步子进程, hook, overlay, advice 这些代码你写熟悉以后, 你会发现所有插件的唯一差别就是复杂度和想象力的区别, 不存在想得出来写不出来的东西.
5. 到了这个阶段, 唯一可以让你学习到更多知识的就是去 IRC #emacs 和那些古老的黑客们交流, 或者去扒Github Emacser, 我知道很多日本牛逼哄哄的Emacs开发者都把插件放到 ftp 上 (比如当年的 color-moccur.el ), 学点 Google 语法就可以定向搜索. 这些人都是你会写Emacs插件后, 需要学习和进阶的榜样, 这时候你再看Elisp代码, 你的注意力会放在他们Elisp编程的一些细节上, 比如代码写的更简洁, 方法用的妙, 架构设计上等等, 这是完全不同阶段的探索体验.
6. 如果你还不满足, 好好学习C语言, 然后再找个赚钱的工作, 把自己和家人照顾好. 业余时间直接用C或Elisp给Emacs底层做贡献, 把你的代码贡献固化到Emacs中, 然后你的名字可以像我一样写到 Emacs AUTHORS 里面去装逼: Emacs AUTHORS 89

感觉我自己其实上手时, 一个很大的动力, 就是因为我发现这是 我知道的第一个 可以随意更改快捷键的编辑器, 真的没有任何限制 …, 而我, 我非常想要一个随心所欲, 操作(主要是移动光标) 不需要该死的鼠标的编辑器.

就像很多初次接触 Emacs 的人那样, 觉得 Emacs 很多默认快捷键太奇怪, 因此就开始改, 然后, 刚开始的好多天, 我就光思考 怎样更改快捷键, 什么操作该用那个快捷键 之类的定制思路了, 每次换绑一个快捷键, 就带来极大的成就感 (大家应该懂的, 不是被动的接受, 而是努力去改变!)

然后就按照自己的方式去用 (老实讲, 到这一步, 我感觉 Emacs 的学习曲线真的比 Vim 容易太多了).

我先把我这个快捷键方案玩熟, 再往后, 就是在 baidu 上找各种定制, 例如大家都知道的, 什么显示中文年份(甲午)之类的, 各种配置玩的不亦乐乎,虽然, 我完全不知道这些改动在什么地方生效, 也可以慢慢用一些插件, 好在我学 Emacs 算是比较晚了, 当时 Emacs 23 刚出来, 已经解决了中文编码的问题.

后来, 随着用的时间更多, 发现大把的快捷键冲突. (因为我更改了太多的快捷键, 违背了 Emacs 一些不成文的规定), 然后你会发现, 只要引入一个插件, 你就需要定制一番才能用, 所以, 后来, 大部分默认快捷键, 还是逐渐回归了. (当时很多自己加入的额外的快捷键, 还是保留的)

多年下来, 在别的编辑器上看到的, 或者自己搜到的, 很多插件加入了进来, 我从来不用包管理(虽然我会用), 我都是直接在 github 上下载 ???.el 插件, 有问题也会主动提 issue. (我觉得我提的有关 emacs 的 issue 相比较其他分类, 应该是最多的) 那么多插件, 有的用的很熟了, 而有的, 花好大劲儿配置好, 要么用不好, 要么感觉用不到, 后来发现 aesome-emacs 之后, 发现其实自己在用的, 大部分也是大家在用的.

最后针对小白普及下 Emacs 下面怎么换绑快捷键, 也算是针对我这种上手方式的一个总结:

```elisp
;; 如果你希望全局换绑快捷键, 例如: 所有模式下 Ctrl+f 换成 Ctrl+l

(define-key key-translation-map [(control f)] [(control l)])

;; 如果你希望全局定义一个快捷键, 用 global-set-key (但在特殊模式下, 有可能被该模式自定义绑定覆盖)

(global-set-key [(control right)] 'transpose-current-char) ;光标前所在字母右移

;; 特定默认下设定快捷键, 要在特定的 hook 下, 定义特定的 map. (需要自己去源码里找, 找 -hook, -map 关键字即可.)

(add-hook 'isearch-mode-hook
'(lambda ()
(define-key isearch-mode-map [(control b)] 'isearch-delete-char)
))
```

然后, 最近对我自己这些年积攒下来的插件做了一个彻底的清理, 然后, 配置文件清凉了不少. 这里也贴一下我的 `init.el` 的内容, 也方便大家了解(至少对我来说)有哪些常用的包. (我没有用包管理来下载, 都是自己 提前下载好的, 每个包一个目录, 包含这个包相关的一个或数个 el 文件, 外加一个我写的 ``_init` 结尾的配置文件, 所有的目录会动态的加入 load-path

```elisp
;; -*-Emacs-Lisp-*-

;; ------------------------------显示相关设置------------------------------
(setq custom-theme-directory (expand-file-name "plugins/themes" default-directory))
;; (load-theme 'zenburn t)
(load-theme 'zerodark t)
;; Optionally setup the modeline, 需要 magit 才可以用.
;; (zerodark-setup-modeline-format)
;; ==============================开启的功能==============================

(relative-load "keybindings.el")
(relative-load "autoloads.el")
(require 'org-mode_init)
(require 'ibuffer_init)
(require 'ido_init)
(require 'dired_init)

;; 下面两个库都针对 kill-ring-save, kill-region 等函数添加了 device.
;; 因为判断选区时, 总是首先判断 rect-mark, 因此要确保 rect-mark_init 在
;; browse-kill-ring 之后 require, 行为才正确.
(require 'browse-kill-ring_init)
(require 'rect-mark_init)

(require 'yafolding_init)
(require 'super-save_init)
;; (require 'workgroups_init)
(require 'mark-lines_init)
(require 'avy_init)
(require 'beacon_init)
(require 'which-key_init)
(require 'fill-column-indicator_init)
(require 'zoom-frm_init)

;; (require 'spaceline_init)
(require 'smart-mode-line_init)
(require 'flycheck_init)
(require 'neotree_init)

(require 'move-dup_init)
;; (require 'aggressive-indent_init)
(require 'auto-indent-mode_init)
(require 'edit-server_init)
(require 'markdown-mode_init)

;; FIXME: 尝试 require 文件，没有也不失败。
(require 'auto-complete_init)
(require 'yasnippet_init)
(require 'iedit_init)
(require 'undo-tree_init)
(require 'toggle-quotes_init)
(require 'tabbar_init)
(require 'helm_init)

;; ============================== 编程相关 ==============================

(require 'mode-compile_init)
(require 'smart-tags-jump_init)
(require 'highlight-indent-guides_init)
(require 'highlight-escape-sequences_init)
(require 'feature-mode_init)
(require 'rainbow-delimiters_init)
(require 'yaml-mode_init)
(require 'git-emacs_init)
(require 'git-gutter_init)
(require 'gist_init)
(require 'rvm_init)
(require 'enh-ruby-mode_init)
(require 'ruby-test-mode_init)
(require 'robe-mode_init)
(require 'yari_init)
(require 'web-mode_init)
(require 'scss-css-mode_init)
(require 'js2-mode_init)
(require 'rust-mode_init)
(require 'go-mode_init)

;; 加载 dotfiles 时，阻止 gc.
;; (when (file-exists-p (expand-file-name ".emacs" config))
;; (let ((gc-cons-threshold 20000000))
;; (load ".emacs")))
```

EDIT:
想起个事情, helm 27 , 我想这个插件大名, 应该无人不知, 无人不晓吧? 了解的人应该也知道, 这个项目堪称 emacs 社区的一个模范项目, 遇到问题, 作者总是第一时间回应, 当然这也应该是 Emacs 社区特别成功的 开源项目之一了吧.
但是维护这个项目花费了作者太多的时间, 现在这个作者在募捐, 默认是 20 欧, 数字你可以改, 币种也可以改, 我就改成了 $10  , 我觉得不在多, 关键在于态度, 请每一位力所能及的 emacser 都尽一份力.
