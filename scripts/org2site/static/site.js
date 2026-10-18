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
  /* ---------------- 随机一篇（/til/） ---------------- */
  // 列表由服务端写在 <script id="til-urls" type="application/json"> 里；
  // 按钮默认 hidden，能读到列表才显示 —— 无 JS 时不会出现一个点了没反应的按钮。
  var rndBtn = document.querySelector('[data-random-til]');
  var rndData = document.getElementById('til-urls');
  if (rndBtn && rndData) {
    var urls = [];
    try {
      urls = JSON.parse(rndData.textContent);
    } catch (e) {
      urls = [];
    }
    if (urls.length) {
      rndBtn.hidden = false;
      rndBtn.addEventListener('click', function () {
        window.location.href = urls[Math.floor(Math.random() * urls.length)];
      });
    }
  }

  /* -------- 分类页分组筛选（/til/<cat>/，只在有 #+HEADER 的分类页有按钮） -------- */
  // 原站是内联 onclick（toggleHeader/showAllHeaders）；这里走事件委托，
  // 小屏用顶部 chips、≥1400px 用右栏，两组按钮共用同一套 data-header-btn。
  var sections = document.querySelectorAll('[data-header]');
  if (sections.length) {
    var btns = function () {
      return document.querySelectorAll('[data-header-btn], [data-headers-all]');
    };
    var clearActive = function () {
      Array.prototype.forEach.call(btns(), function (b) { b.classList.remove('is-active'); });
    };
    var showAll = function () {
      Array.prototype.forEach.call(sections, function (s) { s.style.display = ''; });
      clearActive();
    };
    var apply = function (name) {
      var target = null;
      Array.prototype.forEach.call(sections, function (s) {
        if (s.getAttribute('data-header') === name) target = s;
      });
      if (!target) return;
      var visible = Array.prototype.filter.call(sections, function (s) {
        return s.style.display !== 'none';
      });
      // 再点一次当前分组 = 取消筛选（与原站行为一致）
      if (visible.length === 1 && visible[0] === target) { showAll(); return; }
      Array.prototype.forEach.call(sections, function (s) {
        s.style.display = (s === target) ? '' : 'none';
      });
      clearActive();
      Array.prototype.forEach.call(document.querySelectorAll('[data-header-btn]'), function (b) {
        if (b.getAttribute('data-header-btn') === name) b.classList.add('is-active');
      });
    };
    document.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el !== document.body) {
        if (el.hasAttribute && el.hasAttribute('data-header-btn')) {
          apply(el.getAttribute('data-header-btn'));
          return;
        }
        if (el.hasAttribute && el.hasAttribute('data-headers-all')) {
          showAll();
          return;
        }
        el = el.parentElement;
      }
    });
  }
})();
