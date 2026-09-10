---
title: '工具'
date: 2022-11-14T22:00:00+08:00
tags: ['备忘']
---

## convert .mkv to .webm
https://emacs.ch/@skybert/110315637030153305

```bash
ffmpeg -i foo.mkv -c:v libvpx -crf 10 -b:v 1M -c:a libvorbis foo.webm
```
## 技术
### Password
https://rot256.dev/post/pass/ pass 软件的安全风险

如何选择密码管理软件的讨论 https://news.ycombinator.com/item?id=35845612

Pandoc
https://pandoc.org/
```bash
pandoc -f markdown -t org -o output_file.org input_file.md
```
### Docker
#### Docker Hub mirror
[Docker Hub 镜像加速器](https://gist.github.com/y0ngb1n/7e8f16af3242c7815e7ca2f0833d3ea6)
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["..."]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```
#### 一些实践
- https://github.com/y0ngb1n/dockerized
### Git
#### Gitea
https://github.com/go-gitea/gitea
https://gitea.io/en-us/
##### 安装

### 科学上网
### Emacs/Vim
### GNU Make
### CMake
### LaTex -- 写文章
## 画图
- https://excalidraw.com/
- https://asciiflow.com/
- https://app.diagrams.net/
## 修图
- [裁剪圆形图片](https://crop-circle.imageonline.co/)
- https://imagestool.com/ (旧版本 https://renzhezhilu.github.io/webp2jpg-online/ )
- [用 Inkscape 将 png 转成 svg](https://linuxhint.com/convert-png-to-svg-inkscape/)
- Imagemagick png to svg

```bash
magick convert input.png -transparent white -background white -flatten output.svg
```

### 文件的压缩与解压缩
https://wiki.archlinux.org/title/Archiving_and_compression
### Misc
- [google webfonts helper](https://google-webfonts-helper.herokuapp.com/fonts)
- 为去不同的国家准备 SIM 卡 https://prepaid-data-sim-card.fandom.com/wiki/Prepaid_SIM_with_data
## 音乐
- https://github.com/navidrome/navidrome
- https://github.com/rainner/soma-fm-player
- https://www.lofi.cafe/
- https://earth.fm/
## 思考
- [Tools for better thinking | Untools](https://untools.co/)
## 代码共享

https://github.com/screego/server

很不错的软件，可以实时和别人交流所写的代码。
