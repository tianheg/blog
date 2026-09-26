"""批 2（非围栏部分）：
- <sub>x</sub> 下标残留 → _x（真 HTML 下标如化学式 H<sub>2</sub>O 保留）
- blockquote 里的 org babel 块 #+BEGIN_SRC/#+END_SRC/#+RESULTS: → 正常围栏
- org 星号标题 ******* → ####
- org 宏残留 {{{x}}} → 行内代码
- 畸形 <sup> 修复
只处理不在子代理围栏清单里的文件。
"""
import sys, re, pathlib, json

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv
children = {p for v in json.load(open('/root/.hermes/cache/scratch/groups.json')).values() for p in v}

PAIRS = [  # (rel, old, new, 期望次数 or None=不限)
    # --- sub 下标残留 ---
    ('til/software/coding.md', 'r/web<sub>design</sub>', 'r/web_design', 1),
    ('til/software/coding.md', 'aio<sub>functions</sub>', 'aio_functions', 1),
    ('til/software/docker.md', 'update<sub>config</sub>', 'update_config', 1),
    ('til/software/journalctl.md', 'rfcomm<sub>bind</sub>', 'rfcomm_bind', 1),
    ('til/software/js-design-error.md', '_<sub>proto</sub>__', '__proto__', 1),
    ('til/software/linux-birdman-linux.md', 'x86<sub>64</sub>', 'x86_64', None),
    ('til/software/mongodb.md', '<sub>id</sub>', '_id', None),
    ('til/software/python-dict-last-key.md', "'dict<sub>keys</sub>'", "'dict_keys'", 1),
    ('til/software/resilio-sync.md', 'storage<sub>path</sub>', 'storage_path', None),
    ('til/software/resilio-sync.md', 'pid<sub>file</sub>', 'pid_file', None),
    ('til/software/x-content-type-options.md', '/<sub>assets</sub>/', '/_assets/', 1),
    ('til/software/learn-js-regexp.md', '<sup>(+̣)</sup>', '(+̣)', 1),
    ('posts/todays-learning-summary-and-programming-direction-planning.md',
     '2<sup>(-3)、2</sup>(-4)', '2^(-3)、2^(-4)', 1),
    # --- org 星号标题 ---
    ('posts/javascript.md', '******* 使用 `&lt;script setup&gt;` 与否的对比',
     '#### 使用 `<script setup>` 与否的对比', 1),
    # --- org 宏残留 ---
    ('til/homelab/e1000e-nic-hang-fix.md',
     '在 {{{/etc/default/grub}}} 的 {{{GRUB_CMDLINE_LINUX_DEFAULT}}} 追加参数：',
     '在 `/etc/default/grub` 的 `GRUB_CMDLINE_LINUX_DEFAULT` 追加参数：', 1),
    ('til/homelab/e1000e-nic-hang-fix.md', '所有应为 {{{off}}。', '所有应为 `off`。', 1),
    # --- blockquote 里的 org babel 块 ---
    ('posts/js-ecma-262-3-in-detail.md',
     '> #+BEGIN_SRC js\n> AO = {\n> arguments: &lt;Arg0&gt;\n> }\n> #+END_SRC',
     '> ```js\n> AO = {\n>   arguments: <Arg0>\n> }\n> ```', 1),
    ('posts/js-ecma-262-3-in-detail.md',
     '> #+BEGIN_SRC js\n> a = 10\n> #+END_SRC',
     '> ```js\n> a = 10\n> ```', 1),
    ('posts/js-es-howto.md',
     '> #+BEGIN_SRC js\n> const arr = [0, 1, 2, 3]\n> arr.length = 1\n> console.log(arr)\n> console.log(Object.getOwnPropertyDescriptor([], "length"))\n> console.log(Object.getOwnPropertyDescriptor(new Map(), "size"))\n> console.log(Object.getOwnPropertyDescriptor(Map.prototype, "size"))\n> #+END_SRC\n>\n> #+RESULTS:\n> : [0]\n> : { value: 0, writable: true, enumerable: false, configurable: false }\n> : undefined\n> : { get: size(), set: undefined, enumerable: false, configurable: true }',
     '> ```js\n> const arr = [0, 1, 2, 3]\n> arr.length = 1\n> console.log(arr)\n> console.log(Object.getOwnPropertyDescriptor([], "length"))\n> console.log(Object.getOwnPropertyDescriptor(new Map(), "size"))\n> console.log(Object.getOwnPropertyDescriptor(Map.prototype, "size"))\n> ```\n>\n> ```\n> [0]\n> { value: 0, writable: true, enumerable: false, configurable: false }\n> undefined\n> { get: size(), set: undefined, enumerable: false, configurable: true }\n> ```', 1),
    ('posts/js-es-howto.md',
     '> #+BEGIN_SRC js\n> String.prototype.substring.call(undefined, 2, 4)\n> #+END_SRC',
     '> ```js\n> String.prototype.substring.call(undefined, 2, 4)\n> ```', 1),
]

# 星号标题的剩余 9 处（posts/javascript.md）统一处理
ASTERISK = ('posts/javascript.md', re.compile(r'^\*{4,}\s+'), '#### ')


def main():
    problems = []
    total = 0
    for rel, old, new, expect in PAIRS:
        if rel in children:
            problems.append(f'{rel} 在子代理清单里，跳过应删除该条')
            continue
        f = ROOT / rel
        if not f.exists():
            problems.append(f'不存在 {rel}')
            continue
        t = f.read_text(errors='replace')
        n = t.count(old)
        if n == 0 or (expect is not None and n != expect):
            problems.append(f'{rel}: 匹配 {n}（期望 {expect}）-> {old[:60]!r}')
            continue
        total += n
    # 星号标题
    rel, rx, rep = ASTERISK
    f = ROOT / rel
    lines = f.read_text(errors='replace').split('\n')
    ast = [i for i, l in enumerate(lines) if rx.match(l)]
    print(f'计划：显式 {total} 处 + 星号标题 {len(ast)} 行（{rel}）')
    print('星号标题行：', [lines[i][:70] for i in ast])
    if problems:
        for p in problems:
            print('  !!', p)
        return 1
    if not APPLY:
        print('(dry-run)')
        return 0
    for rel, old, new, expect in PAIRS:
        f = ROOT / rel
        f.write_text(f.read_text(errors='replace').replace(old, new))
    arel, arx, arep = ASTERISK
    af = ROOT / arel
    alines = af.read_text(errors='replace').split('\n')
    af.write_text('\n'.join(arx.sub(arep, l) for l in alines))
    print('已写入')
    return 0


sys.exit(main())
