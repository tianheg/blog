#!/usr/bin/env python3
"""NeoDB 批量识别 watch.md 总表里「缺原名的外国作品」，生成外语名补全干跑清单（只读，不改内容）。

用法:
  python3 scripts/neodb-name-lookup.py             # 断点续跑查询
  python3 scripts/neodb-name-lookup.py --report    # 查询完后生成干跑清单（默认也自动跑）

输入: content/watch.md 在脚本内自解析（无拉丁字母且无假名的 Name 行 = 候选）
输出: /root/.hermes/cache/scratch/watch-neodb-names.json   (line -> detail 逐条即时落盘)
      /root/.hermes/cache/scratch/watch-name-dryrun.md     (干跑清单，给人审)

分类规则（详情字段 2026-10-07 实探）:
- detail: area(地区), language(语言), orig_title(原名), localized_title[{lang,text}]
- area/language 判国别: 中国系地区 → 中文作品跳过; ja → 日语名; ko → 韩语名; 其他外语 → 英语名
- 原名已是现名子串 → 已有无需补; 原名与现名仅繁简/同形差 → review_same 建议跳过、人审可推翻
- score < 0.55 或分类不明 → manual 待人工
落盘为第二批（fill-watch-name.py --apply），本脚本只读。
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
WATCH = '/root/projects/blog/content/watch.md'
OUT = f'{SCRATCH}/watch-neodb-names.json'
DRYRUN = f'{SCRATCH}/watch-name-dryrun.md'
CAND = f'{SCRATCH}/watch-name-candidates.json'
BASE = 'https://neodb.social'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
WORKERS = 5
MIN_SCORE = 0.55

CN_AREAS = {'CN', 'HK', 'TW', 'MO', 'China', '中国大陆', '中国', '中国香港', '中国台湾', '台湾', '香港', '澳门'}
JP_SIG = ('日本語', 'ja', '日本', 'JP')
KR_SIG = ('한국어', '韩语', '韩文', 'ko', '韩国', 'KR')
EN_SIG = ('英语', '英文', 'en', 'EN', 'US', 'GB')
ZH_SIG = ('汉语', '中文', '普通话', '粤语', '闽南语', '四川话', '上海话')

# 查询词修正（与 neodb-year-lookup 共用若干条目；None = 疑似非片名，直接 manual）
OVERRIDE = {
    '芝加哥': '芝加哥 音乐剧',
    '巴黎圣母院': '巴黎圣母院 音乐剧',
    '日落大道': '日落大道 音乐剧',
    '第二季度提醒': None,
}
NOISE_TYPES = {'Album', 'Book', 'Game', 'Podcast', 'PodcastEpisode', 'Edition'}


def clean_query(name: str) -> str:
    if name in OVERRIDE:
        return OVERRIDE[name] or ''
    q = name
    q = re.sub(r'\s+in\s+\d{4}$', '', q)
    q = re.sub(r'[（(]\d{4}[)）]', '', q)
    q = re.sub(r'\s+\d{4}$', '', q)
    q = re.sub(r'`[^`]*`', '', q)
    q = re.sub(r'\s*S\d+[&\d\sS]*$', '', q)
    q = re.sub(r'第[0-9一二三四五六七八九十,，、 ]+季', '', q)
    q = re.sub(r'全?\d+季', '', q)
    q = re.sub(r'第[0-9]+-[0-9]+季', '', q)
    q = re.sub(r'[-—]?\d+季$', '', q)
    q = re.sub(r'&.*$', '', q)
    q = re.sub(r'[（(][^)）]*[)）]', '', q)
    q = re.sub(r'\s+(电影|剧集|动漫|日剧|动画)版?$', '', q)
    q = re.sub(r'\s+系列.*$', '', q)
    q = re.sub(r'\s+', ' ', q).strip()
    q = re.sub(r'\s+', ' ', q).strip()
    return q


def has_kana(s): return bool(re.search(r'[\u3040-\u30FF\u31F0-\u31FF]', s or ''))
def has_hangul(s): return bool(re.search(r'[\uAC00-\uD7AF\u1100-\u11FF]', s or ''))
def has_latin(s): return bool(re.search(r'[A-Za-z]', s or ''))
def is_cjk(s):
    s = re.sub(r'[\s\d·:：・\-—、，。（）()&+！!？?《》「」【】]+', '', s or '')
    return bool(s) and not has_latin(s) and not has_kana(s) and not has_hangul(s)


def api(url: str, tmp: str):
    for attempt in range(3):
        p = subprocess.run(['curl', '-s', '-m', '25', '-A', UA,
                            '-H', 'Accept: application/json', '-o', tmp, url], capture_output=True)
        if p.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 2:
            try:
                return json.load(open(tmp), strict=False)
            except Exception:
                pass
        time.sleep(1.2 * (attempt + 1))
    return None


def score_item(q: str, it: dict) -> float:
    texts = [it.get('title') or '', it.get('orig_title') or '', it.get('display_title') or '']
    texts += [x.get('text', '') for x in it.get('localized_title') or []]
    ql = q.lower()
    best = 0.0
    for t in texts:
        if t:
            best = max(best, SequenceMatcher(None, ql, t.lower()).ratio())
    return best


PREF = {
    '电影': ('Movie',),
    '剧集': ('TVSeason', 'TVShow', 'TVSeries', 'TVSeason'),
    '动漫': ('Movie', 'TVSeason', 'TVShow', 'TVSeries'),
    '音乐剧': ('Performance',),
}


def lookup(row: dict, tmpdir: str) -> dict:
    q = clean_query(row['name'])
    rec = {'q': q, 'type': row['type'], 'name': row['name']}
    if not q:
        rec['status'] = 'manual'
        rec['manual_reason'] = 'override/清洗后空查询'
        return rec
    tmp1 = os.path.join(tmpdir, f"n{row['line']}.json")
    url = f'{BASE}/api/catalog/search?query={urllib.parse.quote(q)}&locale=zh&limit=10'
    d = api(url, tmp1)
    if not d or not d.get('data'):
        rec['status'] = 'manual'
        rec['manual_reason'] = 'no search result'
        return rec
    cands = [x for x in d['data'] if x.get('type') not in NOISE_TYPES]
    pref = PREF.get(row['type'], ())
    typed = [x for x in cands if x.get('type') in pref]
    cands2 = typed or cands
    rec['fallback'] = (not typed)
    if not cands2:
        rec['status'] = 'manual'
        rec['manual_reason'] = '候选全为噪音类型'
        return rec
    ranked = sorted(((score_item(q, x), x) for x in cands2), key=lambda p: -p[0])
    s, best = ranked[0]
    rec['score'] = round(s, 3)
    rec['matched'] = best.get('title')
    rec['mtype'] = best.get('type')
    if s < MIN_SCORE:
        rec['status'] = 'manual'
        rec['manual_reason'] = f'score {s:.2f}<0.55'
        return rec
    if not best.get('api_url'):
        rec['status'] = 'manual'
        rec['manual_reason'] = 'no api_url'
        return rec
    det = api(BASE + best['api_url'], tmp1)
    if not det:
        rec['status'] = 'manual'
        rec['manual_reason'] = 'detail fetch fail'
        return rec
    area = det.get('area') or []
    langs = det.get('language') or []
    orig = (det.get('orig_title') or '').strip()
    loc = {}
    for x in det.get('localized_title') or []:
        loc.setdefault(x.get('lang', ''), x.get('text', ''))
    rec.update({'area': area, 'langs': langs, 'orig': orig, 'title': det.get('title'),
                'ja': loc.get('ja'), 'en': loc.get('en'), 'ko': loc.get('ko')})

    blob_area = ' '.join(area) + ' ' + ' '.join(langs)
    name = row['name']

    # 原名已含在现名里 → 无需补
    if orig and orig in name:
        rec['status'] = 'skip_same'
        return rec

    is_cn = (area and area[0] in CN_AREAS) or (not area and any(z in blob_area for z in ZH_SIG))
    if is_cn:
        rec['status'] = 'skip_cn'
        return rec
    primary = area[0] if area else ''
    if primary == 'JP' or (not area and langs and langs[0] in ('ja', '日本語', '日本')):
        target, lang_tag = (orig or ''), 'ja'
    elif primary == 'KR' or (not area and langs and langs[0] in ('ko', '한국어', '韩语')):
        target, lang_tag = (orig if has_hangul(orig) else ''), 'ko'
    elif primary:
        target, lang_tag = (orig if has_latin(orig) else ''), 'en'
    else:
        rec['status'] = 'manual'
        rec['manual_reason'] = '无 area/language 信号'
        return rec
    if not target:
        target = (loc.get('ja') if lang_tag == 'ja' else
                  loc.get('ko') if lang_tag == 'ko' else loc.get('en')) or ''
    if not target:
        rec['status'] = 'manual'
        rec['manual_reason'] = '判国外但拿不到原名'
        return rec
    if target in name:
        rec['status'] = 'skip_same'
        return rec
    if has_hangul(target) and not has_latin(target):
        lang_tag = 'ko'
    if is_cjk(target):
        # 原名同为汉字（如 夏目友人帳）：与现名仅字形差 → 建议跳过，人审推翻
        rec['status'] = 'review_same'
        rec['proposed'] = f'{target} {name}'
        return rec
    rec['proposed'] = f'{target} {name}'
    rec['status'] = f'prop_{lang_tag}' if lang_tag in ('ja', 'ko') else 'prop_en'
    return rec


def build_candidates():
    lines = open(WATCH, encoding='utf-8').read().split('\n')
    hdr = next(i for i, l in enumerate(lines) if l.startswith('| Type | Name |'))
    rows = []
    for i, l in enumerate(lines[hdr + 2:], start=hdr + 2):
        if not l.startswith('| '):
            continue
        cells = re.split(r'(?<!\\)\|', l)
        name = cells[2].strip()
        if has_latin(name) or has_kana(name) or has_hangul(name):
            continue
        rows.append({'line': i, 'type': cells[1].strip(), 'name': name})
    json.dump(rows, open(CAND, 'w'), ensure_ascii=False, indent=1)
    return rows


def main():
    rows = json.load(open(CAND)) if os.path.exists(CAND) and '--report' in sys.argv else build_candidates()
    if '--report' not in sys.argv:
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
        print(f'候选 {len(rows)}，待查 {len(pending)}（缓存 {len(done)}），workers={WORKERS}', flush=True)
        tmpdir = f'{SCRATCH}/neodb-name-tmp'
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
                    rec = {'error': f'exc {e}', 'name': r['name'], 'type': r['type'],
                           'status': 'manual', 'manual_reason': str(e)}
                with lock:
                    done[str(r['line'])] = rec
                    n[0] += 1
                    json.dump(done, open(OUT, 'w'), ensure_ascii=False, indent=0)
                if n[0] % 25 == 0 or rec.get('status') == 'manual':
                    print(f"[{n[0]}/{len(pending)}] L{r['line']} {r['name'][:24]!r} -> "
                          f"{rec.get('status')} s={rec.get('score')} {str(rec.get('proposed'))[:40]} {rec.get('manual_reason','')}", flush=True)
        print(f'查询完成 {len(done)} -> {OUT}', flush=True)

    # ---- 报告 ----
    done = json.load(open(OUT))
    cand = {str(r['line']): r for r in rows}
    groups = {}
    for ln, rec in sorted(done.items(), key=lambda kv: int(kv[0])):
        groups.setdefault(rec.get('status', 'manual'), []).append((ln, rec))
    order = ['prop_en', 'prop_ja', 'prop_ko', 'review_same', 'skip_same', 'skip_cn', 'manual']
    label = {'prop_en': '补英语名', 'prop_ja': '补日语名', 'prop_ko': '补韩语名（原文）',
             'review_same': '原名同形（建议跳过，人审）', 'skip_same': '原名已在现名中',
             'skip_cn': '中文作品跳过', 'manual': '待人工'}
    with open(DRYRUN, 'w', encoding='utf-8') as f:
        f.write('# watch.md 外语名补全 · 干跑清单（NeoDB 单源，待人审）\n\n')
        for st in order:
            grp = groups.get(st, [])
            f.write(f'\n## {label[st]}（{len(grp)}）\n\n')
            for ln, rec in grp:
                name = rec.get('name', '')
                extra = rec.get('proposed') or rec.get('manual_reason') or \
                    f"orig={rec.get('orig')} area={rec.get('area')} score={rec.get('score')}"
                f.write(f'- L{ln} `{rec.get("type")}` {name} → {extra}\n')
    print('分组统计:')
    for st in order:
        print(f'  {label[st]}: {len(groups.get(st, []))}')
    print(f'干跑清单 -> {DRYRUN}（候选 {len(cand)}，覆盖 {len(done)}）')


if __name__ == '__main__':
    main()