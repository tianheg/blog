/**
 * 站点交互脚本 —— 主题切换 + 移动端菜单。
 *
 * 只在最小必要范围内碰 DOM（零 class，全部走 data 属性）：
 *   [data-theme-toggle]  主题按钮；状态写回 aria-pressed/aria-label
 *   [data-menu-toggle]   汉堡按钮；aria-expanded 与 #mobile-menu 的 [hidden] 同步
 *
 * 主题：真正的"首绘不变色"由 <head> 里的内联脚本负责（在样式表之前定 html 的
 * class）；这里只处理点击与按钮状态。存储失败（隐私模式）不影响功能。
 */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------- 主题 ---------------- */

  var themeBtn = document.querySelector('[data-theme-toggle]');

  function effectiveTheme() {
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function syncThemeButton(theme) {
    if (!themeBtn) return;
    var isDark = theme === 'dark';
    var label = isDark ? '切换到浅色' : '切换到暗色';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
  }

  function applyTheme(theme) {
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    syncThemeButton(theme);
  }

  syncThemeButton(effectiveTheme());

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        /* 隐私模式下写不了，功能照常 */
      }
      applyTheme(next);
    });
  }

  // 没有手动选择时跟随系统变化
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onSystemChange = function () {
    if (!root.classList.contains('dark') && !root.classList.contains('light')) {
      syncThemeButton(effectiveTheme());
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);

  /* ---------------- 移动端菜单 ---------------- */

  var menuBtn = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('mobile-menu');

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var willOpen = menu.hidden;
      menu.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
      menuBtn.setAttribute('title', willOpen ? '关闭菜单' : '菜单');
    });

    // 视口变宽（回到桌面布局）时收起，避免留下一个悬空展开的菜单
    var wide = window.matchMedia('(min-width: 40rem)');
    var onWide = function (e) {
      if (e.matches && !menu.hidden) {
        menu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);

    // Esc 收起
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        menu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }
})();