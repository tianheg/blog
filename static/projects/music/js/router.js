// 律谱 — 路由与状态管理（极简版）

// 应用根路径（初始化时确定，固定不变）
let ROOT = '/projects/music/';

function setRoot(path) {
  ROOT = path.endsWith('/') ? path : path + '/';
}

const state = {
  currentView: 'home',
  searchQuery: '',
  currentPage: 0,
  keyboardHandler: null
};

function navigate(view, params = {}) {
  cleanupKeyboard();
  state.currentView = view;

  const content = document.getElementById('content');
  content.innerHTML = '';

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.style.display = view === 'home' ? 'none' : 'flex';
  }

  switch (view) {
    case 'home':
      content.appendChild(renderHome());
      break;
    case 'search':
      content.appendChild(renderSearchResults(state.searchQuery));
      break;
    case 'period':
      content.appendChild(renderCategory('period', params.filter));
      break;
    case 'difficulty':
      content.appendChild(renderCategory('difficulty', params.filter));
      break;
    case 'score':
      content.appendChild(renderScoreDetail(params.scoreId));
      break;
  }

  // 宽度按视图分档：列表页保持窄列，详情页才需要铺开乐谱
  document.body.dataset.view = view;

  content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateTitle(view, params);

  // 用 hash 记状态：纯静态托管，深链接刷新不会 404（不需要 Worker 做 fallback）
  const hash = view === 'home'
    ? ''
    : view === 'score'
      ? `#/${params.scoreId}`
      : `#/${view}/${encodeURIComponent(params.filter || '')}`;
  history.pushState({ view, params }, '', ROOT + hash);
}

function handlePopState() {
  resolvePath(currentPath());
}

// 状态在 hash 里；顺便兼容旧链接（/projects/music/3 这种没有 # 的路径）
function currentPath() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash) return hash;
  return location.pathname.replace(ROOT, '').replace(/\/$/, '');
}

function resolvePath(path) {
  if (!path || path === '') {
    navigate('home');
  } else if (/^\d+$/.test(path)) {
    navigate('score', { scoreId: path });
  } else {
    const parts = path.split('/');
    if (parts[0] === 'search') {
      state.searchQuery = decodeURIComponent(parts[1] || '');
      navigate('search');
    } else if (parts[0] === 'period' && parts[1]) {
      navigate('period', { filter: decodeURIComponent(parts[1]) });
    } else if (parts[0] === 'difficulty' && parts[1]) {
      navigate('difficulty', { filter: decodeURIComponent(parts[1]) });
    } else {
      navigate('home');
    }
  }
}

function cleanupKeyboard() {
  if (state.keyboardHandler) {
    document.removeEventListener('keydown', state.keyboardHandler);
    state.keyboardHandler = null;
  }
}

function updateTitle(view, params) {
  const base = '律谱';
  switch (view) {
    case 'search':
      document.title = `"${state.searchQuery}" — ${base}`;
      break;
    case 'period':
    case 'difficulty':
      document.title = `${params.filter} — ${base}`;
      break;
    case 'score':
      const s = getScoreById(params.scoreId);
      document.title = s ? `${s.title} — ${base}` : base;
      break;
    default:
      document.title = base;
  }
}

function debounce(fn, delay) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}
