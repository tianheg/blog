"""批 3a：org 原文标记 =x= → 行内代码 `x`（只处理路径/通配/点号开头这类无歧义的）。"""
import sys, re, pathlib, json

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv
children = {p for v in json.load(open('/root/.hermes/cache/scratch/groups.json')).values() for p in v}
RX = re.compile(r'(?<![\w=])=((?:~|/|\*|\.)[^\s=]{0,120}?)=(?![\w=])')

plan = []
for f in sorted(ROOT.rglob('*.md')):
    rel = str(f.relative_to(ROOT))
    if rel in children:
        continue
    txt = f.read_text(errors='replace')
    hits = RX.findall(txt)
    if hits:
        plan.append((rel, len(hits), hits))
print(f'计划 {sum(p[1] for p in plan)} 处 / {len(plan)} 文件')
for rel, n, hits in plan:
    print(f'   {n:2d}  {rel}   {hits[:3]}')
if not APPLY:
    print('(dry-run)')
else:
    for rel, n, hits in plan:
        f = ROOT / rel
        f.write_text(RX.sub(lambda m: '`' + m.group(1) + '`', f.read_text(errors='replace')))
    print('已写入')
