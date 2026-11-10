// node test.js —— 抽 index.html 里的引擎段跑数值断言
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

if (scripts.length < 2) {
  console.error("期望 2 段内联 script，实际 " + scripts.length);
  process.exit(1);
}

// 语法门禁：一处括号就让整段不执行，页面却看起来正常
scripts.forEach((code, i) => {
  try { new vm.Script(code); }
  catch (e) { console.error(`script[${i}] 语法错误：` + e.message); process.exit(1); }
});

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(scripts[0], sandbox);          // 只跑引擎段，UI 段需要 DOM
const IP = sandbox.IdPhoto;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra !== undefined ? "  → " + extra : "")); }
}
function eq(name, got, want) {
  ok(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}

console.log("\n[规格]");
eq("33mm @300dpi = 390px", IP.mmToPx(33, 300), 390);
eq("48mm @300dpi = 567px", IP.mmToPx(48, 300), 567);
eq("SIZES.big1.px", IP.SIZES.big1.px, [390, 567]);
// 权威像素表（300dpi），mm 换算必须逐项对上，抄错一个数用户拿去冲印就是废片
const AUTH = {
  small1: [260, 378], one: [295, 413], big1: [390, 567], small2: [413, 531], two: [413, 579]
};
IP.SIZE_ORDER.forEach(id => {
  eq(id + " 像素", IP.SIZES[id].px, AUTH[id]);
});
eq("规格数量", IP.SIZE_ORDER.length, 5);

console.log("\n[相纸排版]");
eq("6寸纸像素", IP.PAPERS.p6.px, [1800, 1200]);
eq("5寸纸像素", IP.PAPERS.p5.px, [1500, 1050]);
eq("A4 像素", IP.PAPERS.a4.px, [2480, 3508]);
// 大一寸 390x567 在 6 寸纸上应排 4x2 = 8 张（手工核对：4*390+3*30=1650<=1800, 2*567+30=1164<=1200）
const g6 = IP.layoutGrid(1800, 1200, 390, 567, 30);
ok("6寸排大一寸 = 4x2", g6 && g6.cols === 4 && g6.rows === 2 && g6.count === 8,
   g6 && [g6.cols, g6.rows, g6.count].join("x"));
ok("排版总宽不超纸宽", g6 && g6.totalW <= 1800, g6 && g6.totalW);
ok("排版总高不超纸高", g6 && g6.totalH <= 1200, g6 && g6.totalH);
const gA4 = IP.layoutGrid(2480, 3508, 390, 567, 30);
ok("A4 排大一寸 = 5x5", gA4 && gA4.cols === 5 && gA4.rows === 5, gA4 && [gA4.cols, gA4.rows].join("x"));
const g5 = IP.layoutGrid(1500, 1050, 260, 378, 30);
ok("5寸排小一寸 = 5x2", g5 && g5.cols === 5 && g5.rows === 2, g5 && [g5.cols, g5.rows].join("x"));
ok("放不下时返回 null", IP.layoutGrid(100, 100, 390, 567, 30) === null);

console.log("\n[背景采样 + 抠图]");
// 合成一张 200x280 的图：浅灰背景 rgb(238,238,235)，中间一个深色竖椭圆当人
const W = 200, H = 280, N = W * H;
const data = new Uint8ClampedArray(N * 4);
const BG = [238, 238, 235];
const FG = [40, 60, 90];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    const dx = (x - W / 2) / 45, dy = (y - H / 2) / 95;
    const isFg = dx * dx + dy * dy < 1;
    const c = isFg ? FG : BG;
    data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
  }
}
const img = { data, width: W, height: H };

const bg = IP.sampleBackground(data, W, H);
ok("采样到背景色", Math.abs(bg[0] - 238) < 2 && Math.abs(bg[1] - 238) < 2, bg.map(v => v.toFixed(1)).join(","));

const mask = IP.backgroundMask(img, 40);
const at = (x, y) => mask[y * W + x];
ok("角落(0,0) 判为背景", at(0, 0) === 1);
ok("角落(199,279) 判为背景", at(199, 279) === 1);
ok("中心(100,140) 判为前景", at(100, 140) === 0);
ok("人脸区域(100,80) 判为前景", at(100, 80) === 0);

let bgCount = 0;
for (let p = 0; p < N; p++) bgCount += mask[p];
const fgExpect = Math.PI * 45 * 95;               // 椭圆面积
const fgGot = N - bgCount;
ok("前景面积接近椭圆理论值", Math.abs(fgGot - fgExpect) / fgExpect < 0.06,
  `got ${fgGot}, expect ≈ ${Math.round(fgExpect)}`);

console.log("\n[alpha 拉伸]");
const raw = new Float32Array([-0.1, 0.05, 0.1, 0.5, 0.95, 1.2]);
const st = IP.stretchAlpha(raw, 0.1, 0.85);
ok("低于下界压成 0", st[0] === 0 && st[1] === 0 && st[2] < 1e-6, st.slice(0,3));
ok("中点线性映射", Math.abs(st[3] - (0.5 - 0.1) / 0.85) < 1e-6, st[3]);
eq("上界以上压成 1", [st[4], st[5]], [1, 1]);

console.log("\n[头部定位 headBox]");
// 100 宽 x 120 高：头在 y20-60 / x40-60，肩在 y60-120 / x20-80
const hbW = 100, hbH = 120;
const hbA = new Float32Array(hbW * hbH);
for (let y = 20; y < 120; y++) {
  for (let x = 0; x < hbW; x++) {
    const inHead = y < 60 && x >= 40 && x <= 60;
    const inBody = y >= 60 && x >= 20 && x <= 80;
    if (inHead || inBody) hbA[y * hbW + x] = 1;
  }
}
const box = IP.headBox(hbA, hbW, hbH);
ok("头顶行 = 20", box && box.top === 20, box && box.top);
ok("头宽 = 21（量在头部不是肩膀）", box && box.headW === 21, box && box.headW);
ok("头部中线 = 50", box && Math.abs(box.headCx - 50) < 0.6, box && box.headCx);
ok("空 alpha 返回 null", IP.headBox(new Float32Array(hbW * hbH), hbW, hbH) === null);

console.log("\n[前景去污染]");
// 20x20：背景 (200,200,200)，中间 8x8 方块 (30,60,90)
const w2 = 20, h2 = 20, n2 = w2 * h2;
const img2 = new Uint8ClampedArray(n2 * 4);
const alpha2 = new Float32Array(n2);
for (let y = 0; y < h2; y++) {
  for (let x = 0; x < w2; x++) {
    const p = y * w2 + x, o = p * 4;
    const inSq = x >= 6 && x < 14 && y >= 6 && y < 14;
    const onEdge = (x === 6 || x === 13 || y === 6 || y === 13) && inSq;
    img2[o] = inSq ? 30 : 200;
    img2[o + 1] = inSq ? 60 : 200;
    img2[o + 2] = inSq ? 90 : 200;
    img2[o + 3] = 255;
    alpha2[p] = onEdge ? 0.5 : inSq ? 1 : 0;
  }
}
const idata2 = { data: img2, width: w2, height: h2 };
const fg = IP.foregroundFromAlpha(idata2, alpha2, { radius: 1 });

const pxat = (x, y, c) => fg.data[(y * w2 + x) * 4 + c];
ok("实心内部保持原色", pxat(10, 10, 0) === 30 && pxat(10, 10, 2) === 90);
ok("实心内部 alpha=255", fg.data[(10 * w2 + 10) * 4 + 3] === 255);
ok("外部全透明且 RGB=0", fg.data[(0 * w2 + 0) * 4 + 3] === 0 && pxat(0, 0, 0) === 0);
// 关键：边界像素原色是背景灰，去污染后应取到前景蓝
ok("边界像素颜色被换成前景本色",
   Math.abs(pxat(6, 10, 2) - 90) < 45 && Math.abs(pxat(6, 10, 0) - 30) < 45,
   `rgb(${pxat(6,10,0)},${pxat(6,10,1)},${pxat(6,10,2)})`);
ok("边界 alpha≈128", Math.abs(fg.data[(6 * w2 + 10) * 4 + 3] - 128) <= 3,
   fg.data[(6 * w2 + 10) * 4 + 3]);

console.log("\n[羽化]");
const r0 = IP.blurMask(mask, W, H, 0);
ok("半径 0 保持原值", r0[0] === 1 && r0[140 * W + 100] === 0);
const r2 = IP.blurMask(mask, W, H, 2);
let mid = 0;
for (let p = 0; p < N; p++) if (r2[p] > 0.2 && r2[p] < 0.8) mid++;
ok("半径 2 产生过渡带", mid > 100, "过渡像素 " + mid);

console.log("\n[合成]");
const copy = { data: new Uint8ClampedArray(data), width: W, height: H };
IP.compositeOnColor(copy, r2, [255, 255, 255]);
const o0 = 0;
ok("背景被换成白色", copy.data[o0] > 250 && copy.data[o0 + 1] > 250);
const oc = (140 * W + 100) * 4;
ok("前景未被改", Math.abs(copy.data[oc] - FG[0]) < 3 && Math.abs(copy.data[oc + 1] - FG[1]) < 3,
  `${copy.data[oc]},${copy.data[oc + 1]},${copy.data[oc + 2]}`);
eq("hexToRgb #438edb", IP.hexToRgb("#438edb"), [67, 142, 219]);
eq("hexToRgb #fff", IP.hexToRgb("#fff"), [255, 255, 255]);

console.log("\n[JPEG DPI 元数据]");
// 带 APP0 的最小 JFIF 头
const withApp0 = new Uint8Array([
  0xFF, 0xD8,
  0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
  0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00
]);
const p1 = IP.patchJpegDpi(withApp0.buffer, 300);
eq("units 改成 1 (dpi)", p1[13], 1);
eq("Xdensity = 300", (p1[14] << 8) | p1[15], 300);
eq("Ydensity = 300", (p1[16] << 8) | p1[17], 300);
eq("长度不变", p1.length, withApp0.length);

// 无 APP0（只有 Exif）→ 插入
const noApp0 = new Uint8Array([
  0xFF, 0xD8,
  0xFF, 0xE1, 0x00, 0x08, 1, 2, 3, 4, 5, 6,
  0xFF, 0xDA, 0x00, 0x08, 1, 1, 0, 0, 0, 0, 0
]);
const p2 = IP.patchJpegDpi(noApp0.buffer, 300);
eq("插入后长度 +18", p2.length, noApp0.length + 18);
eq("插入的段是 APP0", [p2[2], p2[3]], [0xFF, 0xE0]);
eq("插入段 units", p2[13], 1);
eq("插入段 Xdensity", (p2[14] << 8) | p2[15], 300);

// 非 JPEG 原样返回
const notJpeg = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
const p3 = IP.patchJpegDpi(notJpeg.buffer, 300);
eq("非 JPEG 不改动", p3.length, notJpeg.length);

console.log(`\n${fail === 0 ? "全部通过" : "有失败"}：${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
