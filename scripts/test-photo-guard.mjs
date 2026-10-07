/**
 * photo-guard 白名单闸单测（本地 node 直接跑，不需要 wrangler）：
 *   node scripts/test-photo-guard.mjs
 *
 * 守的是用户硬约束：只有 allowlist 里的 key 能放行，其余全 404。
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PHOTO_KEY_RE, resolvePhotoKey } from './photo-guard.js';

const dir = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname);
const allow = new Set(JSON.parse(readFileSync(resolve(dir, 'photos-allowlist.json'), 'utf8')));
const sample = [...allow][0] ?? null;

// 1. 空清单 = 全拒（上线兜底窗口不存在）
if (allow.size === 0) {
  assert.equal(resolvePhotoKey('/photos/2026/20261005_Shenzhen_1.webp', allow), null);
  assert.equal(resolvePhotoKey('/photos/t/2026/20261005_Shenzhen_1.webp', allow), null);
  console.log('ok: 空清单全拒');
} else {
  // 2. 清单内三档全放行
  assert.equal(resolvePhotoKey(`/photos/${sample}`, allow), sample);
  assert.equal(resolvePhotoKey(`/photos/t/${sample}`, allow), `t/${sample}`);
  assert.equal(resolvePhotoKey(`/photos/h/${sample}`, allow), `h/${sample}`);
  // 3. 中文/空格/全角 key 的百分号编码往返
  const cjk = sample;
  if (/[^\x00-\x7f]/.test(cjk)) {
    assert.equal(resolvePhotoKey(`/photos/${encodeURIComponent(cjk)}`, allow), cjk);
  }
  console.log(`ok: 清单内 ${allow.size} key 三档放行`);
}

// 4. 清单外的一切必须拒（前缀像也没用）
const outside = [
  '/photos/2026/20260926_Shenzhen_9.webp', // 同年份、未点名
  '/photos/t/2026/20260926_Shenzhen_9.webp',
  '/photos/h/2025/20250101_Shenzhen_1.webp', // 别的年份
  '/photos/2019/20190424_Fushun.jpg',
  '/photos/net/文森· 威廉·梵高 - 雷云下的麦田.webp', // net/ 不在放行范围
  '/photos/_index.json', // 桶里其它对象
  '/photos/t/../2026/20261005_Shenzhen_1.webp', // 路径穿越
  '/photos/2026/../../etc/passwd',
  '/photos/', // 空
  '/photos', // 无前缀
  '/photos/2026', // 目录形态
];
for (const p of outside) {
  assert.equal(resolvePhotoKey(p, allow), null, `应拒绝: ${p}`);
}
console.log(`ok: ${outside.length} 条越权路径全拒`);

// 5. key 形态守卫
assert.ok(PHOTO_KEY_RE.test('2026/20261005_Shenzhen_1.webp'));
assert.ok(!PHOTO_KEY_RE.test('2026/nested/20261005.webp')); // 不许子目录
assert.ok(!PHOTO_KEY_RE.test('t/2026/20261005_Shenzhen_1.webp')); // 前缀由外层剥
console.log('ok: key 正则');

console.log('photo-guard: all passed');