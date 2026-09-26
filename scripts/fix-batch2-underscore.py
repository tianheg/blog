"""批 2 修正：子代理把 org 的 _{x} 转成 _x_（多个尾下划线）的 4 个文件。

依据迁移前 org 原文：`_{age}` / `_{VALUE}` / `_{s}` / `_{deepcopy}` 表示「下划线 + 词」，
正确形态是 `_age` / `MAX_VALUE` / `_s` / `_deepcopy`，尾巴上多出来的 `_` 要去掉。
"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

PAIRS = []
for old, new, n in [
    ('var _age_', 'var _age', 1),
    ('_age_ = n', '_age = n', 1),
    ('return _age_ }', 'return _age }', 1),
    ('Number.MAX_VALUE_', 'Number.MAX_VALUE', 1),
    ('Number.MIN_VALUE_', 'Number.MIN_VALUE', 1),
]:
    PAIRS.append(('til/software/js-basics.md', old, new, n))

PAIRS += [
    ('til/software/js-functional-programming.md', 'new_s_ =', 'new_s =', 2),
    ('til/software/shallow-deep-copy.md', 'list_deepcopy_', 'list_deepcopy', 5),
    ('til/software/shallow-deep-copy.md', 'list_copy_', 'list_copy', 5),
]

total = 0
for rel, old, new, expect in PAIRS:
    p = ROOT / rel
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f'{rel}: "{old}" 出现 {n} 次，预期 {expect}'
    total += n
    if APPLY:
        p.write_text(t.replace(old, new))
    print(f'{rel}: {old!r} -> {new!r} ×{n}')

print(f'{"已写入" if APPLY else "dry-run"}：{total} 处')
