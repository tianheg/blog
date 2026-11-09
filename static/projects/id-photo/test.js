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

console.log("\n[引导滤波 / maskAlpha]");
// 100x140：灰背景 + 深色方块；mask 只有方块是前景
const w2 = 100, h2 = 140, n2 = w2 * h2;
const img2 = new Uint8ClampedArray(n2 * 4);
const md2 = new Uint8ClampedArray(n2 * 4);
for (let y = 0; y < h2; y++) {
  for (let x = 0; x < w2; x++) {
    const o = (y * w2 + x) * 4;
    // 方块边缘 4px 渐变，模拟真实照片的软过渡
    const d = Math.min(x - 30, 69 - x, y - 40, 109 - y);
    const t = Math.max(0, Math.min(1, d / 4 + 0.5));
    const c = Math.round(205 + (30 - 205) * t);
    img2[o] = img2[o+1] = img2[o+2] = c; img2[o+3] = 255;
    const m = d > 0 ? 255 : 0;                 // mask 仍是硬边，靠 guided filter 塑形
    md2[o] = md2[o+1] = md2[o+2] = m; md2[o+3] = 255;
  }
}
const idata2 = { data: img2, width: w2, height: h2 };
const mdata2 = { data: md2, width: w2, height: h2 };

const a0 = IP.maskAlpha(mdata2, idata2, w2, h2, 0, 1);
ok("maskAlpha 前景=1", a0[70 * w2 + 50] > 0.95, a0[70 * w2 + 50]);
ok("maskAlpha 背景=0", a0[10 * w2 + 10] < 0.05, a0[10 * w2 + 10]);
let bandPx = 0;
for (let p = 0; p < n2; p++) if (a0[p] > 0.1 && a0[p] < 0.9) bandPx++;
ok("maskAlpha 有过渡带", bandPx > 50, "过渡像素 " + bandPx);

const a3 = IP.maskAlpha(mdata2, idata2, w2, h2, 3, 1);
ok("收缩后略小于原 mask", a3[45 * w2 + 50] < a0[45 * w2 + 50] + 0.001);

const gq = IP.guidedFilter(a0, idata2, w2, h2, 4, 0.0006);
ok("guidedFilter 前景保持", gq[70 * w2 + 50] > 0.9, gq[70 * w2 + 50]);
ok("guidedFilter 背景保持", gq[10 * w2 + 10] < 0.1, gq[10 * w2 + 10]);

const er = IP.erodeMask(a0, w2, h2, 2);
ok("腐蚀 2px 吃掉 2 行边界", er[42 * w2 + 50] < 0.5 && er[43 * w2 + 50] > 0.5);

console.log("\n[去污染]");
const c1 = { data: new Uint8ClampedArray([100, 100, 100, 255]), width: 1, height: 1 };
const al1 = new Float32Array([0.5]);
IP.decontaminate(c1, al1, [200, 200, 200]);
ok("反解 C=0.5F+0.5B 得 F", Math.abs(c1.data[0]) < 3, c1.data[0]);

const c2 = { data: new Uint8ClampedArray([250, 250, 250, 255]), width: 1, height: 1 };
const al2 = new Float32Array([1.0]);
IP.decontaminate(c2, al2, [200, 200, 200]);
ok("alpha=1 不改动", c2.data[0] === 250);

const bgImg = { data: new Uint8ClampedArray(n2 * 4), width: w2, height: h2 };
for (let p = 0; p < n2; p++) { const o = p*4; bgImg.data[o]=150; bgImg.data[o+1]=160; bgImg.data[o+2]=170; bgImg.data[o+3]=255; }
const est = IP.estimateBackgroundColor(bgImg, a0);
ok("背景色估计", est && est[0] === 150 && est[1] === 160 && est[2] === 170, JSON.stringify(est));

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
