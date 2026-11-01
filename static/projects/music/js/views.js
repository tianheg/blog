// 律谱 — 视图渲染
// 依赖全局: navigate(), state, escapeHtml(), RendererAdapter, AudioPlayer

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

  // 乐谱渲染：三种来源 —— 打印谱(scribe) / DSL 简谱 / 图片
  if (score.renderer === 'scribe' && score.scribeData) {
    fragment.appendChild(buildScribeScore(score));
  } else if (score.notation) {
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

// 构建曲谱列表（网格卡片 + 封面）
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

    const cover = score.cover
      ? `<img class="cover" src="${escapeHtml(score.cover)}" alt="" loading="lazy">`
      : `<div class="cover cover-empty">${escapeHtml(score.title.slice(0, 2))}</div>`;

    item.innerHTML = `
      ${cover}
      <div class="info">
        <div class="title">${escapeHtml(score.title)}</div>
        <div class="composer">${escapeHtml(score.composer)}</div>
        <div class="meta">
          <span class="badge badge-${difficultyClass(score.difficulty)}">${escapeHtml(score.difficulty)}</span>
          <span class="badge badge-tag">${escapeHtml(score.period)}</span>
        </div>
      </div>
    `;
    item.addEventListener('click', () => navigate('score', { scoreId: score.id }));
    list.appendChild(item);
  });

  return list;
}

// ── DSL 曲目：简谱 / 五线谱 + 播放（带音符高亮跟随）──────────────
function buildScoreWithMode(parsed) {
  const section = document.createElement('div');

  const modeBar = document.createElement('div');
  modeBar.className = 'mode-bar';
  modeBar.innerHTML = `
    <button class="mode-btn active" data-mode="simple-notation">简谱</button>
    <button class="mode-btn" data-mode="vexflow">五线谱</button>
    <button class="play-btn" id="play-btn">▶ 播放</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container';

  const scoreData = parseScoreData(parsed);
  const playBtn = modeBar.querySelector('#play-btn');

  let playing = false;
  let noteEls = [];

  // SN 是异步渲染的（懒加载 + loadData），轮询到 SVG 出来为止
  function collectNotes(retry = 0) {
    noteEls = [...container.querySelectorAll('svg text')]
      .filter(t => t.getAttribute('font-size') === '18' && t.textContent.trim() !== '');
    if (!noteEls.length && retry < 40) setTimeout(() => collectNotes(retry + 1), 100);
  }

  function clearHighlight() {
    noteEls.forEach(t => t.classList.remove('hl'));
  }

  function renderMode() {
    container.innerHTML = '';
    const el = buildScore(parsed);
    container.appendChild(el);
    collectNotes();
  }
  renderMode();

  modeBar.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (AudioPlayer.playing) stopPlayback();
      modeBar.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      RendererAdapter.use(btn.dataset.mode);
      renderMode();
    });
  });

  function stopPlayback() {
    AudioPlayer.stop();
    playing = false;
    clearHighlight();
    playBtn.textContent = '▶ 播放';
  }

  playBtn.addEventListener('click', () => {
    if (playing) { stopPlayback(); return; }

    clearHighlight();
    AudioPlayer.play(scoreData, {
      onNote(index) {
        const el = noteEls[index];
        if (!el) return;
        noteEls.forEach(t => t.classList.remove('hl'));
        el.classList.add('hl');
        // 播到屏幕外时跟一下
        const box = el.getBoundingClientRect();
        if (box.top < 80 || box.bottom > window.innerHeight - 40) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      onEnd() {
        playing = false;
        clearHighlight();
        playBtn.textContent = '▶ 播放';
      }
    });

    playing = true;
    playBtn.textContent = '⏹ 停止';
  });

  section.appendChild(modeBar);
  section.appendChild(container);
  return section;
}

// ── 打印谱：Scribe 渲染 + 播放 + 打印 ───────────────────────────
function buildScribeScore(score) {
  const section = document.createElement('div');

  const bar = document.createElement('div');
  bar.className = 'mode-bar';
  bar.innerHTML = `
    <span class="mode-tag">打印谱 · Scribe</span>
    <button class="play-btn" id="play-btn">▶ 播放</button>
    <button class="print-btn" id="print-btn">打印</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container scribe-container';
  RendererAdapter.backends.scribe.render(container, { src: score.scribeData, clef: 'treble' });

  const playBtn = bar.querySelector('#play-btn');
  const printBtn = bar.querySelector('#print-btn');
  let playing = false;

  playBtn.addEventListener('click', () => {
    if (playing) {
      AudioPlayer.stop();
      playing = false;
      playBtn.textContent = '▶ 播放';
      return;
    }
    AudioPlayer.playStream(`${ROOT}${score.scribeData}`, {
      onEnd() {
        playing = false;
        playBtn.textContent = '▶ 播放';
      }
    });
    playing = true;
    playBtn.textContent = '⏹ 停止';
  });

  printBtn.addEventListener('click', () => window.print());

  section.appendChild(bar);
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
  return viewer;
}

// 辅助
function difficultyClass(d) {
  const map = { '初级': 'easy', '中级': 'medium', '高级': 'hard' };
  return map[d] || 'tag';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : text;
  return div.innerHTML;
}
