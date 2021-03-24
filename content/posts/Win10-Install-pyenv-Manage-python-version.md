---
title: Win10 安装 pyenv 管理 python 版本
date: 2020-04-06T13:52:14+08:00
tags: ["Python","Win10"]
---

逛 B 站时，听过一个 up 主讲过实际开发中的 python 虚拟环境，不同项目要求使用不同 python 版本时，可以通过创建虚拟环境的方式进行调用，要用到 virtualenv 包。说到软件的话，PyCharm 可以很轻松地管理 python 版本，有兴趣的同学可以尝试一下。

## 初试 pyenv

pyenv（<https://github.com/pyenv/pyenv> ）是一款 python 版本控制工具，通过它可以很好地、同时将 python 的多个版本安装在电脑上。它支持 mac、linux。但是，不支持 win10。

于是，另一群人开发了 pyenv-win（<https://github.com/pyenv-win/pyenv-win> ）。它是 pyenv 的 win 版本。不过，它还并不完善，这一点从这一仓库的 star 数，以及我在安装过程中遇到了问题就可以看出来。

简述官方提供安装步骤：

### Get pyenv-win

Get pyenv-win via one of the following methods.(Note: examples are in command prompt. For Powershell, replace `%USERPROFILE%` with `$env:USERPROFILE`. For Git Bash, replace with `$HOME`.)

- **With pip**(to support existing python users)
  - `pip install pyenv-win --target %USERPROFILE%/.pyenv`

- **With zip file**
  1. Download link: [pyenv-win](https://github.com/pyenv-win/pyenv-win/archive/master.zip)
  2. Extract to `%USERPROFILE%/.pyenv`

- **With Git**
  - `git clone https://github.com/pyenv-win/pyenv-win.git %USERPROFILE%/.pyenv`

### Finish the installation

1. Add a new variable under System variables in ENVIRONMENT with

   name:`PYENV` value:`%USERPROFILE%\.pyenv\pyenv-win`

2. Now add the following paths to your ENVIRONMENT Path variable in order to access the pyenv command (don't forget to separate with semicolons):
   - `%PYENV%\bin`
   - `%PYENV%\shims`

3. Verify the installation was successful by opening a new terminal and running `pyenv --version`
4. Now run the `pyenv rehash` from home directory

## 简述我的安装方法

1. 一开始按照官方顺序，选择 pip 安装，添加环境变量，在命令提示符中输入 `pyenv --version` 显示

   ```bash
   'pyenv' is not recognized as an internal or external command, operable program or batch file.
   ```

2. 然后，我开始看仓库的 issues，从中了解到，要`rehash`一下，还有提及`choco rehash`。

3. 看到 `choco` 我开始想：能不能通过 `choco` 安装 `pyenv` 呢？我在这里 ( <https://chocolatey.org/packages/pyenv-win> ) 真的找到了。于是乎，我通过它下载了 `pyenv` 。发现它在 User variables 中的 Path 自动生成了 `C:\Users\USERNAME\.pyenv\pyenv-win\bin`、 `C:\Users\USERNAME\.pyenv\pyenv-win\shims`。

4. 此时在 command prompt, Powershell, Git Bash 中输入 `pyenv --version`，分别显示：

   ```bash
   C:\Users\USERNAME>pyenv --version
   The system cannot find the file specified.
   pyenv
   ```

   ```bash
   PS C:\Users\USERNAME> pyenv --version
   The system cannot find the file specified.
   pyenv
   ```

   ```bash
   USERNAME@YOUR-PC-NAME MINGW64 ~
   $ pyenv --version
   The system cannot find the file specified.
   pyenv
   ```

   都不能显示，但是输入`pyenv`却能够得到相关版本和命令信息。所以，这款工具并不完善。

   有机会的话，我希望自己能够改进一些。

20200407

`pyenv-win` 虽然能够安装，但是通过它安装 python，却并不能使用。暂时找不到解决办法。

不过，我把通过 `pyenv-win` 安装的 python3.6.5 卸载了。然后重新单独安装 3.6.5。把它安装在和我 3.8.2 版本相同的目录下。

把 python36 和 python38 目录下的`python.exe`，分别改为`python36.exe`和`python38.exe`。

在命令提示符中，

输入`python36`：

```bash
C:\Users\yourname>python36
Python 3.6.5 (v3.6.5:f59c0932b4, Mar 28 2018, 17:00:18) [MSC v.1900 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

输入`python38`：

```bash
C:\Users\yourname>python38
Python 3.8.2 (tags/v3.8.2:7b3ab59, Feb 25 2020, 23:03:10) [MSC v.1916 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

可以分别使用了。

但是，`pip`（用来下载 python 库）却用不了了。

查过资料后，在使用`pip`时，要采用格式`pythonXX -m pip <command>`。
