"""批 5：org2md 把 `~`（org 代码标记）和 `=`（=x= 原文）误伤成反引号的残留。"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

P = [
    ('til/software/ssh-key-management.md',
     '- If your key is stored outside ``` /.ssh/` (e.g., ` ``/.config/ssh/my_key`), SSH won\'t find it automatically.',
     '- If your key is stored outside `~/.ssh/` (e.g., `~/.config/ssh/my_key`), SSH won\'t find it automatically.'),
    ('til/software/ssh-key-management.md',
     'Add the following to your shell profile (e.g., ``` /.bashrc`, ` ``/.zshrc`) to load keys on login:',
     'Add the following to your shell profile (e.g., `~/.bashrc`, `~/.zshrc`) to load keys on login:'),
    ('posts/en-eloquent-javascript.md',
     'Other: `-`` `, `* ```.',
     'Other: `-=`, `*=.'),
    ('til/software/tutorials.md',
     '整理CO-STAR,“``` [我如何夺冠',
     '整理CO-STAR,“[我如何夺冠'),
]

for rel, old, new in P:
    p = ROOT / rel
    t = p.read_text()
    assert t.count(old) == 1, f'{rel}: {old[:40]!r} 出现 {t.count(old)} 次'
    if APPLY:
        p.write_text(t.replace(old, new))
print(f'{"已写入" if APPLY else "dry-run"}：{len(P)} 处')
