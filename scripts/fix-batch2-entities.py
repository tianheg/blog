"""批 2（非围栏部分，续）：行内代码里的半转义 HTML 实体。

规则：只在**同一个行内代码 span 里同时出现 `&lt;` 和其后一个 `&gt;`** 时反转义
（`&lt;canvas&gt;`、`C-x b &lt;BUFFER NAME&gt;`、`&lt;br/&gt;` 都是这形态）。
单独的 `&lt;` / `&gt;` / `&amp;` / `AT&amp;T` / `&ndash;` 属于「讲语法/讲实体」的示例，一律不动。
"""
import sys, re, pathlib, json

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv
children = {p for v in json.load(open('/root/.hermes/cache/scratch/groups.json')).values() for p in v}
SPAN = re.compile(r'`[^`\n]+`')
OTHER_ENT = re.compile(r'&(?:amp|quot|nbsp|hellip|ndash|mdash|apos|ldquo|rdquo|copy);')

changed = []
skipped_mixed = []

for f in sorted(ROOT.rglob('*.md')):
    rel = str(f.relative_to(ROOT))
    if rel in children:
        continue
    lines = f.read_text(errors='replace').split('\n')
    infence = False
    out = []
    n_file = 0
    for l in lines:
        if re.match(r'^\s{0,3}(`{3,}|~{3,})', l):
            infence = not infence
            out.append(l)
            continue
        if infence:
            out.append(l)
            continue
        pieces = []
        pos = 0
        for m in SPAN.finditer(l):
            pieces.append(l[pos:m.start()])
            s = m.group(0)
            tail = s.split('&lt;', 1)[1] if '&lt;' in s else ''
            if '&lt;' in s and '&gt;' in tail:
                if OTHER_ENT.search(s):
                    skipped_mixed.append((rel, s))
                    pieces.append(s)
                else:
                    n_file += 1
                    pieces.append(s.replace('&lt;', '<').replace('&gt;', '>'))
            else:
                pieces.append(s)
            pos = m.end()
        pieces.append(l[pos:])
        out.append(''.join(pieces))
    if n_file:
        changed.append((rel, n_file))
        if APPLY:
            f.write_text('\n'.join(out))

print(f'计划反转义 {sum(n for _, n in changed)} 处 / {len(changed)} 文件')
for rel, n in changed:
    print(f'   {n:3d}  {rel}')
print(f'\n因同一 span 含有其它实体而跳过（人工确认）：{len(skipped_mixed)}')
for rel, s in skipped_mixed[:20]:
    print(f'   {rel}: {s[:90]}')
print('(dry-run)' if not APPLY else '已写入')
