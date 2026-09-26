#!/usr/bin/env python3
"""预热 Wayback 存档缓存（增量落盘，可随时中断重跑）。

archive.org 的 availability API 不带浏览器 UA 就一律超时；带 UA 则很快。
结果写 .hermes/external-links/wayback.json，prune-dead-links.py 直接复用。
"""
import json
import os
import subprocess
import time
import urllib.parse
import urllib.request
import concurrent.futures as cf

BLOG = "/root/projects/blog"
CACHE = os.path.join(BLOG, ".hermes/external-links/wayback.json")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")

scan = json.load(open("/tmp/ext-links.json", encoding="utf-8"))
dead = [r["url"] for r in scan["results"] if r["kind"] == "dead"]
nxs = {h for h, s in json.load(open("/tmp/doh.json", encoding="utf-8")).items() if s == "NXDOMAIN"}
for r in scan["results"]:
    if r["kind"] in ("error", "unreachable"):
        if urllib.parse.urlparse(r["url"]).hostname in nxs:
            dead.append(r["url"])

cache = {}
if os.path.exists(CACHE):
    try:
        cache = json.load(open(CACHE, encoding="utf-8"))
    except Exception:
        cache = {}

todo = [u for u in dict.fromkeys(dead)
        if not (cache.get(u, {}).get("url")
                or time.time() - cache.get(u, {}).get("at", 0) < 3 * 86400)]
print(f"待查 {len(todo)} / 总 {len(set(dead))}", flush=True)

lock = __import__("threading").Lock()


def dump():
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    tmp = CACHE + ".tmp"
    json.dump(cache, open(tmp, "w", encoding="utf-8"), ensure_ascii=False)
    os.replace(tmp, CACHE)


def query(url):
    time.sleep(0.3)
    try:
        req = urllib.request.Request(
            f"https://archive.org/wayback/available?url={urllib.parse.quote(url, safe='')}",
            headers={"User-Agent": UA})
        body = urllib.request.urlopen(req, timeout=25).read()
        s = json.loads(body).get("archived_snapshots", {}).get("closest", {})
        return url, (s.get("url") if s.get("available") else None)
    except Exception:
        return url, None


done = 0
with cf.ThreadPoolExecutor(4) as ex:
    for url, snap in ex.map(query, todo):
        with lock:
            cache[url] = {"url": snap, "at": time.time()}
            done += 1
            if done % 10 == 0:
                dump()
                got = sum(1 for u in todo[:done] if cache[u].get("url"))
                print(f"  {done}/{len(todo)}  有存档 {got}", flush=True)
dump()
got = sum(1 for u in set(dead) if cache.get(u, {}).get("url"))
print(f"完成：{len(set(dead))} 个死链URL，其中有存档 {got}", flush=True)
