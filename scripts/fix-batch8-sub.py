"""批 8：最后 3 处行内代码里的字面 <sub> 标签。"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

P = [
    ('til/software/ssh-tips-and-tricks.md',
     '## Do not add testing stuff to `~/.ssh/known<sub>hosts</sub>`',
     '## Do not add testing stuff to `~/.ssh/known_hosts`'),
    ('til/software/ssh-tips-and-tricks.md',
     '会弄乱 `~/.ssh/known<sub>hosts</sub>`',
     '会弄乱 `~/.ssh/known_hosts`'),
    ('til/software/problem-with-kde-font-viewer.md',
     '`QT<sub>QPAPLATFORM</sub>=xcb`',
     '`QT_QPA_PLATFORM=xcb`'),
]

for rel, old, new in P:
    p = ROOT / rel
    t = p.read_text()
    n = t.count(old)
    assert n == 1, f'{rel}: {old[:50]!r} 出现 {n} 次'
    if APPLY:
        p.write_text(t.replace(old, new))
print(f'{"已写入" if APPLY else "dry-run"}：{len(P)} 处')
