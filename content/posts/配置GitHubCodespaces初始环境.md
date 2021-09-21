+++
date = '2021-07-29T21:15:30+08:00'
slug = 'github-codespaces-initial-setup'
tags = ['GitHub', 'yarn', 'node', 'npm']
title = '配置 GitHub Codespaces 初始环境'

+++

我想在 Codespace 里用 ohmyzsh，于是在 GitHub 寻找办法。我真的找到[一个](https://github.com/codespaces-examples/base)，但是直接拿过来用不了，初始化环境时很多错误。经过我多次修改能够使用了，预装了 ohmyzsh 和 nvm，如果你想尝试可以使用我的新仓库模板 [tianheg/new-repo-template](https://github.com/tianheg/new-repo-template)。

文件结构：

```txt
.devcontainer
-->devcontainer.json
-->Dockerfile
-->setup.sh
```

devcontainer.json:

```json
{
    "name": "Codespaces Basic Starter",
    "extensions": [
        "eamodio.gitlens",
        "deibit.devdocs",
        "knisterpeter.vscode-github",
        "github.copilot",
        "oderwat.indent-rainbow",
        "yzhang.markdown-all-in-one",
        "davidanson.vscode-markdownlint",
        "christian-kohler.path-intellisense",
        "alefragnani.project-manager",
        "tds.taptap-vscode-theme",
        "octref.vetur",
        "vscode-icons-team.vscode-icons",
        "wakatime.vscode-wakatime",
        "guoruibiao.wordcount",
        "formulahendry.code-runner",
        "dbaeumer.vscode-eslint",
        "github.vscode-pull-request-github",
        "budparr.language-hugo-vscode",
        "ritwickdey.liveserver",
        "eg2.vscode-npm-script",
        "xlthu.pangu-markdown",
        "esbenp.prettier-vscode",
        "ms-python.python",
        "stylelint.vscode-stylelint"
    ],
    "dockerFile": "Dockerfile",
    "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
    }
}
```

Dockerfile:

```dockerfile
FROM ubuntu:20.04

WORKDIR /home/

COPY . .

ENV SHELL /bin/zsh

RUN sh ./setup.sh

RUN echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.zshrc"
RUN echo '\n' >> "$HOME/.zshrc"
RUN echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm' >> "$HOME/.zshrc"
```

setup.sh:

```sh
## update and install some things we should probably have
apt-get update
apt-get install -y \
  curl \
  git \
  jq \
  sudo \
  zsh \
  autojump

## install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

## install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/plugins/zsh-syntax-highlighting # install on /root/
git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/plugins/zsh-autosuggestions # install on /root/
curl https://raw.githubusercontent.com/tianheg/config/main/shell/nodeys.zsh-theme --output ~/.oh-my-zsh/themes/nodeys.zsh-theme
export USERNAME=codespace
mkdir /home/$USERNAME
cp -R /root/.oh-my-zsh /home/$USERNAME
cp /root/.zshrc /home/$USERNAME
sed -i -e "s/\/root\/.oh-my-zsh/\/home\/$USERNAME\/.oh-my-zsh/g" /home/$USERNAME/.zshrc # select "/root/.oh-my-zsh", replace it with "/home/$USERNAME/.oh-my-zsh"
chown -R $USER_UID:$USER_GID /home/$USERNAME/.oh-my-zsh /home/$USERNAME/.zshrc
curl https://raw.githubusercontent.com/tianheg/config/main/shell/zshrc_codespace --output ~/.zshrc
sed -i "/# for examples/aif\ test -t l; then\nexec zsh\nfi" ~/.bashrc
```

上面的代码已经改过多次。每次修改要重新 Rebuild，要花费小 5 分钟时间。如果碰到网络不好的情况，Rebuild 就会失败。

一点一点解决这些小问题也是蛮有意思的。有的是文件夹不存在，有的是文件路径不对，有的是缺少软件，解决的时候不免急躁，因为总是不对，总是报错，很打击我的积极心。但是，在每次出错，我都耐着性子，根据错误日志定位错误，寻找解决办法。在这个过程中，接触了以前没接触的内容：

- `Dockerfile` 的命令规则
- 练习使用 Linux 指令 `sed`

也归纳了我的旧知识：

现在安装 Node.js, npm, yarn 只需要安装 nvm 即可。如上述文件中的命令那样，我已经预装了 nvm，安装 Node.js, npm, yarn 只需要以下命令：

```sh
nvm install --lts # install Node.js, npm
npm install -g yarn # install yarn
```

两个命令的顺序不能颠倒，因为第一个命令安装的 npm 是第二个命令能够执行的必要条件。

```sh
sed -i "/# for examples/aif\ test -t l; then\nexec zsh\nfi"
```

上面这个命令是为了改变终端 Shell 的，Ubuntu 20.04 的默认 Shell 是 bash，我想用 zsh，于是需要在 `.bashrc` 的开头添加如下字样：

```bashrc
if test -t l; then
exec zsh
fi
```

ref:

1. <https://github.com/microsoft/vscode-dev-containers>
2. <https://github.com/codespaces-examples/base>
3. <https://github.com/tianheg/new-repo-template>
