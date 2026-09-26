import { initPagePreview } from "./components/PagePreview";
import { initCommandPalette } from "./components/CommandPalette";
import { initPrintExpand } from "./components/PrintExpand";
import { initThemeToggle } from "./components/ThemeToggle";

// 打印展开只挂 window 事件、真正的 DOM 查询发生在打印时，所以不必等 DOMContentLoaded。
// 放在模块顶层而不是下面的回调里：那个回调一旦被前面的 init 抛异常打断，
// 打印处理就永远不会注册（2026-09-25 实测就是这么失效的）。
initPrintExpand();

window.addEventListener(
  "DOMContentLoaded",
  () => {
    initPagePreview();
    initCommandPalette();
    initThemeToggle();
  },
  { once: true }
);
