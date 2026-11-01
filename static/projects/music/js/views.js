// 律谱 — 视图渲染
// 依赖全局: navigate(), state, escapeHtml(), AbcScore, AudioPlayer

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

// ── 五线谱：ABC 真源 → abcjs 渲染 + 播放 + 72mm PDF ──────────────
function buildAbcScore(score) {
  const section = document.createElement('div');

  const bar = document.createElement('div');
  bar.className = 'mode-bar';
  bar.innerHTML = `
    <button class="play-btn" id="play-btn" disabled>▶ 播放</button>
    <button class="print-btn" id="pdf-btn" title="导出 72mm 宽 PDF（热敏打印机满宽）" disabled>PDF</button>
    <button class="print-btn" id="print-btn">打印</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container abc-container';

  section.appendChild(bar);
  section.appendChild(container);

  const playBtn = bar.querySelector('#play-btn');
  const pdfBtn = bar.querySelector('#pdf-btn');
  const printBtn = bar.querySelector('#print-btn');
  let playing = false;
  let abcText = '';

  printBtn.addEventListener('click', () => window.print());

  (async () => {
    try {
      const url = new URL(score.abcData, document.baseURI).href;
      abcText = await (await fetch(url)).text();
      // 页面已有标题和作曲家，ABC 里的 T:/C: 再画一遍就重复了
      const forRender = abcText.split('\n').filter(l => !/^[TC]:/.test(l)).join('\n');
      await AbcScore.render(container, forRender, { responsive: 'resize', staffwidth: 900 });
      playBtn.disabled = false;
      pdfBtn.disabled = false;

      const { notes, bpm } = AbcScore.toNotes(abcText);
      const noteEls = [...container.querySelectorAll('.abcjs-note, g.abcjs-note')];

      const clearHl = () => noteEls.forEach(el => el.classList.remove('hl'));

      playBtn.addEventListener('click', () => {
        if (playing) {
          AudioPlayer.stop();
          playing = false;
          clearHl();
          playBtn.textContent = '▶ 播放';
          return;
        }
        clearHl();
        AudioPlayer.playNotes(notes, bpm, {
          onNote(index) {
            noteEls.forEach(el => el.classList.remove('hl'));
            const el = noteEls[index];
            if (el) {
              el.classList.add('hl');
              const box = el.getBoundingClientRect();
              if (box.top < 80 || box.bottom > window.innerHeight - 40) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          },
          onEnd() {
            playing = false;
            clearHl();
            playBtn.textContent = '▶ 播放';
          },
        });
        playing = true;
        playBtn.textContent = '⏹ 停止';
      });

      pdfBtn.addEventListener('click', async () => {
        if (pdfBtn.disabled) return;
        pdfBtn.disabled = true;
        const label = pdfBtn.textContent;
        pdfBtn.textContent = '生成中…';
        if (playing) { AudioPlayer.stop(); playing = false; clearHl(); playBtn.textContent = '▶ 播放'; }
        try {
          const { cm } = await AbcScore.exportThermalPdf(abcText, score.title);
          pdfBtn.textContent = `已导出 ${cm} cm`;
          setTimeout(() => { pdfBtn.textContent = label; pdfBtn.disabled = false; }, 2500);
        } catch (err) {
          console.error('[pdf]', err);
          pdfBtn.textContent = '导出失败';
          setTimeout(() => { pdfBtn.textContent = label; pdfBtn.disabled = false; }, 2500);
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
