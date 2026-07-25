// 律谱 — 极简入口
// 加载顺序: data.js → data-service.js → notation-parser.js → simple-notation → renderer-adapter → notation-converter → renderer-adapter-vexflow.js → router.js → views.js → app.js

let contentEl;

function init() {
  const app = document.getElementById('app');
  renderShell(app);
  contentEl = document.getElementById('content');
  navigate('home');
}

function renderShell(app) {
  app.innerHTML = `
    <header class="top-bar" id="top-bar">
      <button class="back-btn" id="back-btn" aria-label="返回" style="display:none;">←</button>
      <span class="logo" id="logo">律谱</span>
      <div class="search-box" id="search-box">
        <span class="search-icon">⌕</span>
        <input type="search" id="search-input"
               placeholder="搜索曲谱、作曲家..."
               autocomplete="off"
               aria-label="搜索">
      </div>
    </header>
    <main class="content" id="content"></main>
  `;

  // 返回按钮
  document.getElementById('back-btn').addEventListener('click', () => navigate('home'));

  // 搜索
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(e => {
    const q = e.target.value.trim();
    if (q) {
      state.searchQuery = q;
      navigate('search');
    } else {
      navigate('home');
    }
  }, 300));
}

// 启动
window.addEventListener('popstate', handlePopState);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    resolvePath(location.pathname.replace(basePath(), ''));
  });
} else {
  init();
  resolvePath(location.pathname.replace(basePath(), ''));
}
