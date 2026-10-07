#!/usr/bin/env python3
"""相册派生管线：data/photos-list.yaml（人工真源）→ 两份机器产物。

真源（手改）：
    data/photos-list.yaml
      photos: 散片（页面直出）；series: [{num, name, photos}] 系列合集（num=编号按序排；空系列不渲染）
      顺序 = 展示顺序；只有这里的文件名才展示与放行

派生（本脚本产出，勿手改）：
    data/photos.json               Hugo 渲染用：
                                     {"singles": [...], "series": [{"num", "name", "photos": [...]}]}
                                   每条 {k,v,w,h,date,place,title}
    scripts/photos-allowlist.json  Worker 放行用（扁平后的全部 key）

解析规则：裸文件名在 img 清单里必须唯一匹配（文件名含日期即含年份）；
撞名给带年份 `2026/xxx.webp`；解析不到 / 一张照片出现在两处 → 报错退出，绝不猜。
"""
import json
import os
import re
import sys

BLOG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(BLOG, "data", "photos-list.yaml")  # 与派生 photos.json 不能同基名（Hugo 合并会炸）
INDEX = "/root/projects/img/source/.index.json"
STUB_DIR = os.path.join(BLOG, "content", "photos")  # 合集子页（content/photos/<名字>.md）
STUB_TMPL = "---\ntitle: {name}\nseries: {name}\ndescription: 系列\n---\n\n"

NAME_RE = re.compile(r"^(\d{4})(\d{2})(\d{2})_([^_]*)_(\d+)(?:_edit)?\.webp$")
PLACE_ZH = {"Shenzhen": "深圳", "Guangzhou": "广州", "Taihe": "泰和", "Unknown": ""}


def check_names(names, where):
    if not isinstance(names, list):
        sys.exit(f"{where} 必须是文件名列表: {names!r}")
    seen = set()
    for n in names:
        if not isinstance(n, str) or not n.strip().endswith(".webp"):
            sys.exit(f"{where} 名单项必须是 .webp 文件名: {n!r}")
        if n in seen:
            sys.exit(f"{where} 里有重复文件名: {n}")
        seen.add(n)
    return list(names)


def load_manifest():
    try:
        import yaml
    except ImportError:
        sys.exit("缺 PyYAML：pip/apt 装 python3-yaml 后重跑")
    data = yaml.safe_load(open(MANIFEST, encoding="utf-8")) or {}

    singles = check_names(data.get("photos") or [], "photos")
    if data.get("albums"):
        sys.exit("yaml 顶层还是 albums —— 已改用 series（- no/name/photos）")
    series_raw = data.get("series") or []
    if not singles and not series_raw:
        sys.exit("photos-list.yaml 是空的 —— 至少点名一张")

    owner = {n: "photos" for n in singles}
    series = []
    nos = []
    for i, a in enumerate(series_raw):
        if not isinstance(a, dict) or not a.get("name"):
            sys.exit(f"series[{i}] 必须是 {{num, name, photos}}: {a!r}")
        num = a.get("num")
        if not isinstance(num, int) or isinstance(num, bool) or num < 1:
            sys.exit(f"series[{i}] 编号 num 必须是正整数: {num!r}（YAML 里别写 no:，那会解析成布尔）")
        if num in nos:
            sys.exit(f"系列编号重复: {num}")
        nos.append(num)
        name = str(a["name"]).strip()
        ph = check_names(a.get("photos") or [], f"series no.{num} {name}")
        for n in ph:
            if n in owner:
                sys.exit(f"同一张照片出现在两处（{owner[n]} 与系列 no.{num} {name}）: {n}")
            owner[n] = name
        series.append({"num": num, "name": name, "photos": ph})

    series.sort(key=lambda s: s["num"])  # 页面顺序 = 编号顺序
    names_all = [a["name"] for a in series]
    if len(names_all) != len(set(names_all)):
        sys.exit(f"系列重名: {names_all}")
    if not singles and not any(a["photos"] for a in series):
        sys.exit("没有任何照片（系列全是空的）")
    return singles, series


def index_by_base():
    """裸文件名 → [条目...]；撞名靠带年份写法消歧。"""
    data = json.load(open(INDEX))
    by_base = {}
    for group in data["photos"].values():
        for it in group:
            by_base.setdefault(it["k"].split("/", 1)[1], []).append(it)
    return by_base


def resolve(name, by_base):
    if "/" in name:
        for hits in by_base.values():
            for it in hits:
                if it["k"] == name:
                    return it
        sys.exit(f"名单项在 img 清单里找不到: {name}")
    hits = by_base.get(name) or []
    if len(hits) == 1:
        return hits[0]
    if not hits:
        sys.exit(f"名单项在 img 清单里找不到: {name}")
    sys.exit("名单项撞名（用带年份写法消歧）: " + name + " → " + ", ".join(h["k"] for h in hits))


def decorate(item):
    base = item["k"].split("/", 1)[1]
    m = NAME_RE.match(base)
    if not m:
        return {**item, "date": "", "place": "", "title": base}
    y, mo, d, place, _seq = m.groups()
    zh = PLACE_ZH.get(place, place)
    date = f"{y}-{mo}-{d}"
    return {**item, "date": date, "place": zh, "title": f"{date} {zh}".strip()}


def sync_content_stubs(series):
    """系列 ↔ 子页双向同步：文件名 = 编号（content/photos/<num>.md → URL /photos/<num>/），
    缺页自动补，僵尸页 / 编号错位报错退出。首页卡片靠 site.GetPage 按编号找子页。"""
    os.makedirs(STUB_DIR, exist_ok=True)
    by_name = {a["name"]: a["num"] for a in series}
    for a in series:
        path = os.path.join(STUB_DIR, f"{a['num']}.md")
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                f.write(STUB_TMPL.format(name=a["name"]))
            print(f"  + 新建内容页 content/photos/{a['num']}.md → /photos/{a['num']}/")
    for fn in sorted(os.listdir(STUB_DIR)):
        if fn.startswith("_") or not fn.endswith(".md"):
            continue
        text = open(os.path.join(STUB_DIR, fn), encoding="utf-8").read()
        m = re.search(r"^(?:album|series):\s*(.+?)\s*$", text, re.M)
        name = m.group(1).strip("\\'\"") if m else ""
        if name not in by_name:
            sys.exit(f"僵尸系列页 content/photos/{fn}：yaml 无此系列「{name}」（补进 photos-list.yaml 或删页）")
        stem = fn[:-3]
        if stem.isdigit() and int(stem) != by_name[name]:
            sys.exit(f"编号错位 content/photos/{fn}：系列「{name}」在 yaml 里是 no.{by_name[name]}")


def main():
    singles_names, series = load_manifest()
    sync_content_stubs(series)
    by_base = index_by_base()

    def build(names, where):
        out = [decorate(resolve(n, by_base)) for n in names]
        bad = [e["k"] for e in out if not e["k"].split("/")[0].isdigit()]
        if bad:
            sys.exit(f"只有年份目录的照片可放行（{where}）: {bad}")
        return out

    singles = build(singles_names, "photos")
    for a in series:
        a["photos"] = build(a["photos"], a["name"])  # 内容从文件名换成条目，no/name 留在 dict

    all_keys = [e["k"] for e in singles] + [e["k"] for a in series for e in a["photos"]]

    with open(os.path.join(BLOG, "data", "photos.json"), "w", encoding="utf-8") as f:
        json.dump({"singles": singles, "series": series}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with open(os.path.join(BLOG, "scripts", "photos-allowlist.json"), "w", encoding="utf-8") as f:
        json.dump(all_keys, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"photos.json + photos-allowlist.json ← photos-list.yaml：散片 {len(singles)} / 系列 {len(series)}，共 {len(all_keys)} 张")
    for i, e in enumerate(singles, 1):
        print(f"  散片 {i:2d}. {e['k']}  {e['w']}x{e['h']}  {e['title']}")
    for a in series:
        tail = "（空，不渲染）" if not a["photos"] else ""
        print(f"  系列 no.{a['num']}「{a['name']}」: {len(a['photos'])} 张{tail}")
        for e in a["photos"]:
            print(f"    - {e['k']}  {e['w']}x{e['h']}  {e['title']}")


if __name__ == "__main__":
    main()