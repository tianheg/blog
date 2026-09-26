"""批 1 收尾：补 5 处 ](<url) 的左括号 + mdo-code-guide 的 @import。"""
import sys, pathlib

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv

PAIRS = [
    ('til/software/mdo-code-guide.md',
     '强化[标准模式](<https://developer.mozilla.org/en-US/docs/Web/HTML/Quirks_Mode_and_Standards_Mode)并尽可能在每个浏览器呈现一致的内容。保持小写。',
     '强化[标准模式](https://developer.mozilla.org/en-US/docs/Web/HTML/Quirks_Mode_and_Standards_Mode)并尽可能在每个浏览器呈现一致的内容。保持小写。'),
    ('til/software/mdo-code-guide.md',
     '可在[标准](<https://html.spec.whatwg.org/multipage/semantics.html#the-html-element)中读到更多关于 `lang` 的内容。',
     '可在[标准](https://html.spec.whatwg.org/multipage/semantics.html#the-html-element)中读到更多关于 `lang` 的内容。'),
    ('til/software/mdo-code-guide.md',
     'MDN 的[一篇文章](<https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties)介绍里使用速记属性可能出现的问题。',
     'MDN 的[一篇文章](https://developer.mozilla.org/en-US/docs/Web/CSS/Shorthand_properties)介绍里使用速记属性可能出现的问题。'),
    ('til/software/mediawiki.md',
     '在[这里](<https://www.mediawiki.org/wiki/Extension:VisualEditor#Troubleshooting)找到相关错误解释>。',
     '在[这里](https://www.mediawiki.org/wiki/Extension:VisualEditor#Troubleshooting)找到相关错误解释。'),
    ('til/software/use-slidev-make-ppt.md',
     '通过[扩展](<https://marketplace.visualstudio.com/items?itemName=antfu.slidev)方便地在 VS Code 中查看',
     '通过[扩展](https://marketplace.visualstudio.com/items?itemName=antfu.slidev)方便地在 VS Code 中查看'),
    ('til/software/mdo-code-guide.md',
     '### 避免使用 `[cite/t:@import]`',
     '### 避免使用 `@import`'),
    ('til/software/mdo-code-guide.md',
     '与 `&lt;link&gt;` 相比，`[cite/t:@import]` 更慢。',
     '与 `<link>` 相比，`@import` 更慢。'),
]

problems = []
for rel, old, new in PAIRS:
    f = ROOT / rel
    t = f.read_text(errors='replace')
    if t.count(old) != 1:
        problems.append(f'{rel}: 匹配 {t.count(old)} 次 -> {old[:60]}')
if problems:
    print('中止：')
    for p in problems:
        print('  !!', p)
    sys.exit(1)
print(f'计划修改 {len(PAIRS)} 处')
if not APPLY:
    print('(dry-run)')
    sys.exit(0)
for rel, old, new in PAIRS:
    f = ROOT / rel
    f.write_text(f.read_text(errors='replace').replace(old, new))
print('已写入')
