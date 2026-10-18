/**
 * 相册灯箱 —— 只在 /photos/<num>/ 引入（生成的相册页末尾）。
 *
 * 契约（与 build.el 的相册生成器约定）：
 *   [data-lb-set]      一个独立格子集合；翻页不跨集合（散片不会一路翻进合集）
 *   a[data-lb]         可点开的格子；data-full=大图 URL，data-caption=说明
 *   #ph-lb / #ph-lb-img / #ph-lb-cap / #ph-lb-count / #ph-lb-close / #ph-lb-prev / #ph-lb-next
 *
 * 设计边界：
 * - 零 class：开/关只切 #ph-lb 的 [hidden] 属性，显示与否交给 CSS 的 #ph-lb[hidden]。
 * - 无 JS 时锚点照常打开大图（target=_blank），渐进增强。
 * - 方向键只在灯箱打开时接管；手机支持左右滑动翻页。
 */
(function () {
  'use strict';

  var lb = document.getElementById('ph-lb');
  if (!lb) return;

  var imgEl = document.getElementById('ph-lb-img');
  var capEl = document.getElementById('ph-lb-cap');
  var cntEl = document.getElementById('ph-lb-count');
  var btnClose = document.getElementById('ph-lb-close');
  var btnPrev = document.getElementById('ph-lb-prev');
  var btnNext = document.getElementById('ph-lb-next');

  var sets = Array.prototype.slice
    .call(document.querySelectorAll('[data-lb-set]'))
    .map(function (box) {
      var anchors = Array.prototype.slice.call(box.querySelectorAll('a[data-lb]'));
      return {
        anchors: anchors,
        items: anchors.map(function (a) {
          return {
            full: a.getAttribute('data-full') || a.href,
            caption: a.getAttribute('data-caption') || '',
          };
        }),
      };
    });

  var current = sets[0] || { anchors: [], items: [] };
  var idx = 0;
  var lastFocus = null;

  function isOpen() {
    return !lb.hidden;
  }

  function render(next) {
    var items = current.items;
    if (!items.length) return;
    idx = (next + items.length) % items.length;
    var it = items[idx];
    if (imgEl) {
      imgEl.src = it.full;
      imgEl.alt = it.caption;
    }
    if (capEl) capEl.textContent = it.caption;
    if (cntEl) cntEl.textContent = idx + 1 + ' / ' + items.length;
    // 预取相邻两张，翻页不等网络
    [1, -1].forEach(function (d) {
      var pre = new Image();
      pre.src = items[(idx + d + items.length) % items.length].full;
    });
  }

  function open(setIdx, i) {
    current = sets[setIdx] || current;
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    render(i);
    lb.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (imgEl) imgEl.src = ''; // 断掉当前大图请求
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  sets.forEach(function (set, setIdx) {
    set.anchors.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); // 有 JS 就不走 target=_blank
        open(setIdx, i);
      });
    });
  });

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function () { render(idx - 1); });
  if (btnNext) btnNext.addEventListener('click', function () { render(idx + 1); });

  // 点背景关闭（点图片本身不动）
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowLeft') {
      e.stopPropagation();
      render(idx - 1);
    } else if (e.key === 'ArrowRight') {
      e.stopPropagation();
      render(idx + 1);
    }
  });

  // 手机滑动翻页
  var touchX = null;
  lb.addEventListener('touchstart', function (e) {
    touchX = e.touches[0] ? e.touches[0].clientX : null;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var x = e.changedTouches[0] ? e.changedTouches[0].clientX : touchX;
    var dx = x - touchX;
    if (Math.abs(dx) > 48) render(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
})();
