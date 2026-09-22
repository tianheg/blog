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

  content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateTitle(view, params);

  // 更新 URL（pushState 保持无 # 历史记录，使用固定 ROOT）
  const url = view === 'home' ? ROOT : view === 'score' ? `${ROOT}${params.scoreId}` : `${ROOT}${view}/${encodeURIComponent(params.filter || '')}`;
  history.pushState({ view, params }, '', url);
}

function handlePopState(e) {
  const path = location.pathname.replace(ROOT, '');
  resolvePath(path);
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
