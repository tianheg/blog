+++
title = "配置 dotfiles"
date = 2021-08-01T00:00:00+08:00
lastmod = 2022-04-27T14:26:39+08:00
tags = ["技术"]
draft = false
+++

日常开发中会接触到很多 `.*`
类文件，这些是程序的配置文件。使用程序时间长了，会形成属于自己的 `.*`
文件。如果能够对这些文件进行管理，如果需要重新配置开发环境，这些自己的
`.*` 文件会起到关键作用。

## 在这过程中安装的程序 {#在这过程中安装的程序}

- [GNU stow](https://www.gnu.org/software/stow/)

  ```text
  tar xzf stow-latest.tar.gz
  cd stow
  ./configure
  sudo make install
  ```

没有弄明白怎么用 GnuPG 加密文件，下次再思考。

## 关于 dotfiles 的思考 {#关于-dotfiles-的思考}

Some developers believe that "dotfiles are meant to be forked". I
disagree.（就是参考 2）

> 如果某些配置对所有人都有用，那么这个配置就会成为默认配置。

这句话不错。

> I thought that writing my own would be a lot more easier and quicker
> than learning some tool that already existed. The benefits of writing
> your own tools are that you don't have to learn them, they will do
> exactly what you want them to do and you could potentially design them
> as simple and straightforward as possible from the very start, not
> mentioning about learning some new technologies while doing something
> new. @ref:5

ref:

1.  <https://dotfiles.github.io/>
2.  <https://zachholman.com/2010/08/dotfiles-are-meant-to-be-forked/>
3.  <https://abdullah.today/encrypted-dotfiles/>
4.  <https://www.anishathalye.com/2014/08/03/managing-your-dotfiles/>
5.  <https://troydm.github.io/blog/2017/02/27/manage-your-dotfiles-like-a-boss/>
6.  <https://github.com/webpro/awesome-dotfiles>