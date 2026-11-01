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

// ── 五线谱：ABC 真源 → abcjs 渲染 + 播放（可调速/标注）+ 热敏打印 ──
function buildAbcScore(score) {
  const section = document.createElement('div');

  const bar = document.createElement('div');
  bar.className = 'mode-bar';
  bar.innerHTML = `
    <button class="play-btn" id="play-btn" disabled>▶ 播放</button>
    <label class="ctl">速度
      <input type="range" id="bpm" min="40" max="180" value="100" step="1">
      <span class="ctl-num" id="bpm-num">100</span>
    </label>
    <label class="ctl">标注
      <select id="annot">
        <option value="none">无</option>
        <option value="note">音名</option>
        <option value="solf">唱名</option>
      </select>
    </label>
    <button class="print-btn" id="print-btn" title="导出 72mm 热敏版式 PDF">热敏打印</button>
  `;

  const container = document.createElement('div');
  container.className = 'score-container abc-container';

  const statusBar = document.createElement('div');
  statusBar.className = 'status-bar';
  statusBar.innerHTML = `<span id="status">点击播放开始</span><div class="progress"><div id="prog"></div></div>`;

  section.appendChild(bar);
  section.appendChild(container);
  section.appendChild(statusBar);

  const playBtn = bar.querySelector('#play-btn');
  const printBtn = bar.querySelector('#print-btn');
  const bpmInput = bar.querySelector('#bpm');
  const bpmNum = bar.querySelector('#bpm-num');
  const annotSel = bar.querySelector('#annot');
  const statusEl = statusBar.querySelector('#status');
  const progEl = statusBar.querySelector('#prog');

  let playing = false;
  let abcText = '';
  let forRender = '';
  let notes = [];
  let meta = { beatsPerBar: 4, tempo: 100 };
  let noteEls = [];

  const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  bpmInput.addEventListener('input', () => {
    bpmNum.textContent = bpmInput.value;
  });

  const clearHl = () => noteEls.forEach(el => el.classList.remove('hl'));

  async function render(withAnnotations) {
    const text = AbcScore.annotate(forRender, withAnnotations);
    await AbcScore.render(container, text, { responsive: 'resize', staffwidth: 900 });
    noteEls = [...container.querySelectorAll('.abcjs-note, g.abcjs-note')];
  }

  (async () => {
    try {
      const url = new URL(score.abcData, document.baseURI).href;
      abcText = await (await fetch(url)).text();
      forRender = abcText.split('\n').filter(l => !/^[TC]:/.test(l)).join('\n');
      meta = AbcScore.meta(abcText);

      const parsed = AbcScore.toNotes(abcText);
      notes = parsed.notes;
      bpmInput.value = String(parsed.bpm || meta.tempo || 100);
      bpmNum.textContent = bpmInput.value;

      await render('none');
      playBtn.disabled = false;

      function stopPlay() {
        AudioPlayer.stop();
        playing = false;
        clearHl();
        playBtn.textContent = '▶ 播放';
        progEl.style.width = '0%';
      }

      function startPlay(fromIndex) {
        if (playing) AudioPlayer.stop();
        clearHl();
        const start = Math.max(0, Math.min(notes.length - 1, fromIndex || 0));
        AudioPlayer.playSequence(notes, {
          startIndex: start,
          getBpm: () => Number(bpmInput.value) || 100,
          onNote(index, note) {
            noteEls.forEach(el => el.classList.remove('hl'));
            const el = noteEls[index];
            if (el) {
              el.classList.add('hl');
              const box = el.getBoundingClientRect();
              if (box.top < 80 || box.bottom > window.innerHeight - 40) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
            const barNo = Math.floor(note.start / meta.beatsPerBar) + 1;
            const top = Array.isArray(note.midis) ? Math.max(...note.midis) : note.midi;
            const name = NAMES[top % 12];
            const oct = Math.floor(top / 12) - 1;
            statusEl.textContent = `第 ${barNo} 小节 · ${name}${oct}`;
            progEl.style.width = ((index / notes.length) * 100).toFixed(1) + '%';
          },
          onEnd() {
            playing = false;
            clearHl();
            playBtn.textContent = '▶ 播放';
            progEl.style.width = '100%';
            statusEl.textContent = '演奏完毕';
          },
        });
        playing = true;
        playBtn.textContent = '⏹ 停止';
        progEl.style.width = ((start / notes.length) * 100).toFixed(1) + '%';
      }

      playBtn.addEventListener('click', () => {
        if (playing) { stopPlay(); return; }
        startPlay(0);
      });

      // 点谱面上的任意音符，从那里开始演奏（练琴时反复抠一句）
      container.addEventListener('click', e => {
        if (!noteEls.length) return;
        let el = e.target;
        while (el && el !== container) {
          const i = noteEls.indexOf(el);
          if (i >= 0) { startPlay(i); return; }
          el = el.parentNode;
        }
      });

      // 空格键播放 / 停止；交给 router 的 cleanupKeyboard 在切页时移除
      if (state.keyboardHandler) document.removeEventListener('keydown', state.keyboardHandler);
      state.keyboardHandler = e => {
        if (e.code !== 'Space') return;
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'button' || tag === 'textarea') return;
        e.preventDefault();
        playBtn.click();
      };
      document.addEventListener('keydown', state.keyboardHandler);

      annotSel.addEventListener('change', async () => {
        if (playing) {
          AudioPlayer.stop();
          playing = false;
          clearHl();
          playBtn.textContent = '▶ 播放';
          progEl.style.width = '0%';
          statusEl.textContent = '点击播放开始';
        }
        await render(annotSel.value);
      });

      printBtn.addEventListener('click', async () => {
        if (printBtn.disabled) return;
        printBtn.disabled = true;
        const label = printBtn.textContent;
        printBtn.textContent = '生成中…';
        if (playing) { AudioPlayer.stop(); playing = false; clearHl(); playBtn.textContent = '▶ 播放'; }
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
