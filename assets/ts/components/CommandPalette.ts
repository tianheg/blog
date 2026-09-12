/**
 * 命令面板（⌘K / Ctrl+K）
 *
 * 行为：
 *   - 任意页面按 ⌘K / Ctrl+K 唤出，Esc 或点背景关闭
 *   - 输入即搜（Pagefind 关键词索引，懒加载，不做预取）
 *   - 空输入时显示静态快捷动作（随机一篇 / 关系图 / 最近新增 / 待照料）
 *   - ↑↓ 选择、Enter 打开、点条目直接跳
 *
 * Pagefind 索引在构建末期由 `npm run pagefind` 生成；本地只跑 `hugo` 时
 * 索引不存在，面板会降级为「只显示快捷动作」而不是报错。
 */

type Item = {
  url: string;
  title: string;
  /** 结果条目右下角的一行说明（分类 / 路径） */
  meta?: string;
  /** 匹配上下文摘要（Pagefind excerpt 去标签后的纯文本） */
  excerpt?: string;
};

const PANEL_ID = "cmdk";

export function initCommandPalette(): void {
  const root = document.getElementById(PANEL_ID);
  if (!root) return;

  const input = root.querySelector<HTMLInputElement>("#cmdk-input");
  const actionsList = root.querySelector<HTMLUListElement>("#cmdk-actions");
  const resultsList = root.querySelector<HTMLUListElement>("#cmdk-results");
  const emptyEl = root.querySelector<HTMLElement>("#cmdk-empty");
  const countEl = root.querySelector<HTMLElement>("#cmdk-count");
  if (!input || !actionsList || !resultsList || !emptyEl) return;

  // slug → 中文分类名（由 partial 以 JSON 注入）
  let sectionNames: Record<string, string> = {};
  try {
    const raw = document.getElementById("cmdk-sections")?.textContent;
    if (raw) sectionNames = JSON.parse(raw);
  } catch {
    sectionNames = {};
  }

  function crumbOf(url: string): string {
    const parts = url.split("/").filter(Boolean);
    if (parts[0] === "til" && parts[1]) return sectionNames[parts[1]] || parts[1];
    if (parts[0] === "posts") return "文章";
    return parts[0] ? `/${parts[0]}` : "";
  }

  /** Pagefind 的 excerpt 只允许保留 <mark>，其余标签剥掉；
      若是标题的复述或过短则丢弃（返空，不显示第二行）。 */
  function cleanExcerpt(raw: unknown, title: string): string {
    let html = String(raw ?? "");
    if (!html) return "";
    html = html.replace(/<(?!\/?mark\b)[^>]*>/gi, "");
    const text = html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[，。、；：""''）】…—\-\s]+/, "")
      .trim();
    if (!text || text === title) return "";
    if (text.length < 8) return "";
    if (title.startsWith(text.replace(/…$/, "").slice(0, 10))) return "";
    return html.replace(/\s+/g, " ").trim();
  }

  let activeList: HTMLUListElement = actionsList;
  let activeIndex = 0;
  let debounceTimer: number | undefined;

  // ---------- Pagefind（懒加载，失败即永久降级） ----------
  let pagefind: unknown = null;

  async function ensurePagefind(): Promise<any> {
    if (pagefind !== null) return pagefind;
    try {
      // 变量化的动态 import，避免打包器尝试解析这个只在构建产物里存在的路径
      const path = "/pagefind/pagefind.js";
      const mod: any = await import(/* @vite-ignore */ path);
      await mod.options({ excerptLength: 14 });
      await mod.init();
      pagefind = mod;
    } catch {
      pagefind = false;
    }
    return pagefind;
  }

  // ---------- 渲染 ----------
  function itemsOf(list: HTMLUListElement): HTMLLIElement[] {
    return Array.from(list.querySelectorAll<HTMLLIElement>(".cmdk-item"));
  }

  function setActive(list: HTMLUListElement, index: number): void {
    const items = itemsOf(list);
    if (!items.length) return;
    activeIndex = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((el, i) => {
      el.dataset.active = i === activeIndex ? "true" : "false";
    });
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function showList(list: HTMLUListElement): void {
    activeList = list;
    actionsList.hidden = list !== actionsList;
    resultsList.hidden = list !== resultsList;
    setActive(list, 0);
  }

  function renderResults(items: Item[]): void {
    resultsList.textContent = "";
    for (const it of items) {
      const li = document.createElement("li");
      li.className = "cmdk-item";
      li.dataset.url = it.url;

      const main = document.createElement("span");
      main.className = "cmdk-main";

      const title = document.createElement("span");
      title.className = "cmdk-title";
      title.textContent = it.title;
      main.appendChild(title);

      if (it.excerpt) {
        const ex = document.createElement("span");
        ex.className = "cmdk-excerpt";
        // cleanExcerpt 已把 <mark> 之外的标签剥掉，这里只可能出现 mark
        ex.innerHTML = it.excerpt;
        main.appendChild(ex);
      }

      const meta = document.createElement("span");
      meta.className = "cmdk-meta";
      meta.textContent = it.meta ?? "";

      li.append(main, meta);
      resultsList.appendChild(li);
    }

    if (!items.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = input.value.trim() ? "没有匹配的笔记" : "";
      resultsList.hidden = true;
      actionsList.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    showList(resultsList);
  }

  async function runSearch(query: string): Promise<void> {
    const pf = await ensurePagefind();
    if (!pf) {
      emptyEl.hidden = false;
      emptyEl.textContent = "搜索索引未生成（需先跑 npm run pagefind）";
      actionsList.hidden = true;
      resultsList.hidden = true;
      return;
    }
    const search = await pf.search(query);
    const data = await Promise.all(
      search.results.slice(0, 8).map((r: any) => r.data())
    );
    const items = data.map((d: any) => {
      const title = d.meta?.title || d.url;
      return {
        url: d.url,
        title,
        meta: crumbOf(d.url),
        excerpt: cleanExcerpt(d.excerpt, title),
      };
    });
    renderResults(items);
    if (countEl) {
      countEl.textContent = search.results.length
        ? `找到 ${search.results.length} 条`
        : "";
    }
  }

  // ---------- 随机一篇 ----------
  // 复用悬浮预览那份索引（键即 permalink），它通常已被空闲预取缓存；
  // 取不到时降级为「抓当前页面上的 /til/ 链接」。
  async function goRandom(): Promise<void> {
    try {
      const res = await fetch("/previews/index.json", { cache: "force-cache" });
      const data = (await res.json()) as Record<string, unknown>;
      const keys = Object.keys(data);
      if (keys.length) {
        window.location.href = keys[Math.floor(Math.random() * keys.length)];
        return;
      }
    } catch {
      /* 落到下面的降级路径 */
    }
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href*="/til/"]')
    ).filter((a) => !a.href.includes("/til/#"));
    if (links.length) {
      window.location.href = links[Math.floor(Math.random() * links.length)].href;
    }
  }

  // ---------- 开关 ----------
  function open(): void {
    root.dataset.open = "true";
    document.body.style.overflow = "hidden";
    input.value = "";
    emptyEl.hidden = true;
    showList(actionsList);
    input.focus();
  }

  function close(): void {
    root.dataset.open = "false";
    document.body.style.overflow = "";
  }

  function isOpen(): boolean {
    return root.dataset.open === "true";
  }

  // ---------- 事件 ----------
  document.addEventListener(
    "keydown",
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen() ? close() : open();
        return;
      }
      if (!isOpen()) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(activeList, activeIndex + 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(activeList, activeIndex - 1);
        return;
      }
      if (e.key === "Enter") {
        const item = itemsOf(activeList)[activeIndex];
        if (item?.dataset.cmdkRandom) {
          e.preventDefault();
          void goRandom();
          return;
        }
        const url = item?.dataset.url;
        if (url) {
          e.preventDefault();
          window.location.href = url;
        }
      }
    },
    true
  );

  input.addEventListener("input", () => {
    const q = input.value.trim();
    window.clearTimeout(debounceTimer);
    if (!q) {
      emptyEl.hidden = true;
      if (countEl) countEl.textContent = "";
      showList(actionsList);
      return;
    }
    debounceTimer = window.setTimeout(() => {
      void runSearch(q);
    }, 120);
  });

  // 面板内所有「打开」按钮
  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-cmdk-close]")) {
      close();
      return;
    }
    const item = target.closest<HTMLElement>(".cmdk-item");
    if (item?.dataset.cmdkRandom) {
      void goRandom();
      return;
    }
    if (item?.dataset.url) {
      window.location.href = item.dataset.url;
    }
  });

  // header 上的入口按钮
  document.querySelectorAll<HTMLElement>("[data-cmdk-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });
}
