#!/usr/bin/env python3
"""NeoDB 批量核对 watch.md 的 Release Year（只读查询，不改内容）。

用法:
  python3 scripts/neodb-year-lookup.py            # 断点续跑：查缓存里没有的行
  python3 scripts/neodb-year-lookup.py --limit N  # 只跑 N 条

输入: scratch/watch-empty-year.json   (line/type/name)
输出: scratch/watch-neodb.json        (line -> {...} 逐条即时落盘)

规则（用户 2026-10-06 定）:
- 电影年份 = NeoDB 详情 year（源头聚合自豆瓣/TMDB，实查非模型知识）
- 电视剧系列 = 第一季播出年：查询前剥离「第N季」，打分惩罚非第1季条目
- 音乐剧另走 override query（作品首演年）
"""
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher

SCRATCH = '/root/.hermes/cache/scratch'
LIST = f'{SCRATCH}/watch-empty-year.json'
OUT = f'{SCRATCH}/watch-neodb.json'
BASE = 'https://neodb.social'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
WORKERS = 5
PARALLEL_OK = 1.5  # 打分阈值：低于此记为待人工

# 查询词修正：条目名太杂 / 音乐剧需要点明品类
OVERRIDE = {
    'John Wick 疾速追杀1-4&芭蕾杀姬 Ballerina': '疾速追杀',
    '行骗天下KR': '行骗天下',
    'The Flash 闪电侠 当英雄与做人，科幻色彩。第二次看，一共九季': '闪电侠',
    '食戟之灵 第 1,2,3,4,5 季 + OAD': '食戟之灵',
    '第二季度提醒': None,
    '芝加哥': '芝加哥 音乐剧',
    '巴黎圣母院': '巴黎圣母院 音乐剧',
    '日落大道': '日落大道 音乐剧',
    'Rebecca 丽贝卡': '丽贝卡 音乐剧',
    'Les Misérables 悲惨世界': '悲惨世界 音乐剧',
    'Six The Musical 六位王后': 'Six the Musical',
    'Elisabeth 伊丽莎白': '伊丽莎白 音乐剧',
    'The Little Prince 小王子': '小王子 音乐剧',
    'The Phantom of the Opera 剧院魅影': '剧院魅影 音乐剧',
    'Dear Evan Hansen 亲爱的埃文·汉森': 'Dear Evan Hansen 音乐剧',
    'Cats 猫': '猫 音乐剧',
    'Hamilton 汉密尔顿': '汉密尔顿 音乐剧',
}

def clean_query(name: str) -> str:
    if name in OVERRIDE and OVERRIDE[name]:
        return OVERRIDE[name]
    q = name
    q = re.sub(r'\s+in\s+\d{4}$', '', q)
    q = re.sub(r'[（(]\d{4}[)）]', '', q)
    q = re.sub(r'\s+\d{4}$', '', q)
    q = re.sub(r'`[^`]*`', '', q)
    q = re.sub(r'\s*S\d+[&\d\sS]*$', '', q)
    q = re.sub(r'第[0-9一二三四五六七八九十,，、 ]+季', '', q)
    q = re.sub(r'全?\d+季', '', q)
    q = re.sub(r'&.*$', '', q)
    q = re.sub(r'\s+', ' ', q).strip()
    return q

def api(url: str, tmp: str) -> dict | None:
    for attempt in range(3):
        p = subprocess.run(['curl', '-s', '-m', '25', '-A', UA,
                            '-H', 'Accept: application/json',
                            '-o', tmp, url], capture_output=True)
        if p.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 2:
            try:
                return json.load(open(tmp), strict=False)
            except Exception:
                pass
        time.sleep(1.2 * (attempt + 1))
    return None

NOISE_TYPES = {'Album', 'Book', 'Game', 'Podcast', 'PodcastEpisode'}
PERF = ('Performance',)

def score_item(q: str, it: dict) -> float:
    texts = [it.get('title') or '', it.get('orig_title') or '', it.get('display_title') or '']
    texts += [x.get('text', '') for x in it.get('localized_title') or []]
    ql = q.lower()
    best = 0.0
    for t in texts:
        if t:
            best = max(best, SequenceMatcher(None, ql, t.lower()).ratio())
    # 非第1季的惩罚（用户规则：系列写第一季那一年）
    blob = ' '.join(texts)
    m = re.search(r'(?:第\s*([0-9一二三四五六七八九十]+)\s*季|Season\s*(\d+))', blob, re.I)
    if m:
        num = m.group(1) or m.group(2)
        cn = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}
        n = cn.get(num, int(num) if str(num).isdigit() else 1)
        if n != 1:
            best -= 0.4
    return best

def lookup(row: dict, tmpdir: str) -> dict:
    q = clean_query(row['name'])
    rec = {'q': q, 'type': row['type'], 'name': row['name']}
    if not q:
        rec['error'] = 'empty query'
        return rec
    tmp1 = os.path.join(tmpdir, f"q{row['line']}.json")
    url = f'{BASE}/api/catalog/search?query={urllib.parse.quote(q)}&locale=zh&limit=10'
    d = api(url, tmp1)
    if not d or not d.get('data'):
        rec['error'] = 'no search result'
        return rec
    is_perf = row['type'] == '音乐剧'
    # type 粗筛：电影行要 Movie；电视剧行要 TV 类；音乐剧行只认 Performance（不回退，防电影版错配）
    cands = [x for x in d['data'] if x.get('type') not in NOISE_TYPES]
    if is_perf:
        typed = [x for x in cands if x.get('type') in PERF]
        if not typed:
            rec['error'] = 'no Performance 候选'
            rec['score'] = 0
            rec['cand'] = [x.get('title') for x in cands[:4]]
            return rec
        cands2 = typed
    elif row['type'] == '电影':
        typed = [x for x in cands if x.get('type') in ('Movie',)]
        cands2 = typed or cands
        rec['fallback'] = not typed
    elif row['type'] == '电视剧':
        typed = [x for x in cands if x.get('type') in ('TVSeason', 'TVShow', 'Movie')]
        cands2 = typed or cands
        rec['fallback'] = not typed
    else:
        cands2 = cands
    ranked = sorted(((score_item(q, x), x) for x in cands2), key=lambda p: -p[0])
    s, best = ranked[0]
    rec['score'] = round(s, 3)
    rec['matched'] = best.get('title')
    rec['mtype'] = best.get('type')
    if best.get('api_url'):
        d2 = api(BASE + best['api_url'], tmp1)
        if d2:
            year = d2.get('year') or (d2.get('release_date') or '')[:4] or \
                   (d2.get('publication_date') or '')[:4] or (d2.get('origin_publication_date') or '')[:4] or \
                   (d2.get('opening_date') or '')[:4] or (d2.get('first_air_date') or '')[:4] or None
            if year and str(year)[:4].isdigit():
                rec['year'] = int(str(year)[:4])
            if not rec.get('year'):
                rec['error'] = 'detail 缺 year'
    else:
        rec['error'] = 'no api_url'
    return rec

def main():
    rows = json.load(open(LIST))
    try:
        done = json.load(open(OUT))
    except FileNotFoundError:
        done = {}
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])
    pending = [r for r in rows if str(r['line']) not in done]
    if limit:
        pending = pending[:limit]
    print(f'待查 {len(pending)}（缓存 {len(done)}）, workers={WORKERS}', flush=True)
    tmpdir = f'{SCRATCH}/neodb-tmp'
    os.makedirs(tmpdir, exist_ok=True)
    lock = threading.Lock()
    n = [0]
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lookup, r, tmpdir): r for r in pending}
        for f in as_completed(futs):
            r = futs[f]
            try:
                rec = f.result()
            except Exception as e:
                rec = {'error': f'exc {e}', 'name': r['name'], 'type': r['type']}
            with lock:
                done[str(r['line'])] = rec
                n[0] += 1
                json.dump(done, open(OUT, 'w'), ensure_ascii=False, indent=0)
            if n[0] % 25 == 0 or 'error' in rec or rec.get('score', 0) < PARALLEL_OK:
                print(f"[{n[0]}/{len(pending)}] L{r['line']} {r['name'][:24]!r} -> "
                      f"{rec.get('year')} s={rec.get('score')} {str(rec.get('matched'))[:30]!r} {rec.get('error','')}",
                      flush=True)
    ok = sum(1 for v in done.values() if v.get('year'))
    print(f'完成: {len(done)} 缓存, {ok} 已得年份 -> {OUT}')

if __name__ == '__main__':
    main()