"""批 4：结构性残留收尾。

覆盖四类：
  A. 围栏结构坏掉（闭合围栏粘在正文行尾 / 块里再开块 / 段落被吞进代码块）
  B. 游离的 ```（没有配对的围栏，会把后面正文吞成代码块）
  C. org 下标 _{X} 残留（含 org2md 的 =x= 误伤：`>=` 变成 `>`` `）
  D. 围栏内仍带转义或字面标签、<sup>、org autolink
每条断言在文件里出现次数，dry-run 默认，--apply 才写。
"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv
P = []          # (rel, old, new, count)


def add(rel, old, new, n=1):
    P.append((rel, old, new, n))


# ---------- A1. bugs-in-hello-world：text 块里套了个 bash 块，正文被吞 ----------
add('til/software/bugs-in-hello-world.md', '''````text

但是对 Hello World 程序来说，并无以上特征

```bash gcc -Wall hello.c -o hello ./hello > /dev/full

echo $?

````''', '''```text
但是对 Hello World 程序来说，并无以上特征
```

```bash
gcc -Wall hello.c -o hello
./hello > /dev/full
echo $?
```''')

# ---------- A2. nix：一个 bash 块吞掉了正文 + 英文段落，卸载块是嵌套的 ----------
add('til/software/nix.md', '''````bash

sudo pacman -S nix nix-channel --add [[https://nixos.org/channels/nixpkgs-unstable]] nix-channel --update nix-env -u source /etc/profile.d/nix{,-daemon}.sh sudo systemctl enable nix-daemon.service sudo usermod -aG nix-users archie ```

If you installed Nix from the official repositories, you must add the `~/.nix-profile/bin` directory to your PATH manually.

卸载：

```bash sudo pacman -Rs nix rm -r ~/.nix-channels ~/.nix-defexpr ~/.nix-profile sudo rm -r /nix

````''', '''```bash
sudo pacman -S nix
nix-channel --add https://nixos.org/channels/nixpkgs-unstable
nix-channel --update
nix-env -u
source /etc/profile.d/nix{,-daemon}.sh
sudo systemctl enable nix-daemon.service
sudo usermod -aG nix-users archie
```

If you installed Nix from the official repositories, you must add the `~/.nix-profile/bin` directory to your PATH manually.

卸载：

```bash
sudo pacman -Rs nix
rm -r ~/.nix-channels ~/.nix-defexpr ~/.nix-profile
sudo rm -r /nix
```''')

# ---------- A3. when-to-open-dns：闭合围栏粘在配置行尾 ----------
add('til/software/when-to-open-dns.md', '''````text

allow-recursion {192.168.2.0/24;}; ```

1. If you run only a caching or forwarding DNS then limit the scope of all queries by adding the following statement to the global options clause:

````

allow-query {192.168.2.0/24;}; ```''', '''```text
allow-recursion {192.168.2.0/24;};
```

1. If you run only a caching or forwarding DNS then limit the scope of all queries by adding the following statement to the global options clause:

```text
allow-query {192.168.2.0/24;};
```''')

# ---------- A4. vagrant：Vagrantfile 块被吞 + 两个 bash 块嵌套 ----------
add('til/software/vagrant.md', '''````text

Vagrant.configure("2") do |config| config.vm.box = "archlinux/archlinux" config.vm.box_{checkupdate} = false

config.vm.provider "virtualbox" do |vb|

vb.gui = true

vb.memory = "4096" end

config.vm.provision "shell", path: "bootstrap1.sh"

config.vm.provision "shell", path: "bootstrap2.sh"

config.vm.provision "shell", path: "bootstrap3.sh" end ```''', '''```text
Vagrant.configure("2") do |config|
config.vm.box = "archlinux/archlinux"
config.vm.box_check_update = false
config.vm.provider "virtualbox" do |vb|
vb.gui = true
vb.memory = "4096"
end
config.vm.provision "shell", path: "bootstrap1.sh"
config.vm.provision "shell", path: "bootstrap2.sh"
config.vm.provision "shell", path: "bootstrap3.sh"
end
```''')

add('til/software/vagrant.md', '''```bash #!/usr/bin/env bash

ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime mv /etc/locale.gen /etc/locale.gen.old echo -e "en_{US}.UTF-8 UTF-8" > /etc/locale.gen echo "LANG=en_{US}.UTF-8" > /etc/locale.conf locale-gen

if [ -e /vagrant/pkg.tgz ] then cd /var/cache/pacman/pkg tar -xzvf /vagrant/pkg.tgz cd fi

pacman -Syu --noconfirm ```''', '''```bash
#!/usr/bin/env bash
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
mv /etc/locale.gen /etc/locale.gen.old
echo -e "en_US.UTF-8 UTF-8" > /etc/locale.gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf
locale-gen

if [ -e /vagrant/pkg.tgz ]
then
cd /var/cache/pacman/pkg
tar -xzvf /vagrant/pkg.tgz
cd
fi

pacman -Syu --noconfirm
```''')

add('til/software/vagrant.md', '''```bash #!/usr/bin/env bash

pacman -S --noconfirm xorg-server gnome alsa-utils lightdm lightdm-gtk-greeter''', '''```bash
#!/usr/bin/env bash
pacman -S --noconfirm xorg-server gnome alsa-utils lightdm lightdm-gtk-greeter''')

for old, new in [('pacman -Rns --noconfirm virtualbox-guest-utils-nox pacman -S --noconfirm virtualbox-guest-utils',
                  'pacman -Rns --noconfirm virtualbox-guest-utils-nox\npacman -S --noconfirm virtualbox-guest-utils'),
                 ('amixer sset Master 100%+ unmute alsactl store',
                  'amixer sset Master 100%+ unmute\nalsactl store'),
                 ('systemctl disable gdm systemctl enable lightdm',
                  'systemctl disable gdm\nsystemctl enable lightdm')]:
    add('til/software/vagrant.md', old, new)

add('til/software/vagrant.md', '''pacman -S --noconfirm pulseaudio pulseaudio-alsa

````''', '''pacman -S --noconfirm pulseaudio pulseaudio-alsa
```''')

# ---------- A5. mediawiki：org 时代就坏的 compose 块（正文被吞进 yaml，还有嵌套 ```txt） ----------
add('til/software/mediawiki.md', '''````yaml

version: '3' services: mediawiki: image: mediawiki restart: always ports:

- 8080:80

links:

- database

volumes:

- /var/www/html/images

database: image: mariadb restart: always environment:

MYSQL_{DATABASE}: my_{wiki} MYSQL_{USER}: wikiuser MYSQL_{PASSWORD}: example ```

执行完初始化安装后，会生成 LocalSettings.php，把这个文件放到根目录。

```txt

- 

````''', '''```yaml
version: '3'
services:
  mediawiki:
    image: mediawiki
    restart: always
    ports:
      - 8080:80
    links:
      - database
    volumes:
      - /var/www/html/images
  database:
    image: mariadb
    restart: always
    environment:
      MYSQL_DATABASE: my_wiki
      MYSQL_USER: wikiuser
      MYSQL_PASSWORD: example
```

执行完初始化安装后，会生成 LocalSettings.php，把这个文件放到根目录。''')

# ---------- B. 游离的 ```（吞掉后面正文） ----------
add('til/software/tutorials.md', '保持 Facebook 帖子简洁而深具影响力。 ```', '保持 Facebook 帖子简洁而深具影响力。')
add('til/software/js-basics.md', '- 比较运算符： `>` ， `>`` ` ， `<` ， `< ```', '- 比较运算符： `>` ， `>=` ， `<` ， `<=`')

# ---------- C. org 下标 _{X} / =x= 误伤 ----------
add('til/courses/open-missing-semester-of-cs.md', 'vimrc_{example}.vim', 'vimrc_example.vim')
add('til/software/mongodb.md', '"student_{id}": 151, "class_{id}": 339', '"student_id": 151, "class_id": 339')
for rel, a, b in [('til/software/linux-ubuntu22-04-install-lamp-and-https.md',
                   '`your<sub>domain</sub>.conf` 文件内容：', '`your_domain.conf` 文件内容：'),
                  ('til/software/linux-ubuntu22-04-install-lamp-and-https.md',
                   '访问 `http://server<sub>domainorIP</sub>/info.php`', '访问 `http://server_domainorIP/info.php`'),
                  ('til/software/linux-ubuntu22-04-install-lamp-and-https.md',
                   '`todo<sub>list</sub>.php`：', '`todo_list.php`：'),
                  ('til/software/linux-ubuntu22-04-install-lamp-and-https.md',
                   '访问 `http://your<sub>domainorIP</sub>/todo<sub>list</sub>.php`。',
                   '访问 `http://your_domainorIP/todo_list.php`。')]:
    add(rel, a, b)

# ---------- D. 代码块里的字面标签 / 转义 / org 痕迹 ----------
add('til/software/js-basics.md', '''```js
(-1)<sup>符号位</sup> * 1.xx...xx * 2<sup>指数部分</sup>
```''', '''(-1)<sup>符号位</sup> * 1.xx...xx * 2<sup>指数部分</sup>''')
add('til/software/mdo-code-guide.md', 'end_ofline', 'end_of_line')
add('til/software/mdo-code-guide.md', 'insert_finalnewline', 'insert_final_newline')
add('til/software/mdo-code-guide.md', 'trim_trailingwhitespace', 'trim_trailing_whitespace')
add('til/software/bootstrap.md', '先创建 `<sub>custom</sub>.scss`', '先创建 `_custom.scss`')
add('til/software/bootstrap.md', '*\\.(scss)$*', '/\\.(scss)$/')
add('til/software/bootstrap.md', '*\\.css$*', '/\\.css$/')
add('til/software/create-proxy-server.md', 'res.status(200).send(\\`Hello world!\\`)', 'res.status(200).send(`Hello world!`)')
add('til/software/js-expressjs.md', '这句的最后还需要 \\`()\\`', '这句的最后还需要 `()`')
add('til/software/pyscript.md', 'hl_lines`"2 3"', 'hl_lines="2 3"')
add('til/software/pyscript.md', '<html lang`"en">', '<html lang="en">')
add('til/software/pyscript.md', 'href="<https://pyscript.net/alpha/pyscript.css>"', 'href="https://pyscript.net/alpha/pyscript.css"')
add('til/software/pyscript.md', 'src="<https://pyscript.net/alpha/pyscript.js>"', 'src="https://pyscript.net/alpha/pyscript.js"')

# ---------- 执行 ----------
total = 0
for rel, old, new, n in P:
    p = ROOT / rel
    t = p.read_text()
    got = t.count(old)
    assert got == n, f'{rel}: {old[:50]!r} 出现 {got} 次，预期 {n}'
    if APPLY:
        p.write_text(t.replace(old, new))
    total += got
print(f'{"已写入" if APPLY else "dry-run"}：{len(P)} 条规则 / {total} 处，覆盖 {len(set(r for r, *_ in P))} 个文件')
