+++
title = "如何打包，并发布到 AUR"
date = 2022-05-05T10:51:00+08:00
lastmod = 2022-05-05T10:59:37+08:00
tags = ["技术", "Arch Linux"]
draft = false
+++

来自 [Example PKGBUILD file](https://gitlab.archlinux.org/pacman/pacman/raw/master/proto/PKGBUILD.proto)

```proto
# Maintainer: tianheg <me@tianheg.xyz>

pkgname=NAME
pkgver=VERSION
pkgrel=1
pkgdesc=""
arch=()
url=""
license=('')
groups=()
depends=()
makedepends=()
checkdepends=()
optdepends=()
provides=()
conflicts=()
replaces=()
backup=()
options=()
install=
changelog=
source=("$pkgname-$pkgver.tar.gz"
	"$pkgname-$pkgver.patch")
noextract=()
md5sums=()
validpgpkeys=()

prepare() {
	cd "$pkgname-$pkgver"
	patch -p1 -i "$srcdir/$pkgname-$pkgver.patch"
}

build() {
	cd "$pkgname-$pkgver"
	./configure --prefix=/usr
	make
}

check() {
	cd "$pkgname-$pkgver"
	make -k check
}

package() {
	cd "$pkgname-$pkgver"
	make DESTDIR="$pkgdir/" install
}
```

本来想给 [thesephist/rush](https://github.com/thesephist/rush) 打包，尝试几次发现，解决不了构建环境（作者用了自己的编程语言 Oak）的问题。索性作罢，待到以后有时间再看。

---

参考资料

1.  [PKGBUILD - ArchWiki](https://wiki.archlinux.org/title/PKGBUILD)
2.  [Creating packages - ArchWiki](https://wiki.archlinux.org/title/Creating_packages)
3.  [Arch package guidelines - ArchWiki](https://wiki.archlinux.org/title/Arch_package_guidelines)
4.  [AUR submission guidelines - ArchWiki](https://wiki.archlinux.org/title/AUR_submission_guidelines)
