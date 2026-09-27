---
title: 用 Protomaps 自托管某区域的地图瓦片
status: draft
date: 2026-09-27T19:44:16+08:00
header: Tools
---

Protomaps 提供的是两件事：一套从 OpenStreetMap 构建矢量瓦片的管线，和一份每天构建好的全球 PMTiles 档案。想给某个站点/项目做「某一块区域的地图」，路径是：下载全球档案 → 按 bbox 裁出区域子集 → 拿静态服务器或对象存储直出 → 前端用 MapLibre 加载。

## 数据源与许可

- **OpenStreetMap** — 主数据源，ODbL。道路、建筑、土地利用、水系、地名、POI 全来自 OSM
- **osmdata.openstreetmap.de** — 海陆/水域多边形（osmcoastline 产物），ODbL
- **Natural Earth** — 只在低缩放用（z0–4 用 50m、z5 用 10m），公有领域，无需署名
- **ESA WorldCover** — 只喂 `landcover` 图层（z0–7），CC-BY 4.0，用了这层就得署名
- **Mapzen tangrams/icons** — 默认主题里的 POI 图标，MIT

瓦片本身是 OSM 的 ODbL「Produced Work」→ **地图上必须可见 `© OpenStreetMap`**。构建代码是 BSD-3，地图视觉设计是 CC0；官方另外要求改过的样式/瓦片服务不能继续叫 Protomaps。

## 构建与分发

- 生成器是 `protomaps/basemaps` 仓库里的 **Planetiler** profile（Java），从 OSM + Natural Earth 生成 `planet.pmtiles`，普通机器 **2–3 小时**
- 官方每日构建：`https://build.protomaps.com/<YYYYMMDD>.pmtiles`。实测 20260927 那份是 **128.9 GB（z0–15）**，schema v4.15.2；只保留最近一周和每个 patch 版本的最后一版，另有 AWS us-west-2 的 Source Cooperative 镜像
- 格式是 **PMTiles 单文件归档 + HTTP Range**：丢到 R2/S3/静态空间就能直出，不需要 tile server（这点和 mbtiles 不一样）

## 裁一块区域

```bash
# go-pmtiles v1.31.2，直接抽官方每日档案的一块 bbox
./pmtiles extract https://build.protomaps.com/20260927.pmtiles sz-z14.pmtiles \
  --bbox=113.576,22.079,114.387,22.936 --maxzoom=14 --download-threads=8
```

深圳（bbox 在行政边界外扩 0.2°，含周边海域）z14 实测：**12.4 秒、45 个请求、传输 34 MB、overfetch 0.05、产物 31.0 MB**。

同口径体积档位（只改 `--maxzoom` 或 bbox）：

| 区域 | maxzoom | 产物 |
|---|---|---|
| 深圳（0.2° 边距） | z13 | 16.1 MB |
| 深圳（0.2° 边距） | z14 | 31.0 MB |
| 深圳（0.2° 边距） | z15 | 59.1 MB |
| 深圳（0.1° 边距） | z14 | 25.5 MB |

两条规律：**maxzoom 每加一级，体积约翻倍**；bbox 边距从 0.2° 收到 0.1° 省约 18%。`overfetch` 稳定在 0.05，说明是按块读取、多余传输很少。

## 本地预览

```bash
./pmtiles serve --port=8899 --cors='*' .
# 档案名就是 URL 第一段：http://127.0.0.1:8899/sz-z14/{z}/{x}/{y}.mvt
```

没有目录列表，想知道有哪些档案看目录本身。任意静态服务器/对象存储按同样 URL 形态配即可。

## 样式层

- `@protomaps/basemaps` 是 TypeScript 包：`layers(source, flavor, { lang })` 直接产出 MapLibre style；flavor 提供 light / dark / white / black 等多套配色
- 中文用 `{ lang: 'zh-Hans' }` —— 字段是 `name:zh-Hans`、`name:zh-Hant`，**没有 `name:zh`**
- **只有 9 层**：boundaries / buildings / earth / landcover / landuse / places / pois / roads / water。这和 OpenMapTiles 系的 32 层不是一套 schema，换源等于样式重写：暗色配色、省界、`firstSymbolId`、字体栈全都要重来
- flavor 的字体栈指向 `basemaps-assets` 的 Noto Sans 系列；如果字体还挂在其他源上（上游只提供 `Noto Sans Regular`），`italic`/`bold` 会整批字形 404 —— 把 `flavor.italic`、`flavor.bold` 指回 Regular，或换用 Protomaps 的 assets

## 单张瓦片到底小多少

同一 bbox、同一 z 下，按**同口径 gzip 传输量**比（Protomaps vs OpenFreeMap）：

- z8 −4.6%
- z10 −5.6%
- z12 −14.5%
- z13 −7.2%
- z14 −30.6%

「换 Protomaps 能大幅省流量」不成立：量级只差 5–30%，且这只算了瓦片本身，JS、字体、其他资源都不变。

⚠️ 量法坑：OpenFreeMap 本来就返回 `content-encoding: gzip`。拿 Protomaps 的 gzip 版去比它的**未解压**大小，会得出「小 33–48%」的错误结论（我第一次就这么错了）。

## 什么时候值得自托管

值得：

- 要**数据自持**：上游改 schema、改样式或停服都影响不到你，可以长期钉住某个版本
- 要**离线/内网可用**，或者不想让客户端去连别人的域名
- 成本：区域档案从几 MB 到百 MB，R2 支持 Range 且无 egress 费，可以忽略

不值得：

- 只为「更快」—— 单瓦片只差 5–30%，还多一层自己维护
- 需要**全球覆盖** —— 全量 128.9 GB 得自己扛，也没有 CDN 帮你分发
- 现有样式深度绑定 OpenMapTiles schema —— 9 层 schema 意味着整套样式重做

## 两个坑

1. **extract 中途失败会留下坏档案**。实测一次 `--bbox` 抽取以 HTTP 524 结束，产物大小看着正常（2.2 MB），但对已知坐标请求瓦片时 `pmtiles serve` 不报错，而是**请求直接挂住**（客户端只能超时）。自检办法：对区域中心算一个 z12 的 x/y，curl 一下看是否 200；重抽并重启 serve 才能恢复。
2. **前端切换档案后要重新加图层**。`map.setStyle(newStyle)` 之后 source/layer 全没了，必须再 add 一次；只注册一次 `style.load` 回调会抢跑（实测切过去后地图一片空白）。用轮询 `map.isStyleLoaded()` 兜底再加最稳。

## 参考

- [protomaps/basemaps — 构建管线与样式包](https://github.com/protomaps/basemaps)
- [basemaps 的数据源与署名要求（LICENSE_DATA.md）](https://github.com/protomaps/basemaps/blob/main/LICENSE_DATA.md)
- [Protomaps 图层文档](https://docs.protomaps.com/basemaps/layers)
- [PMTiles 规范](https://github.com/protomaps/PMTiles)
