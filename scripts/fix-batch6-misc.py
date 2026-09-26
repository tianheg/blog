"""批 6：最后一批零散残留。
 - 行内代码/标题里的字面 <sub> 标签（页面上原样显示）
 - 被 markdown 吞掉的 org 脚注定义（URL 在页面上完全看不到）
 - 一个不可见杂字符（0̆05C → U+005C）
 - front matter 标题双重转义（页面上显示 &lt;canvas&gt;）
"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

P = [
    # 行内代码里的字面标签
    ('til/software/js-expressjs.md',
     'path.join(_<sub>dirname</sub>, "public")',
     'path.join(__dirname, "public")'),
    ('til/software/js-basics.md',
     '`MAX<sub>VALUE</sub>` 和 `MIN<sub>VALUE</sub>` 属性',
     '`MAX_VALUE` 和 `MIN_VALUE` 属性'),
    ('til/software/git-github-act.md',
     '`GITHUB<sub>TOKEN</sub>` 是自动生成的',
     '`GITHUB_TOKEN` 是自动生成的'),
    ('til/software/mediawiki.md',
     '### Cannot access the database: :real<sub>connect</sub>(): (HY000/2002)',
     '### Cannot access the database: :real_connect(): (HY000/2002)'),
    # 不可见杂字符
    ('til/software/js-basics.md', '（ `0̆05C` ）', '（ `U+005C` ）'),
    # front matter 标题双重转义
    ('posts/canvas.md',
     "title: '了解使用 HTML5 标签 &lt;canvas&gt;'",
     "title: '了解使用 HTML5 标签 <canvas>'"),
    # org 脚注定义：markdown 会把它当引用定义吃掉，页面上看不到 URL
    ('til/software/js-expressjs.md',
     '[<sup>1</sup>]: <https://stackoverflow.com/a/54114725/12539782> [<sup>2</sup>]: <https://en.wikipedia.org/wiki/Middleware> [<sup>3</sup>]: <https://web.archive.org/web/20050507151935/http://middleware.objectweb.org/>',
     '''## 参考

1. [Stack Overflow: res/req 命名](https://stackoverflow.com/a/54114725/12539782)
2. [Wikipedia: Middleware](https://en.wikipedia.org/wiki/Middleware)
3. [Middleware Resource Center（存档）](https://web.archive.org/web/20050507151935/http://middleware.objectweb.org/)'''),
]

for rel, old, new in P:
    p = ROOT / rel
    t = p.read_text()
    n = t.count(old)
    if n == 0 and new in t:
        print(f'  (跳过，已生效) {rel}: {new[:40]!r}')
        continue
    assert n == 1, f'{rel}: {old[:45]!r} 出现 {n} 次'
    if APPLY:
        p.write_text(t.replace(old, new))
print(f'{"已写入" if APPLY else "dry-run"}：{len(P)} 处')
