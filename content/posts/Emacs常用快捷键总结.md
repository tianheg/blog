+++
date = '2021-10-29T18:16:20+08:00'
title = 'Emacs 常用快捷键总结'
tags = ['Emacs']
slug = 'emacs-common-keyboard-shortcuts'
+++

Keyboard shortcuts | Effects
--- | ---
`emacs -nw -Q` | 不安装任何插件在命令行打开 Emacs
`C-v` | forward one screen
`M-v` | backwards one screen
`C-l` | text around cursor to center of screen
`M-x help-with-tutorial` | 打开教程
`C-x C-c` | end Emacs session

### Basic Cursor Control

Keyboard shortcuts | Effects
--- | ---
`C-p` | previous line
`C-n` | next line
`C-b` | backward a character
`C-f` | forward a character
`M-b` | backward a word
`M-f` | forward a word
`C-a` | beginning of line
`C-e` | end of line
`M-a` | beginning of sentence
`M-e` | end of sentence
`M-<` | beginning of whole text
`M->` | end of whole text
`C-u num command` | run command, use num as repeat-count; 注意 `C-u 6 C-v` 与其他命令的不同
`C-g` | quit a partially entered command; 退出没有响应的命令
`C-x 1` | kill all other windows

如果遇到暂时禁止执行的命令，按下 `n` 取消执行。

### Inserting and Deleting

Keyboard shortcuts | Effects
--- | ---
`<DEL>=BackSpace` | delete character before current cursor
`M-<DEL>` | kill word before cursor
`C-d` | delete next character after cursor
`M-d` | kill next word after cursor
`C-k` | kill from cursor to end of line
`M-k` | kill from cursor to end of current sentence
`C-e` | move to end of line
`M-e` | move forward to end of sentence
`C-<SPC>(<SPC>=space) move-cursor-to-somewhere C-w C-y` | kill random text, then yank to somewhere(like cut and paste)


`killing` 和 `deleting` 的区别：

- `killed` text can be reinserted (at any position)
- `deleted` things cannot be reinserted in this way, but you can undo a deletion

Reinsertion of killed text is called "yanking".

### Undo

Keyboard shortcuts | Effects
--- | ---
`C-/` | undo a change to text(`C-/` 不会撤销光标移动命令，滑动命令)

For `C-/` Self-inserting characters are usually handled in group of up to 20.

Normally, C-/ undoes the changes made by one command; if you repeat C-/ several times in a row, each repetition undoes one more command.

### Files

Keyboard shortcuts | Effects
--- | ---
`C-x C-f` | find a file
`C-x C-s` | save the file

### Buffers

Emacs stores each file's text inside an object called a "buffer".

Keyboard shortcuts | Effects
--- | ---
`C-x C-b` | List buffers
`C-x b <BUFFER NAME>` | switch buffer
`C-x b *Messages*` | see the messages

### Extending the command set

指的是两种行为：C-x，M-x。

Keyboard shortcuts | Effects
--- | ---
`C-x <one character>` | Character eXtend
`M-x <a long name>` | Named command eXtend
`C-z` | exit Emacs **temporarily**
`fg` or `%emacs`(exec in console) | recover from `C-z`

### Auto save

`#example.md#`，这是一个自动保存的备份文件。

### Echo area

### Mode line

-:**-- TUTORIAL      63% L736        (Fundamental)--------

- `63%` 表示当前文档的进度。如果来到文档底部会显示 Bot,来到文档顶部会显示 Top。
- `(Fundamental)` 则是指编辑模式，

Major mode

Minor mode

### Searching

Keyboard shortcuts | Effects
--- | ---
`C-s` | start search **after** cursor
`C-r` | start search **before** cursor

### Multiple windows

Keyboard shortcuts | Effects
--- | ---
`C-x 2` | create one more window(top+bottom)
`C-x 3` | create one more window(left+right)
`C-x o` | switch to other windows(one by one)

### Multiple frames

Keyboard shortcuts | Effects
--- | ---
`C-x 5 2` | new frame

### Recursive editing levels

[(Fundamental)]

### Get help

Keyboard shortcuts | Effects
--- | ---
`C-h c C-p` | oneline explanation
`C-h k C-p` | explanation with more details
`C-h f <function name>` | describe a function
`C-h v <variable name>` | describe a variable
`C-h r` | read manual
