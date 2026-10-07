#!/usr/bin/env python3
"""相册选图工具（一次性，选完即删）—— 不进 blog 运行链路。

作用：把 R2 img 桶年份目录的 800px 变体（t/<年>/<key>）拉到本地缓存，
生成带全局编号的分年静态预览页，供人工点名 20 张公开。

用法：
    python3 scripts/pick-photos.py            # 下载缺失变体 + 重建预览页
    python3 scripts/pick-photos.py --preview  # 只重建预览页（图已下好）

输出（scratch）：
    <SCRATCH>/photos-pick/t/<年>/<file>      # 800px 变体缓存（可复用）
    <SCRATCH>/photos-pick/site/index.html     # 年份总览
    <SCRATCH>/photos-pick/site/<年>_p<n>.html # 分年分页预览（每页 80 张）

编号规则：年份倒序（2026→2000）、年内按文件名升序，全局连续 #0001…。
报号时直接说编号即可，如 "0451 1782 …"。
"""
import concurrent.futures as cf
import html
import json
import os
import re
import sys
import threading

SCRATCH = os.path.join(os.environ.get("TMPDIR", "/root/.hermes/cache/scratch"), "photos-pick")
SITE = os.path.join(SCRATCH, "site")
INDEX = "/root/projects/img/source/.index.json"
SECRETS = "/root/.hermes/secrets/pve.env"
PER_PAGE = 80
KEY_RE = re.compile(r"^(\d{4})/[^/]+\.(?:webp|jpe?g|png)$", re.I)
_thread = threading.local()


def s3():
    if not hasattr(_thread, "client"):
        import boto3
        from botocore.config import Config

        env = {}
        for line in open(SECRETS):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k] = v.strip().strip("'\"")
        _thread.client = boto3.client(
            "s3",
            endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=env["R2_IMG_ACCESS_KEY_ID"],
            aws_secret_access_key=env["R2_IMG_SECRET_ACCESS_KEY"],
            region_name="auto",
            config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
        )
    return _thread.client


def load_entries():
    """年份倒序、年内文件名升序，带全局编号。"""
    data = json.load(open(INDEX))
    years = sorted((g for g in data["photos"] if g.isdigit()), reverse=True)
    entries = []
    for y in years:
        for item in data["photos"][y]:
            if KEY_RE.match(item["k"]):
                entries.append(item)
            else:
                print(f"skip(格式不符): {item['k']}")
    entries.sort(key=lambda e: e["k"])                      # 年升序 + 年内升序
    entries.sort(key=lambda e: e["k"].split("/")[0], reverse=True)  # 年倒序（稳定排序保留年内升序）
    for i, e in enumerate(entries, 1):
        e["no"] = i
    return entries


def fetch(entry):
    """拉 t/ 变体到本地缓存，返回 (key, ok, note)。"""
    key = "t/" + entry["k"]
    dst = os.path.join(SCRATCH, "t", entry["k"])
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return entry["k"], True, "cached"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try:
        obj = s3().get_object(Bucket="img", Key=key)
        body = obj["Body"].read()
        if not body:
            return entry["k"], False, "0-byte"
        tmp = dst + ".part"
        with open(tmp, "wb") as f:
            f.write(body)
        os.replace(tmp, dst)
        return entry["k"], True, f"{len(body)//1024}KB"
    except Exception as e:  # noqa: BLE001 — 单张失败不中断整批
        return entry["k"], False, f"{type(e).__name__}: {str(e)[:80]}"


def download(entries, workers=24):
    done = fail = 0
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        for key, ok, note in ex.map(fetch, entries):
            if ok:
                done += 1
            else:
                fail += 1
                print(f"FAIL {key}: {note}", flush=True)
            if (done + fail) % 100 == 0:
                print(f"progress: {done + fail}/{len(entries)} (fail {fail})", flush=True)
    print(f"download done: {done} ok, {fail} fail, total {len(entries)}", flush=True)
    return fail


CELL = """<figure class="cell" style="--r:{w}/{h}">
  <a href="t/{k}" target="_blank" title="{k}">
    <img src="t/{k}" alt="#{no}" loading="lazy" width="{w}" height="{h}">
  </a>
  <figcaption>#{no} <span>{name}</span></figcaption>
</figure>"""


def build_pages(entries):
    os.makedirs(SITE, exist_ok=True)
    by_year = {}
    for e in entries:
        by_year.setdefault(e["k"].split("/")[0], []).append(e)

    index_rows = []
    for y in sorted(by_year, reverse=True):
        items = by_year[y]
        pages = [items[i : i + PER_PAGE] for i in range(0, len(items), PER_PAGE)]
        links = []
        for pno, page in enumerate(pages, 1):
            fname = f"{y}_p{pno}.html"
            body = "".join(
                CELL.format(
                    k=e["k"],
                    no=e["no"],
                    w=e.get("w", 800),
                    h=e.get("h", 600),
                    name=html.escape(e["k"].split("/", 1)[1]),
                )
                for e in page
            )
            nav = " ".join(
                f'<a href="{y}_p{i}.html">第{i}页</a>' for i in range(1, len(pages) + 1)
            )
            open(f"{SITE}/{fname}", "w", encoding="utf-8").write(
                f"<!doctype html><meta charset=utf-8><title>{y} · 选图</title>"
                f"<style>{STYLE}</style>"
                f"<header><a href=index.html>← 年份</a> <b>{y}</b> {nav}</header>"
                f"<div class=grid>{body}</div>"
            )
            links.append(
                f'<a href="{y}_p1.html">{y}（{len(items)} 张 / {len(pages)} 页）</a>'
            )
        index_rows.append(
            f"<li><b>{y}</b> {len(items)} 张 · " + " ".join(links)
            + f' <span class=rng>#{items[0]["no"]}–#{items[-1]["no"]}</span></li>'
        )

    open(f"{SITE}/index.html", "w", encoding="utf-8").write(
        "<!doctype html><meta charset=utf-8><title>选图 · 总览</title>"
        "<h1>相册选图（点名 20 张公开）</h1>"
        f"<p>共 {len(entries)} 张，编号规则：年份倒序、年内按文件名升序。</p>"
        "<ol class=years>" + "".join(index_rows) + "</ol>"
        "<p>报号示例：<code>0451 1782 0033 …</code>（可分批）</p>"
        f"<style>{STYLE}</style>"
    )


STYLE = """
*{box-sizing:border-box}
body{margin:0;padding:16px;font:14px/1.6 system-ui,-apple-system,"Noto Sans SC",sans-serif;background:#faf9f7;color:#1c1c1e}
header{position:sticky;top:0;background:#faf9f7;padding:8px 0 12px;border-bottom:1px solid #e5e3df;margin-bottom:12px;z-index:5}
header a{color:#35548a;text-decoration:none;margin-right:8px}
header a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.cell{margin:0}
.cell img{width:100%;height:auto;display:block;border-radius:4px;background:#eee;aspect-ratio:var(--r,3/4);object-fit:cover}
figcaption{font-size:11px;color:#555;margin-top:3px;word-break:break-all}
figcaption b,figcaption{font-variant-numeric:tabular-nums}
figcaption span{color:#8a8a8e;display:block}
.years li{margin:6px 0}
.years a{color:#35548a;text-decoration:none}
.rng{color:#8a8a8e;font-variant-numeric:tabular-nums}
"""


def main():
    preview_only = "--preview" in sys.argv
    entries = load_entries()
    print(f"entries: {len(entries)} (编号 #{entries[0]['no']}–#{entries[-1]['no']})")
    fails = 0
    if not preview_only:
        fails = download(entries)
    build_pages(entries)
    # 预览页里缩略图写的是相对路径 t/…，把缓存进 site/ 让静态服务能取到
    link = os.path.join(SITE, "t")
    if not os.path.exists(link):
        os.symlink("../t", link)
    print(f"pages -> {SITE}/index.html  (missing thumbs: {fails})")


if __name__ == "__main__":
    main()