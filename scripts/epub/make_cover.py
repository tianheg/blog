#!/usr/bin/env python3
"""生成 epub 封面：暖纸底 + 宋体书名 + 细线，配色取站上的 token。

用法: make_cover.py -o cover.png [--title 书名] [--subtitle 副标题] [--author tianhe] [--site tianheg.co]
"""
import argparse
import pathlib

from PIL import Image, ImageDraw, ImageFont

W, H = 1600, 2400                    # 标准书封比例
PAPER = (247, 245, 243)              # base-100 的 sRGB
INK = (47, 43, 40)
MUTED = (110, 104, 99)
RULE = (203, 196, 190)

SERIF_B = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
SERIF_R = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc"
SANS = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
FALLBACK = "/usr/share/fonts/truetype/arphic/uming.ttc"


def font(path, size):
    try:
        return ImageFont.truetype(path, size, index=0)
    except Exception:
        return ImageFont.truetype(FALLBACK, size)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", default=str(pathlib.Path(__file__).resolve().parent / "cover.png"))
    ap.add_argument("--title", default="天河的博客")
    ap.add_argument("--subtitle", default="文章选辑")
    ap.add_argument("--author", default="tianhe")
    ap.add_argument("--site", default="tianheg.co")
    a = ap.parse_args()

    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    f_title, f_sub = font(SERIF_B, 150), font(SERIF_R, 62)
    f_author, f_foot = font(SANS, 58), font(SANS, 38)
    cx = W // 2

    def center(text, y, f, fill, spacing=None):
        if spacing:                                   # PIL 没有 letter-spacing，逐字画
            widths = [d.textlength(ch, font=f) for ch in text]
            x = cx - (sum(widths) + spacing * (len(text) - 1)) / 2
            for ch, w in zip(text, widths):
                d.text((x, y), ch, font=f, fill=fill)
                x += w + spacing
        else:
            d.text((cx - d.textlength(text, font=f) / 2, y), text, font=f, fill=fill)

    d.line([(cx - 330, 620), (cx + 330, 620)], fill=RULE, width=3)
    center(a.title, 720, f_title, INK, spacing=18)
    if a.subtitle:
        center(a.subtitle, 950, f_sub, MUTED, spacing=14)
    d.line([(cx - 330, 1090), (cx + 330, 1090)], fill=RULE, width=3)
    center(a.author, 1420, f_author, INK, spacing=10)
    d.line([(cx - 90, 2130), (cx + 90, 2130)], fill=RULE, width=2)
    center(a.site, 2180, f_foot, MUTED, spacing=6)

    out = pathlib.Path(a.out)
    img.save(out, "PNG", optimize=True)
    print("封面:", out, f"{out.stat().st_size // 1024} KB", img.size)


if __name__ == "__main__":
    main()
