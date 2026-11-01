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
      fragment.appendChild(buildScoreWithMode(parsed, score));
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
function buildScoreWithMode(parsed, score) {
  const section = document.createElement('div');

  const modeBar = document.createElement('div');
  modeBar.className = 'mode-bar';
  modeBar.innerHTML = `
    <button class="mode-btn active" data-mode="simple-notation">简谱</button>
    <button class="mode-btn" data-mode="vexflow">五线谱</button>
    <button class="play-btn" id="play-btn">▶ 播放</button>
    <button class="print-btn" id="thermal-btn" title="导出 576 dots 单色图，用芯烨 App 打">热敏</button>
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

  // 热敏导出：重排成 576 dots（A160M 打印宽度）宽、每行 2 小节，二值化成 1-bit PNG
  const thermalBtn = modeBar.querySelector('#thermal-btn');
  thermalBtn.addEventListener('click', async () => {
    if (thermalBtn.disabled) return;
    thermalBtn.disabled = true;
    const label = thermalBtn.textContent;
    thermalBtn.textContent = '生成中…';
    if (AudioPlayer.playing) stopPlayback();
    try {
      const { blob, height } = await exportThermal(parsed, scoreData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(score && score.title) || 'score'}-热敏.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      thermalBtn.textContent = `已导出 ${Math.round(height / 203 * 25.4 / 10)} cm`;
      setTimeout(() => { thermalBtn.textContent = label; thermalBtn.disabled = false; }, 2500);
    } catch (err) {
      thermalBtn.textContent = '导出失败';
      console.error('[thermal] 导出失败', err);
      setTimeout(() => { thermalBtn.textContent = label; thermalBtn.disabled = false; }, 2500);
    }
  });

  section.appendChild(modeBar);
  section.appendChild(container);
  return section;
}

// 576 dots = A160M 打印宽度；SN 是全局单例，所以离屏渲染完必须把原谱重画回来
async function exportThermal(parsed, scoreData) {
  const WIDTH = 576;

  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${WIDTH}px;background:#fff;`;
  document.body.appendChild(holder);

  try {
    RendererAdapter.backends['simple-notation'].renderWith(holder, scoreData, 2);
    const svg = await waitForSvg(holder, 6000);
    // renderSN 里的拍号文案修正在两帧之后，导出前必须等它跑完
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const { blob, height } = await svgToThermalPng(svg, WIDTH);
    return { blob, height };
  } finally {
    holder.remove();
    // SN 实例被换掉了，把当前视图重画一遍，否则播放高亮和尺寸都会错
    const container = document.querySelector('.score-container');
    if (container) {
      container.replaceChildren();
      container.appendChild(buildScore(parsed));
    }
  }
}

function waitForSvg(holder, timeout) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      const svg = holder.querySelector('svg');
      if (svg && svg.getBoundingClientRect().height > 20) { resolve(svg); return; }
      if (Date.now() - t0 > timeout) { reject(new Error('简谱渲染超时')); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function svgToThermalPng(svg, targetWidth) {
  return new Promise((resolve, reject) => {
    const box = svg.getBoundingClientRect();
    const w = Math.round(box.width) || targetWidth;
    const h = Math.round(box.height);
    if (!h) { reject(new Error('SVG 尺寸为 0')); return; }

    const clone = svg.cloneNode(true);
    clone.setAttribute('width', w);
    clone.setAttribute('height', h);
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
    bg.setAttribute('fill', '#fff');
    clone.insertBefore(bg, clone.firstChild);
    // 阴影里的样式不会被序列化，白色底只保证透明处不变黑
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const scale = targetWidth / w;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 二值化：热敏只有黑白，灰阶会打成麻点
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        const v = lum < 120 ? 0 : 255;
        px[i] = px[i + 1] = px[i + 2] = v;
        px[i + 3] = 255;
      }
      ctx.putImageData(data, 0, 0);
      canvas.toBlob(b => resolve({ blob: b, height: canvas.height }), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG 转位图失败'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
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
