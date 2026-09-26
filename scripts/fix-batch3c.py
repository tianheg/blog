"""批 3c：转义强调 \\*\\*x\\*\\* / \\*x\\* 、\\[ \\] 方括号转义、LaTeX \\( \\) 残留。"""
import sys, re, pathlib, json

ROOT = pathlib.Path('/root/projects/blog/content')
APPLY = '--apply' in sys.argv
children = {p for v in json.load(open('/root/.hermes/cache/scratch/groups.json')).values() for p in v}

BOLD = re.compile(r'\\\*\*(?=\S)(.+?)(?<=\S)\\\*\*')
ITAL = re.compile(r'(?<!\\)\\\*(?!\*)(?=[^\s*])([^*\n]{1,200}?)(?<=[^\s*])\\\*(?!\*)')
BRACK = re.compile(r'\\\[(?=[^\]\n]{1,60}\\\])')
LATEX = re.compile(r'\\\((.+?)\\\)')
SINGLE_BRACK = re.compile(r'\\\[([^\]\n]{1,80}?)\\\]')

PAIRS = [
    ('posts/en-steve-jobs.md', '> **灌输\\*（impute）', '> **灌输**（impute）', 1),
    ('posts/en-steve-jobs.md', '> \\*灌输** 到顾客的思想中了。"', '> 到顾客的思想中了。"', 1),
    ('posts/en-the-zen-of-css-design.md',
     '[http://bobby.watchfire.com/bobby/html/en/faq.jsp\\#faq\\\\_onetool](http://bobby.watchfire.com/bobby/html/en/faq.jsp#faq_onetool)',
     '[http://bobby.watchfire.com/bobby/html/en/faq.jsp#faq_onetool](http://bobby.watchfire.com/bobby/html/en/faq.jsp#faq_onetool)', 1),
    ('posts/en-the-zen-of-css-design.md', '- 16进制 \\#223331\\', '- 16进制 #223331', 1),
    ('posts/en-the-zen-of-css-design.md',
     '\\*Perhaps the most important piece of advice we can pass on is that\\',
     '*Perhaps the most important piece of advice we can pass on is that', 1),
    ('posts/en-the-zen-of-css-design.md',
     'only come from experience and time spent working with the code.\\*',
     'only come from experience and time spent working with the code.*', 1),
    ('posts/github-code-search.md', '\\*git.*push\\*', '`*git.*push*`', 1),
    ('posts/diabetes.md', '| \\(HbA_1c\\)', '| HbA1c', 1),
    ('posts/diabetes.md', 'BMI≥30.0kg/\\(m^2\\)', 'BMI≥30.0kg/m²', 1),
    ('posts/systematic-thinking.md', '| 供电电压(\\(V<sub>CC</sub>\\))', '| 供电电压(V<sub>CC</sub>)', 1),
    ('posts/systematic-thinking.md', '| 额定工作电流(\\(V<sub>CC</sub>\\)= +5 V)', '| 额定工作电流(V<sub>CC</sub>= +5 V)', 1),
    ('posts/systematic-thinking.md', '| 额定工作电流(\\(V<sub>CC</sub>\\)= +15 V)', '| 额定工作电流(V<sub>CC</sub>= +15 V)', 1),
    ('til/science/magnetar.md', '可达\\(10<sup>13</sup>\\)到\\(10<sup>15</sup>\\)高斯',
     '可达 10<sup>13</sup> 到 10<sup>15</sup> 高斯', 1),
    ('posts/en-how-to-be-a-programmer.md', '> \\[PGSite\\] 和 Eric Raymond \\[Hacker\\] 的文章。',
     '> [PGSite] 和 Eric Raymond [Hacker] 的文章。', 1),
]


def main():
    problems = []
    total = 0
    for rel, old, new, expect in PAIRS:
        f = ROOT / rel
        if rel in children:
            problems.append(f'{rel} 在子代理清单里')
            continue
        n = f.read_text(errors='replace').count(old)
        if n != expect:
            problems.append(f'{rel}: 匹配 {n}（期望 {expect}）-> {old[:50]!r}')
            continue
        total += n
    # 规则替换的预统计
    rule_total = 0
    rule_files = []
    for f in sorted(ROOT.rglob('*.md')):
        rel = str(f.relative_to(ROOT))
        if rel in children:
            continue
        L = f.read_text(errors='replace').split('\n')
        infence = False
        cnt = 0
        for l in L:
            if re.match(r'^\s{0,3}(`{3,}|~{3,})', l):
                infence = not infence
                continue
            if infence:
                continue
            cnt += len(BOLD.findall(l)) + len(ITAL.findall(l))
        if cnt:
            rule_files.append((rel, cnt))
            rule_total += cnt
    print(f'显式 {total} 处；规则（\\*\\*x\\*\\* 与 \\*x\\*）{rule_total} 处 / {len(rule_files)} 文件')
    for rel, n in rule_files:
        print(f'   {n:3d}  {rel}')
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
    for f in sorted(ROOT.rglob('*.md')):
        rel = str(f.relative_to(ROOT))
        if rel in children:
            continue
        L = f.read_text(errors='replace').split('\n')
        infence = False
        out = []
        for l in L:
            if re.match(r'^\s{0,3}(`{3,}|~{3,})', l):
                infence = not infence
                out.append(l)
                continue
            if infence:
                out.append(l)
                continue
            l = BOLD.sub(r'**\1**', l)
            l = ITAL.sub(r'*\1*', l)
            out.append(l)
        f.write_text('\n'.join(out))
    print('已写入')
    return 0


sys.exit(main())
