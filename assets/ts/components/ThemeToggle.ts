/* 深浅色切换（2026-09-26）
   状态有两半，缺一不可：
   1. <html> 的 .dark/.light —— `dark:` 变体认它（@custom-variant，见 main.css）
   2. color-scheme（由 .dark/.light 的 CSS 规则给出）—— light-dark() 那套 token 认它
   首帧由 head/theme-init.html 的内联脚本决定（避免闪白），这里只管点击与跟随系统。 */

const KEY = "theme";

function storedTheme(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // 隐私模式/禁用存储
  }
}

export function initThemeToggle(): void {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const isDark = () => root.classList.contains("dark");

  const sync = () => {
    const dark = isDark();
    const label = dark ? "切换到亮色" : "切换到暗色";
    root.dataset.theme = dark ? "dark" : "light";
    if (btn) {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
  };

  const set = (dark: boolean) => {
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    sync();
  };

  sync();

  btn?.addEventListener("click", () => {
    const dark = !isDark();
    set(dark);
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* 存不了就只在本次会话生效 */
    }
  });

  // 手选过就不再跟随系统；没手选时系统切浅/深要跟着走
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (storedTheme()) return;
    set(e.matches);
  });
}
