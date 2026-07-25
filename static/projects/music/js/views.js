// 律谱 — 视图渲染（极简版）
// 依赖全局: navigate(), state, escapeHtml()

// 首页：曲谱列表
function renderHome() {
  const fragment = document.createDocumentFragment();

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1>全部曲谱</h1><div class="sub">共 ${getStats().total} 首</div>`;
  fragment.appendChild(header);

  fragment.appendChild(buildScoreList(SCORES));
  return fragment;
}

// 搜索
function renderSearchResults(query) {
  const results = searchScores(query);
  const fragment = document.createDocumentFragment();

  const meta = document.createElement('div');
  meta.className = 'search-meta';
  meta.innerHTML = `<div class="query">${escapeHtml(query)}</div><div class="count">${results.length} 个结果</div>`;
  fragment.appendChild(meta);

  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '没有找到匹配的曲谱';
    fragment.appendChild(empty);
  } else {
    fragment.appendChild(buildScoreList(results));
  }
  return fragment;
}

// 分类
function renderCategory(type, filter) {
  const scores = type === 'period'
    ? getScoresByPeriod(filter)
    : getScoresByDifficulty(filter);
  const fragment = document.createDocumentFragment();

  const nav = document.createElement('div');
  nav.className = 'breadcrumb';
  nav.innerHTML = `<a href="#" id="breadcrumb-home">全部</a><span>›</span><span>${escapeHtml(filter)}</span>`;
  nav.querySelector('#breadcrumb-home').addEventListener('click', e => { e.preventDefault(); navigate('home'); });
  fragment.appendChild(nav);

  const meta = document.createElement('div');
  meta.className = 'category-meta';
  meta.innerHTML = `<h1>${escapeHtml(filter)}</h1><div class="count">${scores.length} 首</div>`;
  fragment.appendChild(meta);

  fragment.appendChild(buildScoreList(scores));
  return fragment;
}

// 曲谱详情
function renderScoreDetail(scoreId) {
  const score = getScoreById(scoreId);
  const fragment = document.createDocumentFragment();

  if (!score) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '曲谱未找到';
    fragment.appendChild(empty);
    return fragment;
  }

  // 面包屑
  const nav = document.createElement('div');
  nav.className = 'breadcrumb';
  nav.innerHTML = `<a href="#" id="breadcrumb-home">全部</a><span>›</span><span>${escapeHtml(score.title)}</span>`;
  nav.querySelector('#breadcrumb-home').addEventListener('click', e => { e.preventDefault(); navigate('home'); });
  fragment.appendChild(nav);

  // 头部信息
  const header = document.createElement('div');
  header.className = 'detail-header';
  header.innerHTML = `
    <h1>${escapeHtml(score.title)}</h1>
    <div class="composer">${escapeHtml(score.composer)}${score.opus ? ` · ${escapeHtml(score.opus)}` : ''}</div>
    <div class="meta">
      <span class="badge badge-${difficultyClass(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
      <span class="badge badge-tag">${escapeHtml(score.period)}</span>
    </div>
  `;
  fragment.appendChild(header);

  // 乐谱渲染
  if (score.notation) {
    const parsed = parseNotation(score.notation);
    if (parsed && parsed.notation.length > 0) {
      fragment.appendChild(buildScoreWithMode(parsed));
    }
  } else if (score.pages && score.pages.length > 0) {
    fragment.appendChild(buildImageViewer(score));
  }

  // 说明
  if (score.notes) {
    const notes = document.createElement('div');
    notes.className = 'detail-notes';
    notes.innerHTML = `<p>${escapeHtml(score.notes)}</p>`;
    fragment.appendChild(notes);
  }

  return fragment;
}

// 构建曲谱列表
function buildScoreList(scores) {
  const list = document.createElement('div');
  list.className = 'score-list';

  if (scores.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无曲谱</div>';
    return list;
  }

  scores.forEach(score => {
    const item = document.createElement('div');
    item.className = 'score-item';
    item.innerHTML = `
      <div class="title">${escapeHtml(score.title)}</div>
      <div class="composer">${escapeHtml(score.composer)}</div>
      <div class="meta">
        <span class="badge badge-${difficultyClass(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
        <span class="badge badge-tag">${escapeHtml(score.period)}</span>
      </div>
    `;
    item.addEventListener('click', () => navigate('score', { scoreId: score.id }));
    list.appendChild(item);
  });

  return list;
}

// DSL 渲染 + 模式切换
function buildScoreWithMode(parsed) {
  const section = document.createElement('div');

  const modeBar = document.createElement('div');
  modeBar.className = 'mode-bar';
  modeBar.innerHTML = `
    <button class="mode-btn active" data-mode="simple-notation">简谱</button>
    <button class="mode-btn" data-mode="vexflow">五线谱</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container';

  function renderMode() {
    container.innerHTML = '';
    const el = buildScore(parsed);
    container.appendChild(el);
  }
  renderMode();

  modeBar.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modeBar.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      RendererAdapter.use(btn.dataset.mode);
      renderMode();
    });
  });

  section.appendChild(modeBar);
  section.appendChild(container);
  return section;
}

// 图片查看器
function buildImageViewer(score) {
  state.currentPage = 0;
  const viewer = document.createElement('div');
  viewer.className = 'image-viewer';
  viewer.innerHTML = `
    <img src="${escapeHtml(score.pages[0])}" alt="${escapeHtml(score.title)} 谱" class="viewer-image">
  `;
  // 简单图片展示，多页翻页根据需求可加
  return viewer;
}

// 辅助
function difficultyClass(d) {
  const map = { '初级': 'easy', '中级': 'medium', '高级': 'hard' };
  return map[d] || 'tag';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
