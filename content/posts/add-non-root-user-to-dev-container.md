+++
title = "将 non-root 用户添加到开发容器中"
date = 2021-07-31T00:00:00+08:00
lastmod = 2022-03-04T13:44:38+08:00
tags = ["VS Code", "技术", "Docker"]
draft = false
+++

**没有成功**

non-root 即非 root，意思是没有管理员权限（根权限）。

默认的 Docker 镜像使用的是 root 用户作为默认用户，但是实际开发中，我需要
non-root 用户，这样使运行环境更安全。


## 为 VS Code（server）指定用户 {#为-vs-codeserver 指定用户}

如果你使用的镜像或 Dockerfile 已经提供了一个可供选择的 non-root
用户，但默认默认用户仍然是 =root=。可以选择让 VS
Code（server）和任何子进程（终端、任务、调试）使用它，方法是在
devcontainer.json 中指定 remoteUser 属性：

```text
"remoteUser": "user-name-goes-here"
```

在 Linux 上，如果在 devcontainer.json 中引用 Dockerfile
或映像，这还将自动更新容器用户的 UID/GID
以匹配的本地用户，从而避免此环境中存在的绑定装入权限问题(除非设置了
`"updateremoteuserid": false`)。在 Docker Compose 实例中，容器用户的
UID/GID 不会被更新，但是可以在 Dockerfile 中手动更改这些值。

由于此设置仅影响 VS 代码和相关子过程，因此需要重新启动 VS
代码（或重新加载窗口）才能生效。但是，UID/GID
更新仅在创建容器时应用，并且需要重新生成才能更改。


## 创建 non-root 用户 {#创建-non-root-用户}

```text
ARG USERNAME=user-name-goes-here
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.
USER $USERNAME
```


## 改变已存在用户的 UID/GID {#改变已存在用户的-uidgid}

当 remoteUser 属性在 Linux 上使用 Dockerfile
或镜像时尝试根据需要自动更新 UID/GID 时，可以使用 Dockerfile
中的这个代码片段手动更改用户的 UID/GID。根据需要更新 ARG 值。

```text
ARG USERNAME=user-name-goes-here
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME
```

ref:

<https://code.visualstudio.com/docs/remote/containers-advanced#_adding-a-nonroot-user-to-your-dev-container>