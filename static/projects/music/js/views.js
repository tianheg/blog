// 律谱 — 视图渲染
// 依赖全局: navigate(), state, escapeHtml(), AbcScore

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
  if (score.abcData) {
    fragment.appendChild(buildAbcScore(score));
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

// ── 五线谱：ABC 真源 → abcjs 渲染 + 播放（可调速/标注）+ 热敏打印 ──
function buildAbcScore(score) {
  const section = document.createElement('div');

  const bar = document.createElement('div');
  bar.className = 'mode-bar';
  bar.innerHTML = `
    <a class="print-btn" id="netease-btn" target="_blank" rel="noopener noreferrer"
       title="在网易云音乐听这首曲子">网易云</a>
    <button class="print-btn" id="print-btn" title="导出 72mm 热敏版式 PDF">热敏打印</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container abc-container';

  section.appendChild(bar);
  section.appendChild(container);

  const neteaseBtn = bar.querySelector('#netease-btn');
  const nq = [score.title, score.composer].filter(Boolean).join(' ');
  neteaseBtn.href = score.netease
    || `https://music.163.com/#/search/m/?s=${encodeURIComponent(nq)}&type=1`;

  const printBtn = bar.querySelector('#print-btn');

  (async () => {
    try {
      const url = new URL(score.abcData, document.baseURI).href;
      const abcText = await (await fetch(url)).text();

      // 窄屏按每行 1-2 小节重排：不动换行的话，56 小节压进 330px 后音符只有 3px 高
      const vw = window.innerWidth || 390;
      const narrow = vw < 480;
      const reflowed = narrow ? AbcScore.reflowAbc(abcText, 1) : abcText;
      // 先连符杠再标唱名：唱名会给每个 token 加 "do" 前缀，顺序反了括号就对不上
      const beamed = AbcScore.applyBeaming(reflowed);
      const base = AbcScore.annotate(beamed, 'solf');
      const opts = narrow
        ? { staffwidth: 250, scale: 1.02, responsive: false }
        : { responsive: 'resize', staffwidth: Math.min(900, vw - 40) };

      await AbcScore.render(container, base, opts);

      printBtn.addEventListener('click', async () => {
        if (printBtn.disabled) return;
        printBtn.disabled = true;
        const label = printBtn.textContent;
        printBtn.textContent = '生成中…';
        try {
          const { cm } = await AbcScore.exportThermalPdf(abcText, score.title);
          printBtn.textContent = `已导出 ${cm} cm`;
          setTimeout(() => { printBtn.textContent = label; printBtn.disabled = false; }, 2500);
        } catch (err) {
          console.error('[print]', err);
          printBtn.textContent = '导出失败';
          setTimeout(() => { printBtn.textContent = label; printBtn.disabled = false; }, 2500);
        }
      });
    } catch (err) {
      console.error('[abc]', err);
      container.textContent = '乐谱加载失败：' + (err && err.message ? err.message : err);
    }
  })();

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
