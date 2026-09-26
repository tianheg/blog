"""批 3b：剩余的 org 原文 =x=（含 JS 代码/标题里的），逐处显式替换。"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

PAIRS = [
    ('posts/hugo-theme-meme-configuration.md',
     '=var t1 = Date.UTC(2019, 11, 26, 19, 06, 00)=',
     '`var t1 = Date.UTC(2019, 11, 26, 19, 06, 00)`', 1),
    ('posts/javascript.md',
     '=var a = [1, , 2]=',
     '`var a = [1, , 2]`', 1),
    ('posts/javascript.md',
     '=const express = require("express"); const app = express()=',
     '`const express = require("express"); const app = express()`', 1),
    ('posts/javascript.md',
     '=const path = require("path"); app.use("/static", express.static(path.join(__dirname, "public")))=',
     '`const path = require("path"); app.use("/static", express.static(path.join(__dirname, "public")))`', 1),
    ('posts/javascript.md',
     '=str.substring(str.length - target.length) == target=',
     '`str.substring(str.length - target.length) == target`', None),
    ('posts/javascript.md',
     '=copy[0].list = ["a", "b"]=',
     '`copy[0].list = ["a", "b"]`', 1),
    ('posts/javascript.md',
     '=copy[0] = {"list":["a", "b"]}=',
     '`copy[0] = {"list":["a", "b"]}`', 1),
    ('til/software/javascript.md',
     '它和 =a = 10= 的关系是什么？',
     '它和 `a = 10` 的关系是什么？', 1),
    ('til/software/ddgr-duckduckgo-in-terminal.md',
     "title: '=ddgr= - DuckDuckGo in Terminal'",
     "title: 'ddgr - DuckDuckGo in Terminal'", 1),
    ('til/software/use-use-package.md',
     "title: 'Use =use-package='",
     "title: 'Use use-package'", 1),
    ('posts/sed-github-action.md',
     '由此可见，是多余的 =HUGO_VERSIONN==',
     '由此可见，是多余的 `HUGO_VERSIONN`=', 1),
    ('posts/sed-github-action.md',
     '把前面的 =HUGO_VERSION== 删掉就可以了。',
     '把前面的 `HUGO_VERSION`= 删掉就可以了。', 1),
    ('posts/js-mdn-learn.md',
     '赋值操作符：=、 `+=` 、 `-=` 、 `*=` 、 `/=` 。比较操作符： ~===~ 、',
     '赋值操作符： `=` 、 `+=` 、 `-=` 、 `*=` 、 `/=` 。比较操作符： `===` 、', 1),
]

problems = []
total = 0
for rel, old, new, expect in PAIRS:
    f = ROOT / rel
    if not f.exists():
        problems.append(f'不存在 {rel}')
        continue
    n = f.read_text(errors='replace').count(old)
    if n == 0 or (expect is not None and n != expect):
        problems.append(f'{rel}: 匹配 {n}（期望 {expect}）-> {old[:60]!r}')
        continue
    total += n
print(f'计划 {total} 处')
if problems:
    for p in problems:
        print('  !!', p)
    sys.exit(1)
if not APPLY:
    print('(dry-run)')
    sys.exit(0)
for rel, old, new, expect in PAIRS:
    f = ROOT / rel
    f.write_text(f.read_text(errors='replace').replace(old, new))
print('已写入')
