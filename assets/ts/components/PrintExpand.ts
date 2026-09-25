/**
 * 打印时展开页面里的 <details>。
 *
 * 背景：/posts/ 的年份折叠、TIL 的目录折叠都是「屏幕上的收纳」，打印/导出 PDF 时若保持折叠，
 * 内容会整块丢——实测 /posts/ 展开前 963 篇只打出 39 篇（3 页）。
 *
 * 为什么不用 CSS：Chrome 在 closed <details> 上是用 shadow DOM 藏内容的，
 * @media print 里写 `details > * { display: block !important }` 实测无效
 * （2026-09-25 验证：条目数仍是 39）。只能靠 beforeprint 改 DOM。
 *
 * 两个触发都挂：beforeprint 是标准事件（Chrome/Firefox/Safari 13+ 都支持），
 * matchMedia('print') 的 change 是老 Safari 的替代路径，幂等展开所以重复触发无害。
 *
 * 打印完恢复原来的开合状态，避免关掉打印框后页面被全部展开。
 */
export function initPrintExpand(): void {
  let opened: HTMLDetailsElement[] = [];

  const expand = (): void => {
    opened = [];
    document.querySelectorAll<HTMLDetailsElement>("main details").forEach((d) => {
      if (!d.open) {
        opened.push(d);
        d.open = true;
      }
    });
  };

  const restore = (): void => {
    opened.forEach((d) => {
      d.open = false;
    });
    opened = [];
  };

  window.addEventListener("beforeprint", expand);
  window.addEventListener("afterprint", restore);

  const printQuery = window.matchMedia("print");
  printQuery.addEventListener("change", (e) => {
    if (e.matches) expand();
    else restore();
  });
}
