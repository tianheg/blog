/**
 * 相册图片放行闸（纯函数，可在 node 里单测；worker 与测试共用同一份规则）。
 *
 * 硬约束（用户 2026-10-07）：只公开展示他点名的那批照片，其余一律 404。
 * 因此放行判据是「逐 key 精确匹配 allowlist」，绝不允许前缀级放行
 * （t/2026/ 这种前缀会连带暴露整个年份的私人照片）。
 */

/** 允许的桶内 key 形态：年份直接子目录下的单文件，排除嵌套与变体目录 */
export const PHOTO_KEY_RE = /^\d{4}\/[^/]+\.(?:webp|jpe?g|png)$/i;

/**
 * 把 /photos/... 的 URL path 解析成桶内 key。
 * @param {string} pathname 必须是 URL.pathname（仍带百分号编码）
 * @param {Set<string>} allow 逐 key 白名单（原始 key，不带 t/ h/ 前缀）
 * @returns {string | null} 命中返回桶内 key（含 t/ 或 h/ 前缀），不放行返回 null
 */
export function resolvePhotoKey(pathname, allow) {
  if (!pathname.startsWith('/photos/')) return null;
  const rest = pathname.slice('/photos/'.length);
  if (!rest) return null;
  let raw;
  try {
    raw = decodeURIComponent(rest);
  } catch {
    return null; // 非法编码不猜测、不拼接
  }
  let prefix = '';
  let key = raw;
  if (key.startsWith('t/')) {
    prefix = 't/';
    key = key.slice(2);
  } else if (key.startsWith('h/')) {
    prefix = 'h/';
    key = key.slice(2);
  }
  if (!PHOTO_KEY_RE.test(key)) return null;
  if (!allow.has(key)) return null;
  return prefix + key;
}