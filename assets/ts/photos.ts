/**
 * 相册灯箱 —— 只在 /photos/ 加载（layouts/photos/single.html 按页引入）。
 *
 * 设计边界：
 * - 网格本身是纯 HTML/CSS（模板渲染），这里只做「点开 → 前后翻 → 关」；
 * - 每块网格（散片 / 各合集）是一个独立 [data-lb-set]，翻页只在同集合内走，
 *   不会从散片区一路翻进合集（gallery skill 实测过的坑）；
 * - 无 JS 时锚点 href 照常打开图片（target=_blank），渐进增强；
 * - 方向键只在灯箱打开时接管，避免和站点其它快捷键打架；
 * - 图片 URL 由模板拼好带在 data-full 上，这里不碰 URL 拼接规则。
 */

interface Item {
  full: string;
  caption: string;
}

interface Set {
  anchors: HTMLAnchorElement[];
  items: Item[];
}

const overlay = document.getElementById('ph-lb');
const imgEl = document.getElementById('ph-lb-img');
const capEl = document.getElementById('ph-lb-cap');
const cntEl = document.getElementById('ph-lb-count');
const btnClose = document.getElementById('ph-lb-close');
const btnPrev = document.getElementById('ph-lb-prev');
const btnNext = document.getElementById('ph-lb-next');

const sets: Set[] = Array.from(document.querySelectorAll('[data-lb-set]')).map((box) => {
  const anchors = Array.from(box.querySelectorAll<HTMLAnchorElement>('a[data-lb]'));
  return {
    anchors,
    items: anchors.map((a) => ({
      full: a.dataset.full || a.href,
      caption: a.dataset.caption || '',
    })),
  };
});

let current: Set = sets[0] ?? { anchors: [], items: [] };
let idx = 0;
let lastFocus: HTMLElement | null = null;

function isOpen(): boolean {
  return !!overlay && !overlay.hidden;
}

function render(next: number): void {
  const { items } = current;
  if (!items.length) return;
  idx = (next + items.length) % items.length;
  const it = items[idx];
  if (imgEl) {
    imgEl.src = it.full;
    imgEl.alt = it.caption;
  }
  if (capEl) capEl.textContent = it.caption;
  if (cntEl) cntEl.textContent = `${idx + 1} / ${items.length}`;
  // 预取相邻两张，翻页不等网络
  for (const d of [1, -1]) {
    const j = (idx + d + items.length) % items.length;
    const pre = new Image();
    pre.src = items[j].full;
  }
}

function open(setIdx: number, i: number): void {
  if (!overlay) return;
  current = sets[setIdx] ?? current;
  lastFocus = document.activeElement as HTMLElement | null;
  overlay.hidden = false;
  overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  render(i);
  overlay.focus();
}

function close(): void {
  if (!overlay) return;
  overlay.hidden = true;
  overlay.classList.remove('flex'); // 作者样式 .flex 压得住 UA 的 [hidden]{display:none}，两处必须一起动
  document.body.style.overflow = '';
  if (imgEl) imgEl.src = ''; // 断掉当前大图请求
  lastFocus?.focus();
}

sets.forEach((set, setIdx) => {
  set.anchors.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault(); // 有 JS 就不走 target=_blank
      open(setIdx, i);
    });
  });
});

btnClose?.addEventListener('click', close);
btnPrev?.addEventListener('click', () => render(idx - 1));
btnNext?.addEventListener('click', () => render(idx + 1));

// 点背景关闭（点图片本身不动）
overlay?.addEventListener('click', (e) => {
  if (e.target === overlay) close();
});

document.addEventListener('keydown', (e) => {
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
let touchX: number | null = null;
overlay?.addEventListener(
  'touchstart',
  (e) => {
    touchX = e.touches[0]?.clientX ?? null;
  },
  { passive: true },
);
overlay?.addEventListener(
  'touchend',
  (e) => {
    if (touchX === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(dx) > 48) render(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  },
  { passive: true },
);