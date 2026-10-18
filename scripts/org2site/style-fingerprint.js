/* 样式回归指纹：逐元素 computed-style 快照（用于「重构不换皮」的零视觉变化验证）
 *
 * 用法：在任意浏览器/CDP 环境里对每个 (页面 × 视口 × 配色) 组合执行本脚本，
 *       取返回值里的 hash 比对。全部组合的 hash 一致 = 渲染等价。
 *
 * 覆盖：/ /posts/ /til/ /search/ /about/ /tags/
 *       1280×900 与 412×915（手机）两个视口 × light/dark 两套配色
 *
 * 注意：
 * - 必须等页面稳定后再取（字体会影响行高）：wait_for_load 后再等 ~0.7s，
 *   切 color-scheme 后再等 ~0.4s。
 * - 视口切换可能让布局滞后一帧，出现「滚动条忽然在 / 忽然不在」的瞬时假象
 *   （表现为 clientWidth 差 15px）。判定以连续两次一致为准。
 * - 不收录 text-underline-offset：在「本来就没有下划线」的元素上它会算成 auto，
 *   与是否真的有下划线无关，属于不产生渲染效果的噪声。text-decoration-line 保留。
 */
(() => {
  const PROPS = ['display','position','fontSize','fontFamily','fontWeight','lineHeight','letterSpacing',
    'color','backgroundColor','textDecorationLine','whiteSpace','overflowWrap',
    'marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderRadius','opacity',
    'width','height','flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','textAlign','visibility'];
  const out = [];
  const walk = (el, path) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') { out.push(path + '|display:none'); return; }
    const r = el.getBoundingClientRect();
    out.push(path + '|' + Math.round(r.width) + 'x' + Math.round(r.height) + '|' + PROPS.map(p => cs[p]).join('~'));
    let i = 0;
    for (const c of el.children) walk(c, path + '>' + c.tagName.toLowerCase() + ':' + (i++));
  };
  walk(document.body, 'body');
  const txt = out.join('\n');
  let h = 0x811c9dc5;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return {count: out.length, hash: h.toString(16), bytes: txt.length};
})()
