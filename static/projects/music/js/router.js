// 律谱 — 路由与状态管理（极简版）

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

  // 显示/隐藏返回按钮
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
