/**
 * Page preview — gwern.net-style link popups for internal links.
 *
 * Hover an internal link and a card appears with the target note's status,
 * title, section/date and opening excerpt: read enough to decide whether to
 * follow the link, without leaving the page (gwern calls this "semantic zoom").
 *
 * Data comes from /previews/index.json, built by
 * layouts/previews/list.json.json — one lazily-fetched file that serves every
 * preview on the site, cached in memory, prefetched during idle time. No
 * per-link network request and no per-link metadata inlined into the HTML
 * (gwern inlines annotation attributes because his pages are huge single pages;
 * one JSON is cheaper here and keeps the HTML small).
 *
 * Popups are recursive, like gwern's: links inside a popup open their own card
 * next to it, up to MAX_DEPTH levels. Only enabled on devices that actually
 * hover, so touch devices are unaffected.
 */

export interface PreviewEntry {
  /** title */
  t?: string;
  /** status: draft | reviewed */
  s?: string;
  /** header (til sub-category) */
  h?: string;
  /** section: til | posts */
  k?: string;
  /** first-seen date */
  d?: string;
  /** opening excerpt */
  x?: string;
}

type OpenCard = {
  el: HTMLElement;
  link: HTMLAnchorElement;
  depth: number;
};

const ENDPOINT = "/previews/index.json";
const SHOW_DELAY_MS = 220;
const HIDE_DELAY_MS = 160;
const MAX_DEPTH = 3;

let data: Record<string, PreviewEntry> | null = null;
let loading: Promise<Record<string, PreviewEntry>> | null = null;

const cards: OpenCard[] = [];
let showTimer: number | undefined;
let hideTimer: number | undefined;
let pendingHref: string | null = null;

/** Fetches (once) and caches the preview index. */
function load(): Promise<Record<string, PreviewEntry>> {
  if (data) return Promise.resolve(data);
  if (!loading) {
    loading = fetch(ENDPOINT)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((json) => {
        data = json as Record<string, PreviewEntry>;
        return data;
      });
  }
  return loading;
}

/** Resolves a link href to a preview entry, tolerating a missing trailing slash. */
function lookup(href: string): { key: string; entry: PreviewEntry } | null {
  if (!data) return null;
  const clean = href.split("#")[0];
  if (!clean) return null;
  const candidates = clean.endsWith("/") ? [clean, clean.slice(0, -1)] : [clean, clean + "/"];
  for (const key of candidates) {
    const entry = data[key];
    if (entry) return { key, entry };
  }
  return null;
}

function clearTimers(): void {
  if (showTimer !== undefined) window.clearTimeout(showTimer);
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  showTimer = undefined;
  hideTimer = undefined;
}

function closeFrom(index: number): void {
  while (cards.length > index) {
    const card = cards.pop();
    card?.el.remove();
  }
}

function closeAll(): void {
  clearTimers();
  pendingHref = null;
  closeFrom(0);
}

function scheduleHideAll(): void {
  if (showTimer !== undefined) {
    window.clearTimeout(showTimer);
    showTimer = undefined;
  }
  if (hideTimer !== undefined) return;
  hideTimer = window.setTimeout(() => {
    hideTimer = undefined;
    if (!cards.some((c) => c.el.matches(":hover"))) closeAll();
  }, HIDE_DELAY_MS);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusBadge(status: string | undefined): string {
  if (status === "draft") {
    return '<span class="inline-block align-baseline text-[10px] font-semibold uppercase tracking-wide px-1.5 py-[1px] rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 mr-1.5">draft</span>';
  }
  if (status === "reviewed") {
    return '<span class="inline-block align-baseline text-[10px] font-semibold uppercase tracking-wide px-1.5 py-[1px] rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 mr-1.5">reviewed</span>';
  }
  return "";
}

/** Builds a popup card for one preview entry. */
function buildCard(entry: PreviewEntry, depth: number, href: string): HTMLElement {
  const el = document.createElement("div");
  el.className =
    "pp-card fixed z-[60] w-[22rem] max-w-[88vw] rounded-lg border border-gray-200 dark:border-gray-700 " +
    "bg-white dark:bg-gray-900 shadow-xl overflow-hidden cursor-pointer " +
    "opacity-0 transition-opacity duration-150 ease-out";
  el.dataset.depth = String(depth);
  el.setAttribute("role", "tooltip");

  const meta = [entry.k, entry.h, entry.d].filter(Boolean).join(" · ");
  el.innerHTML = `
    <div class="px-3.5 pt-3">
      <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
        ${statusBadge(entry.s)}${escapeHtml(entry.t || "")}
      </div>
      ${meta ? `<div class="mt-1 text-[11px] text-gray-400 dark:text-gray-500 tracking-wide">${escapeHtml(meta)}</div>` : ""}
    </div>
    ${
      entry.x
        ? `<p class="px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400 max-h-56 overflow-hidden">${escapeHtml(entry.x)}</p>`
        : ""
    }
    <div class="px-3.5 pb-2.5 text-[11px] text-gray-400 dark:text-gray-500">点击进入 →</div>
  `;

  el.addEventListener("mouseenter", () => {
    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  });
  el.addEventListener("mouseleave", scheduleHideAll);
  // gwern-style: the whole card is a target, not just a "read more" link.
  // Skipped when the reader is selecting text inside the excerpt.
  el.addEventListener("click", () => {
    if (window.getSelection()?.toString()) return;
    window.location.href = href;
  });
  return el;
}

/** Positions a card next to its source link, keeping it inside the viewport. */
function place(el: HTMLElement, link: HTMLAnchorElement, depth: number): void {
  const r = link.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  let left = r.left + depth * 20;
  left = Math.min(Math.max(8, left), window.innerWidth - w - 8);

  let top = r.bottom + 10;
  if (top + h > window.innerHeight - 8) {
    const above = r.top - h - 10;
    top = above >= 8 ? above : Math.max(8, window.innerHeight - h - 8);
  }

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function openCard(anchor: HTMLAnchorElement, parentIndex: number): void {
  const href = anchor.getAttribute("href") || "";
  const hit = lookup(href);
  if (!hit) return;

  const depth = parentIndex < 0 ? 0 : cards[parentIndex].depth + 1;
  if (depth >= MAX_DEPTH) return;

  closeFrom(parentIndex + 1);

  const el = buildCard(hit.entry, depth, href);
  document.body.appendChild(el);
  const entry: OpenCard = { el, link: anchor, depth };
  cards.push(entry);

  place(el, anchor, depth);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });
}

function scheduleOpen(anchor: HTMLAnchorElement, parentEl: HTMLElement | null): void {
  const href = anchor.getAttribute("href") || "";
  if (!href || anchor.dataset.noPreview !== undefined) return;

  if (hideTimer !== undefined) {
    window.clearTimeout(hideTimer);
    hideTimer = undefined;
  }

  const parentIndex = parentEl ? cards.findIndex((c) => c.el === parentEl) : -1;

  // Already showing this exact target at this level — nothing to do.
  if (
    pendingHref === href &&
    showTimer !== undefined
  ) {
    return;
  }
  if (
    cards.length > parentIndex + 1 &&
    cards[parentIndex + 1]?.link === anchor
  ) {
    return;
  }

  if (showTimer !== undefined) window.clearTimeout(showTimer);
  pendingHref = href;
  void load(); // start (or reuse) the fetch immediately, don't wait for idle
  showTimer = window.setTimeout(() => {
    showTimer = undefined;
    pendingHref = null;
    // Await the index: the first hover may arrive before the lazy fetch lands.
    void load().then(() => openCard(anchor, parentIndex));
  }, SHOW_DELAY_MS);
}

function onMouseOver(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest<HTMLAnchorElement>('a[href^="/"]');
  const cardEl = target.closest<HTMLElement>(".pp-card");

  if (cardEl) {
    const index = cards.findIndex((c) => c.el === cardEl);
    if (index >= 0) closeFrom(index + 1);
    if (anchor && anchor.closest(".pp-card") === cardEl) {
      scheduleOpen(anchor, cardEl);
    }
    return;
  }

  if (anchor) {
    scheduleOpen(anchor, null);
    return;
  }

  scheduleHideAll();
}

/** Initialises page previews. Dormant until a real pointer shows up. */
export function initPagePreview(): void {
  let enabled = false;
  const enable = (): void => {
    if (enabled) return;
    enabled = true;

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseleave", closeAll);
    window.addEventListener("scroll", closeAll, { passive: true });
    window.addEventListener("resize", closeAll);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest('a[href^="/"]')) closeAll();
    });

    // Warm the cache when the browser is idle: the first hover then costs nothing.
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
      .requestIdleCallback;
    if (typeof idle === "function") {
      idle(() => void load());
    } else {
      window.setTimeout(() => void load(), 2500);
    }
  };

  if (window.matchMedia("(hover: hover)").matches) {
    enable();
    return;
  }

  // Not every environment reports hover even with a real mouse (headless
  // browsers, hybrid laptops with touch screens, some remote desktops). Wait
  // for an actual mouse pointer before attaching — touch taps synthesise
  // mousemove/mouseover too, so filter on pointerType instead of trusting them.
  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    window.removeEventListener("pointermove", onPointerMove);
    enable();
  };
  window.addEventListener("pointermove", onPointerMove);
}
