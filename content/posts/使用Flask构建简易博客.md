+++
date = '2021-10-05T21:38:44+08:00'
title = '使用 Flask 构建简易博客'
tags = ['Python framework']
slug = 'flask'
+++

Flask 是 Python 的微框架，用于构建 Web 应用。

在学习 MDN[^1] 时，来到这一页[^2]。读到「在本地运行服务端语言」，Python 语言的运行可以通过 Django，Flask 和 Pyramid。我选择了 Flask。在它的官网有专门的入门教程[^3]。我跟着教程，一点一点建立起文件结构，测试时遇到不少错误，目前判断是版本问题。不过，本地运行时教程中设定的功能都实现了：注册、登陆、新建博客。不足的是，新建博客、输入内容保存后不能再编辑。源代码在这里[^4]，以下内容整个过程。

## 创建虚拟环境[^5]

```sh
python -V
# Python 3.9.7 Python 版本为 3.x 时使用以下命令
python -m venv venv --upgrade-deps # --upgrade-deps 升级依赖到最新版
source <venv>/bin/activate # 进入虚拟环境
```

使用虚拟环境的好处可以从两个角度考虑：第一，对于要进行的项目本身来说，可以得到一个干净的初始环境，有利于接下的包依赖的安装；第二，对于主机，也就是我此时使用的电脑来说，要学习的项目只是一次性安装，之后可能不再使用。如果把这次实践使用的包依赖全部安装在主机环境下，再加上疏于清理，长此以往，积攒在主机环境中的包依赖会增多，主机的有硬盘容量也会减少。

如果没有特别声明，以下内容中涉及的命令执行全部在虚拟环境中。

## Demo

Demo 在这里是指最小运行步骤。

```sh
pip install Flask # 安装 Flask 框架
```

在当前目录下新建 `main.py`:

```py
from flask import Flask

app = Flask(__name__)
@app.route("/")
def hello_world():
  return "<h1>Hello World!</h1>"
```

执行以下命令：

```sh
export FLASK_APP=main # 当前执行文件的名称，如果文件命名为 app 或 wsgi 则不需要执行该命令
flask run
```

之后可以在浏览器打开 `flask run` 命令执行后下显示出的链接：`http://127.0.0.1:5000`。如你所见，浏览器中现实的就是 `Hello World!`。

## 开发模式选择与环境变量

前一小节中设置的 `FLASK_APP` 即为环境变量中的一个。其他可能用到的环境变量有：`FLASK_ENV`，`FLASK_RUN_PORT`。

开发模式有两种：生产模式（production）和开发模式（development）。可以通过环境变量 `FLASK_ENV` 设置。

没有介绍的 `FLASK_RUN_PORT` 是设置端口号的，如果默认端口被占用，可以改成其他未被占用的端口。

每次使用环境变量都在命令行中输入很麻烦，所以为了方便，可以把它们写成如下样式，并保存为 `.env`。但是，使用此功能需要安装 python-dotenv 依赖，安装命令：

```sh
pip install python-dotenv
```

```sh
FLASK_APP=main
FLASK_ENV=development
# FLASK_RUN_PORT=8000
```

## 简易博客撰写流程

文档结构（直接复制自官方文档），再和我的进行比较得来：

```text
/home/user/Projects/flask-tutorial
├── flaskr/
│   ├── __init__.py
│   ├── auth.py
│   ├── blog.py
│   ├── db.py
│   ├── schema.sql
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   └── blog/
│   │       ├── create.html
│   │       ├── index.html
│   │       └── update.html
│   └── static/
│       └── style.css
├── tests/
│   ├── conftest.py
│   ├── test_factory.py
│   ├── test_auth.py
│   ├── test_blog.py
│   ├── test_db.py
│   └── data.sql
├── venv/
├── .gitignore
├── setup.cfg
├── setup.py
└── MANIFEST.in
```

我的源码在这里[^6]。当你准备好运行时，需要初始化数据库：

```sh
flask init-db
```

以上文件结构中有一个重要部分——测试。我在学习该项目时，很多包依赖已经更新了几个版本，所以在测试时有很多报错。占比最高的错误是：

```sh
sqlite3.OperationalError: near "(": syntax error
```

而在部署生产环境出现的一个错误：

```sh
sqlite3.OperationalError: no such table: post
```

第一个只是一个语法错误，暂时找不到，以后再深究。第二个是数据库语法写得有问题，以后再找原因。

## 一些想法

我觉得学习编程，最开始就是先做出一个东西，有成就感之后再研究其中原理。就拿这次实践来说，我一开始就是想知道运行 Python 语言的服务器程序是如何工作的。于是，找到 Flask 的官方文档开始学习。从官方文档中，我学到了 Flask 的安装和基本用法，之后再跟着 Tutorial 一步一步地编写代码，测试能否得到预期结果。

[^1]: <https://developer.mozilla.org/en-US/>
[^2]: <https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server#running_server-side_languages_locally>
[^3]: <https://flask.palletsprojects.com/en/2.0.x/tutorial/>
[^4]: <https://github.com/pallets/flask/tree/2.0.2/examples/tutorial>
[^5]: <https://docs.python.org/3/library/venv.html#creating-virtual-environments>
[^6]: <https://github.com/tianheg/exercise/tree/main/python/flask-tutorial>
