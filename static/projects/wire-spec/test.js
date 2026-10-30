/* 无构建步骤：直接从 index.html 抽出引擎脚本段做数值校验 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length < 2) { console.error('index.html 里找不到内联脚本'); process.exit(1); }

// 语法门禁：两段内联脚本都必须能解析（漏括号会在这里炸，而不是线上白屏）
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `index.html#script${i + 1}` }); }
  catch (e) { console.error(`第 ${i + 1} 段脚本语法错误：${e.message}`); process.exit(1); }
});

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(scripts[0], sandbox);
const W = sandbox.WireSizer;
if (!W) { console.error('引擎段没有挂出 WireSizer'); process.exit(1); }

let pass = 0, fail = 0;
function ck(name, got, want, tol = 1e-9) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= tol : got === want;
  if (ok) { pass++; console.log(`  ok  ${name} = ${got}`); }
  else { fail++; console.log(`FAIL  ${name}: got ${got}, want ${want}`); }
}

console.log('— 载流量表（对照 IEC B.52.2~B.52.5 原表）—');
ck('PVC C 2根 Cu 2.5mm²', W.baseAmpacity(2.5, 'pvc', 'C', 2, 'cu'), 27);
ck('PVC C 3根 Cu 16mm²', W.baseAmpacity(16, 'pvc', 'C', 3, 'cu'), 76);
ck('PVC B1 3根 Cu 240mm²', W.baseAmpacity(240, 'pvc', 'B1', 3, 'cu'), 346);
ck('PVC D1 3根 Cu 16mm²', W.baseAmpacity(16, 'pvc', 'D1', 3, 'cu'), 64);
ck('PVC D2 3根 Cu 16mm²', W.baseAmpacity(16, 'pvc', 'D2', 3, 'cu'), 70);
ck('XLPE C 3根 Cu 240mm²', W.baseAmpacity(240, 'xlpe', 'C', 3, 'cu'), 500);
ck('XLPE D1 3根 Cu 240mm²', W.baseAmpacity(240, 'xlpe', 'D1', 3, 'cu'), 324);
ck('XLPE D1 3根 Al 95mm²', W.baseAmpacity(95, 'xlpe', 'D1', 3, 'al'), 154);
ck('PVC C 3根 Al 16mm²', W.baseAmpacity(16, 'pvc', 'C', 3, 'al'), 59);
ck('铝无 1.5mm²', W.baseAmpacity(1.5, 'pvc', 'C', 3, 'al'), 0);
ck('300mm² 已入表', W.baseAmpacity(300, 'xlpe', 'C', 3, 'cu'), 576);

console.log('— 表内单调性 —');
(function () {
  let bad = 0;
  for (const ins of Object.keys(W.TAB))
    for (const mat of Object.keys(W.TAB[ins]))
      for (const m of Object.keys(W.TAB[ins][mat]))
        for (const ld of ['2', '3']) {
          const row = W.TAB[ins][mat][m][ld];
          for (let i = 1; i < row.length; i++)
            if (row[i] && row[i - 1] && row[i] < row[i - 1]) { bad++; console.log('   非单调', ins, mat, m, ld, i); }
        }
  ck('单调性违规数', bad, 0);
})();

console.log('— 修正系数 —');
ck('温度 PVC 空气 40℃', W.tempFactor('pvc', 'B1', 40), 0.87);
ck('温度 PVC 空气 80℃（超限→0）', W.tempFactor('pvc', 'B1', 80), 0);
ck('温度表上限 PVC 空气', W.tempLimit('pvc', 'B1'), 60);
ck('温度 XLPE 土壤 35℃', W.tempFactor('xlpe', 'D1', 35), 0.89);
ck('成组 3 回路捆扎', W.groupFactor(3, 'bunched'), 0.70);
ck('土壤 2.5 穿管（基准）', W.soilFactor(2.5, 'D1'), 1.00);
ck('土壤 2.0 直埋', W.soilFactor(2.0, 'D2'), 1.12);
ck('土壤系数对非埋地为 1', W.soilFactor(3.0, 'C'), 1);

console.log('— 电阻与压降 —');
const r25 = W.resistancePerM(2.5, 'cu', 'pvc');
ck('R 2.5mm² Cu PVC(70℃)', Math.round(r25 * 1e7) / 1e7, 0.0082508, 1e-6);
ck('ΔU 20A 30m 单相', Math.round(W.dropVolts(20, 30, r25, '1ph') * 1000) / 1000, 9.901, 0.01);
ck('Lmax 220V 2% 20A 2.5mm²', Math.round(W.maxLength(20, r25, '1ph', 220, 2) * 100) / 100, 13.33, 0.01);
ck('直流往返系数', W.dropVolts(10, 10, 0.01, 'dc'), 2.0);
ck('三相/单相压降比 = √3/2', Math.round(W.dropVolts(10, 10, 0.01, '3ph', 1) / W.dropVolts(10, 10, 0.01, '1ph') * 1000) / 1000, 0.866, 1e-3);

console.log('— 单回路选型 —');
const base = { system: '1ph', volt: 220, current: 16, length: 30, allowPct: 2,
  material: 'cu', insul: 'pvc', method: 'C', ambient: 30, circuits: 1, groupStyle: 'bunched', soilRho: 2.5 };
const r1 = W.sizeOne(base);
ck('16A/220V/30m/2% → 6mm²', r1.rec.size, 6);
ck('  压降%', Math.round(r1.rec.vdPct * 100) / 100, 1.50, 0.01);
ck('  断路器', r1.breaker, 16);
ck('10m 同条件 → 2.5mm²', W.sizeOne({ ...base, length: 10 }).rec.size, 2.5);

const motor = W.sizeOne({ system: '3ph', volt: 380, current: 26.8, length: 40, allowPct: 3,
  material: 'cu', insul: 'pvc', method: 'C', ambient: 35, circuits: 1, groupStyle: 'bunched', cosphi: 0.9 });
ck('电机 26.8A：4mm² 因 In>Iz 被排除', motor.rows.find(r => r.size === 4).ok, false);
ck('  推荐 6mm²（配 32A）', motor.rec.size, 6);
ck('  断路器', motor.breaker, 32);

ck('PVC 75℃ → overTemp', W.sizeOne({ ...base, ambient: 75 }).overTemp, true);
ck('铝芯 2A 不会选到 1.5mm²', W.sizeOne({ ...base, material: 'al', current: 2 }).rec.size >= 2.5, true);

console.log('— 分段串联 —');
const segs = [
  { size: 95, material: 'al', insul: 'xlpe', method: 'D1', length: 120, ambient: 20, circuits: 1, soilRho: 2.5 },
  { size: 25, material: 'cu', insul: 'xlpe', method: 'B1', length: 15, ambient: 35, circuits: 1 }
];
const ser = W.sizeSeries(segs, { system: '3ph', volt: 380, current: 40, allowPct: 5, cosphi: 0.9 });
ck('串联段数', ser.detail.length, 2);
ck('总压降 = 各段和', Math.round(ser.vd * 1000) / 1000,
  Math.round((ser.detail[0].vd + ser.detail[1].vd) * 1000) / 1000, 1e-9);
ck('瓶颈段 = 25mm²', ser.weakest.size, 25);
ck('组合最大电流 = min Iz', Math.round(ser.maxIbByAmp * 100) / 100,
  Math.round(Math.min(ser.detail[0].iz, ser.detail[1].iz) * 100) / 100, 1e-6);

console.log('— 并联双拼 —');
const par = W.sizeParallel([
  { size: 16, material: 'cu', insul: 'pvc', method: 'C', length: 30, ambient: 30, circuits: 1 },
  { size: 16, material: 'cu', insul: 'pvc', method: 'C', length: 30, ambient: 30, circuits: 1 }
], { system: '1ph', volt: 220, current: 40, allowPct: 3 });
ck('2×16 等效 32', par.equivSize, 32);
ck('电流均分 20A', Math.round(par.rows[0].current * 1000) / 1000, 20, 1e-6);
const parCuAl = W.sizeParallel([
  { size: 16, material: 'cu', insul: 'pvc', method: 'C', length: 30, ambient: 30, circuits: 1 },
  { size: 16, material: 'al', insul: 'pvc', method: 'C', length: 30, ambient: 30, circuits: 1 }
], { system: '1ph', volt: 220, current: 40, allowPct: 3 });
ck('铜铝混接告警', parCuAl.warns.some(w => w.includes('铜铝')), true);
ck('铝支路分得更少（ρ 大）', parCuAl.rows[1].current < parCuAl.rows[0].current, true);

console.log('— 辅助 —');
ck('AWG 1.5mm²', W.awgOf(1.5), 15);
ck('AWG 25mm²', W.awgOf(25), 3);
ck('断路器 20A/27A → 20', W.pickBreaker(20, 27), 20);
ck('断路器 20A/19A → 无', W.pickBreaker(20, 19), null);
ck('导体用量 3×50m 10mm² Cu', Math.round(W.conductorMass(10, 50, 'cu', '3ph') * 100) / 100, 13.34, 0.01);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
