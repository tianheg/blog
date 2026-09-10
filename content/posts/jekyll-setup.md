---
title: '本地配置博客程序 Jekyll 环境'
date: 2023-02-21T00:12:00+08:00
tags: ['技术']
---

使用 Arch Linux：

```bash
sudo pacman -S ruby base-devel
```

在 =~/.zshrc= 中加入：

```ini
# Install Ruby Gems to default location
export GEM_HOME="$(ruby -e 'puts Gem.user_dir')"
export PATH="$PATH:$GEM_HOME/bin"
```

安装 Jekyll：

```bash
gem install jekyll bundler
```

新建博客并运行：

```bash
jekyll new myblog
cd myblog
bundle exec jekyll serve
# http://localhost:4000
```

参考资料

- https://jekyllrb.com/docs/installation/other-linux/
- https://jekyllrb.com/docs/installation/ubuntu/
- https://jekyllrb.com/docs/
- https://wiki.archlinux.org/title/Ruby
