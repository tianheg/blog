#!/usr/bin/env python3
"""把 NeoDB 查询结果（交叉模型候选）落到 watch.md 的 Release Year 列。

用法:
  python3 scripts/fill-watch-year.py           # 干跑：打印采信/留空/分歧清单
  python3 scripts/fill-watch-year.py --apply   # 就地改写 content/watch.md

数据源:
  - scratch/watch-neodb.json  NeoDB 实查（用户要求的权威源）
  - scratch/watch-years.json  模型候选（批1/2，仅用于交叉比对）
采信规则:
  - NeoDB year + score>=0.55 且不 Movie 特别篇噪音 → 直接采信
  - 与模型候选分歧 → 不落，进分歧清单人工裁决
  - 双源都没有 → 留空，进待查清单
只改空年份的 4 列标准行；带转义竖线/缺列的异常行本来就有年或结构不同，不碰。
"""
import json
import sys
from pathlib import Path

REPO = Path('/root/projects/blog')
WATCH = REPO / 'content' / 'watch.md'
SCRATCH = '/root/.hermes/cache/scratch'
NEODB = f'{SCRATCH}/watch-neodb.json'
MODEL = f'{SCRATCH}/watch-years.json'
MANUAL = f'{SCRATCH}/watch-manual.json'
MIN_SCORE = 0.55

def load_manual():
    try:
        d = json.load(open(MANUAL)).get('overrides', {})
    except FileNotFoundError:
        return {}
    return {int(k): v for k, v in d.items()}

def model_year(line: int):
    try:
        d = json.load(open(MODEL))
    except FileNotFoundError:
        return None
    return d.get(str(line))

def main():
    apply = '--apply' in sys.argv
    neodb = json.load(open(NEODB))
    rows = json.load(open(f'{SCRATCH}/watch-empty-year.json'))
    manual = load_manual()

    lines = WATCH.read_text(encoding='utf-8').splitlines(keepends=True)
    by_line = {r['line']: r for r in rows}

    accept, dispute, need = [], [], []
    for r in rows:
        if r['line'] in manual:
            # 人工裁决（分歧裁决/规则=第一季年/music & 杂项 web 实查）优先级最高
            accept.append((r, manual[r['line']], 1.0, '[人工裁决]'))
            continue
        rec = neodb.get(str(r['line']), {})
        ny, score, matched = rec.get('year'), rec.get('score', 0), rec.get('matched')
        my = model_year(r['line'])
        if ny and score >= MIN_SCORE:
            if my and my != ny:
                dispute.append((r, ny, score, matched, my))
            else:
                accept.append((r, ny, score, matched))
        elif my and score >= MIN_SCORE and ny and my == ny:
            accept.append((r, my, score, matched))
        elif my and not ny:
            # NeoDB 没查到（音乐剧 no Performance 等）→ 模型候选只是知识不是实查，进待查
            need.append((r, ny, score, matched, my, rec.get('error')))
        else:
            need.append((r, ny, score, matched, my, rec.get('error')))

    print(f'采信 {len(accept)} | 分歧 {len(dispute)} | 待查 {len(need)}\n')
    if dispute:
        print('=== 分歧（NeoDB≠模型，人工裁决，不自动落）===')
        for r, ny, s, m, my in dispute:
            print(f"  L{r['line']} {r['name'][:30]!r} neodb={ny} score={s} matched={m!r} 模型={my}")
    print('\n=== 待查（双源不足以采信）===')
    for r, ny, s, m, my, err in need:
        print(f"  L{r['line']} {r['type']} {r['name'][:34]!r} neodb={ny} s={s} m={str(m)[:28]!r} 模型={my} {err or ''}")
    if not apply:
        print('\n(干跑 — 未写入。分歧裁决 + 待查处理确认后 --apply)')
        return

    # 落地：只碰清单里的行号，只填空年份格
    todo = {r['line']: y for r, y, _, _ in accept}
    changed = 0
    for ln, year in todo.items():
        raw = lines[ln - 1]
        cells = raw.rstrip('\n').split('|')
        if len(cells) != 6:
            print(f'!! L{ln} 列数 {len(cells)}，跳过（应是标准 4 列行）')
            continue
        if cells[4].strip():
            print(f'!! L{ln} 年份格已非空，跳过')
            continue
        cells[4] = f' {year} '
        lines[ln - 1] = '|'.join(cells) + '\n'
        changed += 1
    WATCH.write_text(''.join(lines), encoding='utf-8')
    print(f'\n✓ 已写入 {changed} 行；分歧 {len(dispute)} + 待查 {len(need)} 留空未动')

if __name__ == '__main__':
    main()