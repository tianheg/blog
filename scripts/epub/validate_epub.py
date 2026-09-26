#!/usr/bin/env python3
"""EPUB 结构校验（替代 epubcheck，纯 Python）
检查: mimetype 位置/存储方式、container、OPF manifest/spine/metadata、
     每个 XHTML 是否合法 XML、内部链接目标与片段是否存在、外链 URL 合法性。
用法: validate_epub.py book.epub
"""
import sys, zipfile, re, posixpath
import xml.etree.ElementTree as ET

OPF_NS = "{http://www.idpf.org/2007/opf}"
XH = "{http://www.w3.org/1999/xhtml}"
CONTAINER = "{urn:oasis:names:tc:opendocument:xmlns:container}"

def main(path):
    z = zipfile.ZipFile(path)
    errs, warns = [], []

    # 1. mimetype
    names = z.namelist()
    if not names or names[0] != "mimetype":
        errs.append(f"mimetype 不是第一个条目: {names[0] if names else '空包'}")
    else:
        if z.getinfo("mimetype").compress_type != zipfile.ZIP_STORED:
            errs.append("mimetype 必须不压缩 (STORED)")
        if z.read("mimetype") != b"application/epub+zip":
            errs.append("mimetype 内容错误")
    if "META-INF/container.xml" not in names:
        errs.append("缺 META-INF/container.xml"); print_report(errs, warns); return

    # 2. container -> opf
    root = ET.fromstring(z.read("META-INF/container.xml"))
    opf_path = root.find(f".//{CONTAINER}rootfile").get("full-path")
    opf = ET.fromstring(z.read(opf_path))
    base = posixpath.dirname(opf_path)

    # 3. metadata / manifest / spine
    meta = opf.find(f"{OPF_NS}metadata")
    if meta is None or meta.find(f"{{{OPF_NS[1:-1]}}}title") is None and meta.find("{http://purl.org/dc/elements/1.1/}title") is None:
        errs.append("OPF 缺 dc:title")
    manifest = {i.get("id"): i.get("href") for i in opf.iter(f"{OPF_NS}item")}
    for i in opf.iter(f"{OPF_NS}item"):
        href = posixpath.normpath(posixpath.join(base, i.get("href")))
        if href not in names:
            errs.append(f"manifest 引用缺失文件: {i.get('href')}")
    spine_ids = [r.get("idref") for r in opf.iter(f"{OPF_NS}itemref")]
    for sid in spine_ids:
        if sid not in manifest:
            errs.append(f"spine 引用了不存在的 id: {sid}")

    # 4/5. 每个 XHTML
    xhtmls = [n for n in names if n.endswith(".xhtml")]
    ids = {}
    docs = {}
    for n in xhtmls:
        raw = z.read(n)
        try:
            ET.fromstring(raw)
        except ET.ParseError as e:
            errs.append(f"{n}: XML 非法 — {e}")
            continue
        t = raw.decode("utf-8", "replace")
        docs[n] = t
        ids[n] = set(re.findall(r'\sid="([^"]+)"', t))
    for n, t in docs.items():
        for href in re.findall(r'<a[^>]+href="([^"]+)"', t):
            if href.startswith(("http://", "https://", "mailto:")):
                if re.match(r"^https?://[#?]?$", href) or re.search(r"%(?![0-9A-Fa-f]{2})", href) or re.search(r"\s", href):
                    errs.append(f"{n}: 非法外链 {href[:70]}")
                continue
            if href.startswith(("tel:", "sms:", "urn:")):
                continue
            page, _, frag = href.partition("#")
            tgt = posixpath.normpath(posixpath.join(posixpath.dirname(n), page)) if page else n
            if tgt not in docs:
                errs.append(f"{n}: 内部链接目标不存在 {href[:70]}")
            elif frag and frag not in ids.get(tgt, ()):
                errs.append(f"{n}: 片段未定义 {href[:70]}")
    print_report(errs, warns, len(xhtmls), opf_path)

def print_report(errs, warns, n=0, opf=""):
    print(f"XHTML 文件: {n}   OPF: {opf}")
    for e in errs[:40]:
        print("  ERROR:", e)
    if len(errs) > 40: print(f"  ... 还有 {len(errs)-40} 条")
    for w in warns[:10]:
        print("  WARN:", w)
    print(f"合计: {len(errs)} errors / {len(warns)} warnings")
    sys.exit(1 if errs else 0)

main(sys.argv[1])
