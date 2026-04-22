// 律谱 - 钢琴乐谱应用
// 移动端优先的 SPA 实现

// 状态管理
const state = {
  currentView: 'home', // home, score, search, period, difficulty
  selectedScore: null,
  searchQuery: '',
  filter: null,
  currentPage: 0,
  isMenuOpen: false
};

// DOM 元素
let app, sidebar, overlay;

// 初始化应用
function init() {
  app = document.getElementById('app');
  renderLayout();
  bindEvents();
  navigate('home');
}

// 渲染整体布局
function renderLayout() {
  const stats = getStats();
  const periods = getPeriods();
  const difficulties = getDifficulties();
  
  app.innerHTML = `
    <a href="#main" class="skip-link">跳转到主内容</a>
    
    <!-- 遮罩层 -->
    <div class="overlay" id="overlay"></div>
    
    <!-- 导航侧边栏 -->
    <aside class="nav-sidebar" id="nav-sidebar" aria-label="主导航">
      <div class="nav-header">
        <div class="logo">
          <span class="logo-icon">♪</span>
          <span>律谱</span>
        </div>
        <button class="nav-close-btn" id="nav-close-btn" aria-label="关闭菜单">✕</button>
      </div>
      
      <div class="nav-content">
        <nav class="nav-section" aria-label="浏览">
          <div class="nav-section-title">浏览</div>
          <ul class="nav-menu">
            <li class="nav-item">
              <a href="#" class="nav-link" data-view="home" aria-current="page">
                <span class="nav-icon">🏠</span>
                <span>首页</span>
              </a>
            </li>
            <li class="nav-item">
              <a href="#" class="nav-link" data-view="search">
                <span class="nav-icon">🔍</span>
                <span>搜索</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <nav class="nav-section" aria-label="时期">
          <div class="nav-section-title">时期</div>
          <ul class="nav-menu" id="period-menu">
            ${periods.map(([name, count]) => `
              <li class="nav-item">
                <a href="#" class="nav-link" data-view="period" data-filter="${escapeHtml(name)}">
                  <span class="nav-icon">🎼</span>
                  <span>${escapeHtml(name)}</span>
                  <span class="nav-count">${count}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </nav>
        
        <nav class="nav-section" aria-label="难度">
          <div class="nav-section-title">难度</div>
          <ul class="nav-menu" id="difficulty-menu">
            ${difficulties.map(([name, count]) => `
              <li class="nav-item">
                <a href="#" class="nav-link" data-view="difficulty" data-filter="${escapeHtml(name)}">
                  <span class="nav-icon">${getDifficultyIcon(name)}</span>
                  <span>${escapeHtml(name)}</span>
                  <span class="nav-count">${count}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </nav>
      </div>
      
      <footer class="nav-footer">
        <div>共 ${stats.total} 首曲谱</div>
        <div style="margin-top: 0.25rem; opacity: 0.7;">${stats.composers} 位作曲家</div>
      </footer>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content" id="main-content">
      <header class="top-nav" role="banner">
        <button class="menu-toggle" id="menu-toggle" aria-label="打开菜单" aria-expanded="false" aria-controls="nav-sidebar">
          <span>☰</span>
        </button>
        
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="search" class="search-input" id="search-input" 
                 placeholder="搜索曲谱、作曲家..." 
                 autocomplete="off"
                 aria-label="搜索曲谱">
          <button class="search-clear" id="search-clear" aria-label="清除搜索">✕</button>
        </div>
      </header>
      
      <div class="content-area" id="content-area" role="main" tabindex="-1">
        <!-- 动态内容 -->
      </div>
      
      <footer class="page-footer">
        <p>律谱 - 钢琴乐谱收藏</p>
      </footer>
    </main>
  `;
  
  // 缓存 DOM 引用
  sidebar = document.getElementById('nav-sidebar');
  overlay = document.getElementById('overlay');
}

// 绑定事件
function bindEvents() {
  // 菜单切换
  document.getElementById('menu-toggle').addEventListener('click', toggleMenu);
  document.getElementById('nav-close-btn').addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  
  // 导航链接
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const view = link.dataset.view;
      const filter = link.dataset.filter;
      
      closeMenu();
      
      setTimeout(() => {
        if (view === 'period' || view === 'difficulty') {
          navigate(view, { filter });
        } else {
          navigate(view);
        }
      }, 50);
    });
  });
  
  // 搜索
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  
  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim();
    searchClear.classList.toggle('visible', query.length > 0);
    
    if (query) {
      state.searchQuery = query;
      navigate('search');
    } else {
      navigate('home');
    }
  }, 300));
  
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      navigate('search');
    }
  });
  
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    navigate('home');
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // ESC 关闭菜单
    if (e.key === 'Escape') {
      closeMenu();
    }
    
    // / 聚焦搜索
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
  
  // 触摸滑动支持
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;
    
    // 从左边缘右滑打开菜单
    if (diff > swipeThreshold && touchStartX < 50) {
      openMenu();
    }
    
    // 左滑关闭菜单
    if (diff < -swipeThreshold && state.isMenuOpen) {
      closeMenu();
    }
  }
}

// 切换菜单
function toggleMenu() {
  if (state.isMenuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

// 打开菜单
function openMenu() {
  state.isMenuOpen = true;
  sidebar.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  const toggleBtn = document.getElementById('menu-toggle');
  toggleBtn.setAttribute('aria-expanded', 'true');
  
  // 聚焦到关闭按钮，提升可访问性
  setTimeout(() => {
    document.getElementById('nav-close-btn')?.focus();
  }, 100);
}

// 关闭菜单
function closeMenu() {
  state.isMenuOpen = false;
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  
  const toggleBtn = document.getElementById('menu-toggle');
  toggleBtn.setAttribute('aria-expanded', 'false');
}

// 导航
function navigate(view, params = {}) {
  state.currentView = view;
  
  // 更新导航激活状态
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    
    if (link.dataset.view === view) {
      if (!params.filter || link.dataset.filter === params.filter) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    }
  });
  
  // 渲染对应视图
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = '';
  
  switch (view) {
    case 'home':
      contentArea.appendChild(renderHome());
      break;
    case 'search':
      contentArea.appendChild(renderSearchResults(state.searchQuery));
      break;
    case 'period':
      contentArea.appendChild(renderCategory('period', params.filter));
      break;
    case 'difficulty':
      contentArea.appendChild(renderCategory('difficulty', params.filter));
      break;
    case 'score':
      contentArea.appendChild(renderScoreDetail(params.scoreId));
      break;
  }
  
  // 滚动到顶部
  contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // 更新页面标题
  updatePageTitle(view, params);
}

// 渲染首页
function renderHome() {
  const stats = getStats();
  const recentScores = [...SCORES].reverse().slice(0, 6);
  
  const fragment = document.createDocumentFragment();
  
  // Hero 区域
  const hero = document.createElement('section');
  hero.className = 'hero-section';
  hero.innerHTML = `
    <h1 class="hero-title">发现钢琴之美</h1>
    <p class="hero-subtitle">探索经典与现代的钢琴乐谱，开启您的音乐之旅</p>
  `;
  fragment.appendChild(hero);
  
  // 统计
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${stats.total}</div>
      <div class="stat-label">曲谱</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.composers}</div>
      <div class="stat-label">作曲家</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.periods}</div>
      <div class="stat-label">时期</div>
    </div>
  `;
  fragment.appendChild(statsGrid);
  
  // 最近添加
  const recentSection = document.createElement('section');
  recentSection.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">最近添加</h2>
      <button class="view-all-btn" data-action="view-all">查看全部</button>
    </div>
  `;
  recentSection.appendChild(renderScoreGrid(recentScores));
  
  recentSection.querySelector('[data-action="view-all"]').addEventListener('click', () => {
    navigate('search');
    document.getElementById('search-input').focus();
  });
  
  fragment.appendChild(recentSection);
  
  return fragment;
}

// 渲染曲谱网格
function renderScoreGrid(scores) {
  const grid = document.createElement('div');
  grid.className = 'score-grid';
  
  if (scores.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🎼</div>
        <div>暂无曲谱</div>
      </div>
    `;
    return grid;
  }
  
  scores.forEach(score => {
    const card = document.createElement('article');
    card.className = 'score-card';
    card.innerHTML = `
      <img src="${escapeHtml(score.cover)}" 
           alt="${escapeHtml(score.title)} 封面" 
           class="score-cover"
           loading="lazy">
      <div class="score-info">
        <h3 class="score-title">${escapeHtml(score.title)}</h3>
        <p class="score-composer">${escapeHtml(score.composer)}${score.opus ? ` · ${escapeHtml(score.opus)}` : ''}</p>
        <div class="score-meta">
          <span class="difficulty-badge difficulty-${escapeHtml(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
          <span class="period-tag">${escapeHtml(score.period)}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      navigate('score', { scoreId: score.id });
    });
    
    grid.appendChild(card);
  });
  
  return grid;
}

// 渲染列表视图
function renderScoreList(scores) {
  const list = document.createElement('div');
  list.className = 'score-list';
  
  if (scores.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎼</div>
        <div>暂无曲谱</div>
      </div>
    `;
    return list;
  }
  
  scores.forEach(score => {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <img src="${escapeHtml(score.cover)}" 
           alt="" 
           class="list-cover"
           loading="lazy">
      <div class="list-info">
        <h3 class="list-title">${escapeHtml(score.title)}</h3>
        <p class="list-composer">${escapeHtml(score.composer)}</p>
        <div class="list-meta">
          <span class="difficulty-badge difficulty-${escapeHtml(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
          <span class="period-tag">${escapeHtml(score.period)}</span>
        </div>
      </div>
      <span class="list-arrow">›</span>
    `;
    
    item.addEventListener('click', () => {
      navigate('score', { scoreId: score.id });
    });
    
    list.appendChild(item);
  });
  
  return list;
}

// 渲染搜索结果
function renderSearchResults(query) {
  const results = searchScores(query);
  const fragment = document.createDocumentFragment();
  
  const header = document.createElement('div');
  header.className = 'search-results-header';
  header.innerHTML = `
    <h1 class="search-query">"${escapeHtml(query)}"</h1>
    <p class="search-count">找到 ${results.length} 个结果</p>
  `;
  fragment.appendChild(header);
  
  if (results.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <div class="no-results-icon">🔍</div>
      <h2 class="no-results-title">未找到相关曲谱</h2>
      <p class="no-results-text">试试其他关键词，或浏览分类</p>
    `;
    fragment.appendChild(noResults);
  } else {
    fragment.appendChild(renderScoreGrid(results));
  }
  
  return fragment;
}

// 渲染分类页面
function renderCategory(type, filter) {
  const scores = type === 'period' 
    ? getScoresByPeriod(filter) 
    : getScoresByDifficulty(filter);
  
  const fragment = document.createDocumentFragment();
  
  // 面包屑
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', '面包屑');
  breadcrumb.innerHTML = `
    <a href="#" data-nav="home">首页</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">${escapeHtml(filter)}</span>
  `;
  breadcrumb.querySelector('[data-nav="home"]').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('home');
  });
  fragment.appendChild(breadcrumb);
  
  // 标题
  const header = document.createElement('div');
  header.className = 'category-header';
  header.innerHTML = `
    <h1 class="category-title">${escapeHtml(filter)}</h1>
    <p class="category-subtitle">共 ${scores.length} 首曲谱</p>
  `;
  fragment.appendChild(header);
  
  fragment.appendChild(renderScoreGrid(scores));
  
  return fragment;
}

// 渲染曲谱详情
function renderScoreDetail(scoreId) {
  const score = getScoreById(scoreId);
  
  if (!score) {
    const error = document.createElement('div');
    error.className = 'empty-state';
    error.innerHTML = `
      <div class="empty-icon">❓</div>
      <div>曲谱未找到</div>
      <button class="btn btn-primary" style="margin-top: 1rem;" onclick="navigate('home')">返回首页</button>
    `;
    return error;
  }
  
  state.currentPage = 0;
  
  const fragment = document.createDocumentFragment();
  
  // 面包屑
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', '面包屑');
  breadcrumb.innerHTML = `
    <a href="#" data-nav="home">首页</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">${escapeHtml(score.title)}</span>
  `;
  breadcrumb.querySelector('[data-nav="home"]').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('home');
  });
  fragment.appendChild(breadcrumb);
  
  // 详情头部
  const detailHeader = document.createElement('header');
  detailHeader.className = 'detail-header';
  detailHeader.innerHTML = `
    <img src="${escapeHtml(score.cover)}" 
         alt="${escapeHtml(score.title)} 封面" 
         class="detail-cover">
    <div class="detail-info">
      <h1 class="detail-title">${escapeHtml(score.title)}</h1>
      <p class="detail-composer">${escapeHtml(score.composer)}${score.opus ? ` · ${escapeHtml(score.opus)}` : ''}</p>
      <div class="detail-meta">
        <span class="difficulty-badge difficulty-${escapeHtml(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
        <span class="detail-tag">${escapeHtml(score.period)}</span>
        ${score.tags.map(tag => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <p class="detail-notes">${escapeHtml(score.notes)}</p>
      <div class="detail-actions">
        <button class="btn btn-primary" id="btn-view">
          <span>👁</span> 查看乐谱
        </button>
        <button class="btn btn-secondary" onclick="history.back()">
          <span>←</span> 返回
        </button>
      </div>
    </div>
  `;
  fragment.appendChild(detailHeader);
  
  // 图片查看器
  const viewer = document.createElement('div');
  viewer.className = 'image-viewer';
  viewer.innerHTML = `
    <div class="viewer-toolbar">
      <span class="viewer-title">${escapeHtml(score.title)}</span>
      <div class="viewer-controls">
        <button class="viewer-btn" id="viewer-zoom-out" aria-label="缩小">−</button>
        <button class="viewer-btn" id="viewer-zoom-in" aria-label="放大">+</button>
        <button class="viewer-btn" id="viewer-fullscreen" aria-label="全屏">⛶</button>
      </div>
    </div>
    <div class="viewer-content" id="viewer-content">
      <button class="viewer-nav prev" id="viewer-prev" aria-label="上一页">‹</button>
      <img src="${escapeHtml(score.pages[state.currentPage])}" 
           alt="乐谱第 ${state.currentPage + 1} 页" 
           class="viewer-image"
           id="viewer-image">
      <button class="viewer-nav next" id="viewer-next" aria-label="下一页">›</button>
    </div>
    <div class="viewer-pagination">
      第 <span id="current-page">${state.currentPage + 1}</span> / <span id="total-pages">${score.pages.length}</span> 页
    </div>
  `;
  
  // 查看器控制
  const updateViewer = () => {
    const img = viewer.querySelector('#viewer-image');
    const currentPageEl = viewer.querySelector('#current-page');
    const prevBtn = viewer.querySelector('#viewer-prev');
    const nextBtn = viewer.querySelector('#viewer-next');
    
    img.src = score.pages[state.currentPage];
    img.alt = `乐谱第 ${state.currentPage + 1} 页`;
    currentPageEl.textContent = state.currentPage + 1;
    
    prevBtn.disabled = state.currentPage === 0;
    nextBtn.disabled = state.currentPage >= score.pages.length - 1;
  };
  
  viewer.querySelector('#viewer-prev').addEventListener('click', () => {
    if (state.currentPage > 0) {
      state.currentPage--;
      updateViewer();
    }
  });
  
  viewer.querySelector('#viewer-next').addEventListener('click', () => {
    if (state.currentPage < score.pages.length - 1) {
      state.currentPage++;
      updateViewer();
    }
  });
  
  // 键盘导航
  const handleKeyNav = (e) => {
    if (e.key === 'ArrowLeft' && state.currentPage > 0) {
      state.currentPage--;
      updateViewer();
    } else if (e.key === 'ArrowRight' && state.currentPage < score.pages.length - 1) {
      state.currentPage++;
      updateViewer();
    }
  };
  
  document.addEventListener('keydown', handleKeyNav);
  
  // 清理事件监听
  viewer.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyNav);
  });
  
  // 触摸滑动翻页
  let touchStartX = 0;
  const viewerContent = viewer.querySelector('#viewer-content');
  
  viewerContent.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  viewerContent.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && state.currentPage > 0) {
        state.currentPage--;
        updateViewer();
      } else if (diff < 0 && state.currentPage < score.pages.length - 1) {
        state.currentPage++;
        updateViewer();
      }
    }
  }, { passive: true });
  
  // 滚轮缩放
  let scale = 1;
  const img = viewer.querySelector('#viewer-image');
  
  viewer.querySelector('#viewer-zoom-in').addEventListener('click', () => {
    scale = Math.min(scale + 0.2, 3);
    img.style.transform = `scale(${scale})`;
  });
  
  viewer.querySelector('#viewer-zoom-out').addEventListener('click', () => {
    scale = Math.max(scale - 0.2, 0.5);
    img.style.transform = `scale(${scale})`;
  });
  
  // 全屏
  viewer.querySelector('#viewer-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      viewerContent.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });
  
  // 初始状态
  updateViewer();
  
  // 默认隐藏查看器，点击按钮后显示
  viewer.style.display = 'none';
  detailHeader.querySelector('#btn-view').addEventListener('click', () => {
    viewer.style.display = 'block';
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  
  fragment.appendChild(viewer);
  
  return fragment;
}

// 更新页面标题
function updatePageTitle(view, params = {}) {
  const baseTitle = '律谱 - 钢琴乐谱';
  let title = baseTitle;
  
  switch (view) {
    case 'home':
      title = baseTitle;
      break;
    case 'search':
      title = `"${state.searchQuery}" 的搜索结果 - ${baseTitle}`;
      break;
    case 'period':
    case 'difficulty':
      title = `${params.filter} - ${baseTitle}`;
      break;
    case 'score':
      const score = getScoreById(params.scoreId);
      if (score) {
        title = `${score.title} - ${score.composer} - ${baseTitle}`;
      }
      break;
  }
  
  document.title = title;
}

// 辅助函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function getDifficultyIcon(difficulty) {
  const icons = {
    '初级': '⭐',
    '中级': '⭐⭐',
    '高级': '⭐⭐⭐'
  };
  return icons[difficulty] || '📄';
}

// 启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}