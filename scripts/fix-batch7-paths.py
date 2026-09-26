"""批 7：org2md 把 `~/.x/` 变成 `~*.x*`、`/*.js` 变成 `/**.js` 的路径损坏。"""
import sys, pathlib, re

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

P = [
    ('posts/arch-linux-installation-guide.md', '~*.gnupg*', '~/.gnupg/'),
    ('posts/org-mode-blog.md', '`~*org*`', '`~/org/`'),
    ('posts/how-to-deploy-hermes-agent-on-ubuntu.md', '~*.hermes*', '~/.hermes/'),
    ('til/homelab/xiaomi-speaker-llm-open-xiaoai.md', '~*.hermes*.env', '~/.hermes/.env'),
    ('til/software/git-add-multiple-github-accounts.md', '~*.ssh*', '~/.ssh/'),
    ('til/software/manage-multiple-git-identities.md', '~*work directory', '~/work directory'),
    ('til/software/manage-multiple-git-identities.md', '~*.gitconfig-work', '~/.gitconfig-work'),
    ('til/software/ssh-key-management.md', '`~*.ssh*`', '`~/.ssh/`'),
    ('til/software/ssh-tips-and-tricks.md', '~*.ssh/ssh_authsock', '~/.ssh/ssh_authsock'),
    ('til/software/ssh-tips-and-tricks.md', '~*.ssh*%r@%h:%p.sock', '~/.ssh/%r@%h:%p.sock'),
    ('til/software/bootstrap.md', '`js/dist/**.js`', '`js/dist/*.js`'),
    ('til/software/bootstrap.md', '`/js/dist/**.js`', '`/js/dist/*.js`'),
]

for rel, old, new in P:
    p = ROOT / rel
    t = p.read_text()
    n = t.count(old)
    assert n >= 1, f'{rel}: {old!r} 找不到'
    if APPLY:
        p.write_text(t.replace(old, new))
    print(f'  {rel}: {old!r} -> {new!r} ×{n}')

print()
print('=== 复查：还有没有 ~* 残留')
left = 0
for p in sorted(ROOT.rglob('*.md')):
    t = p.read_text(errors='replace')
    for m in re.finditer(r'~\*[\w.*/-]*', t):
        left += 1
        print(f'  {p.relative_to(ROOT)}: {m.group(0)!r}')
print(f'剩余 {left} 处')
print(f'{"已写入" if APPLY else "dry-run"}')
