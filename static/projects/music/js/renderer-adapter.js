/**
 * renderer-adapter.js
 * 渲染引擎适配层 — 可替换后端渲染器
 *
 * 当前注册后端:
 *   - simple-notation (简谱 SVG) — 懒加载
 *   - vexflow (五线谱 SVG) — CDN 懒加载
 *
 * 用法:
 *   RendererAdapter.render(container, scoreData)
 *   RendererAdapter.use('vexflow')  // 切换后端
 *
 * scoreData 格式（由 notation-converter.js 生成）:
 *   { key, time, beat, tempo, staves: [{ measures: [{ notes: [...] }] }] }
 */

const RendererAdapter = {
  current: 'simple-notation',
  backends: {},

  register(name, backend) {
    this.backends[name] = backend;
  },

  render(container, score) {
    const backend = this.backends[this.current];
    if (!backend) {
      container.textContent = `渲染引擎未注册: ${this.current}`;
      return container;
    }
    return backend.render(container, score);
  },

  use(name) {
    if (this.backends[name]) {
      this.current = name;
    } else {
      console.warn(`[RendererAdapter] 未知渲染后端: ${name}`);
    }
  }
};

// === 后端: simple-notation (简谱 SVG, 懒加载) ===
RendererAdapter.register('simple-notation', {
  _loading: false,
  _queue: [],

  render(container, score) {
    if (typeof SN !== 'undefined' && SN.SimpleNotation) {
      return renderSN(container, score);
    }

    if (!this._loading) {
      this._loading = true;
      container.textContent = '加载简谱引擎…';
      const s = document.createElement('script');
      s.src = 'js/simple-notation.js';
      s.onload = () => {
        this._loading = false;
        this._queue.forEach(job => renderSN(job.container, job.score));
        this._queue = [];
      };
      document.body.appendChild(s);
    } else {
      container.textContent = '加载简谱引擎…';
    }

    this._queue.push({ container, score });
    return container;
  },

  // 指定每行小节数直接渲染（PDF/热敏导出用）。Scribe 曲目不会触发懒加载，
  // 所以这里必须自己等 SN 加载完再画。
  async renderWith(container, score, perStave) {
    await ensureSN();
    return renderSN(container, score, perStave);
  }
});

// 简谱引擎按需加载，导出路径要能 await 它
function ensureSN() {
  if (typeof SN !== 'undefined' && SN.SimpleNotation) return Promise.resolve();
  if (!window.__snPromise) {
    window.__snPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${ROOT}js/simple-notation.js`;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('简谱引擎加载失败'));
      document.body.appendChild(s);
    });
  }
  return window.__snPromise;
}

function renderSN(container, score, perStave) {
  try {
    // 懒加载时容器里会有「加载简谱引擎…」文本，SN 只 append 不清理 → 必须先清掉
    container.replaceChildren();

    const sn = new SN.SimpleNotation(container, {
      resize: true,
      debug: false,
      score: {
        chordType: 'default',
        scoreType: 'simple',
        showChordLine: false,
        lineHeight: 42
      }
    });

    sn.loadData({
      info: {
        title: '', composer: '',
        time: String(score.time),
        beat: String(score.beat),
        tempo: String(score.tempo),
        key: score.key
      },
      score: buildSNScoreString(score.staves, perStave || (window.innerWidth < 560 ? 2 : 4)),
      lyric: ''
    });

    // 渲染是异步的，等两帧再收拾文本
    const wrong = `${score.beat}/${score.time}`;
    const right = `${score.time}/${score.beat}`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      container.querySelectorAll('svg text').forEach(t => {
        // SN 用 time 当每小节拍数（不能对调），但文案按 beat/time 渲染，改回 time/beat
        if (wrong !== right && t.textContent === wrong) t.textContent = right;
        // 小节号：SN 用 14px 灰字，太小，单独加类提亮
        const txt = t.textContent.trim();
        if (t.getAttribute('font-size') === '14' && /^\d+$/.test(txt) && txt !== right) {
          t.classList.add('bar-no');
        }
      });
    }));

    return container;
  } catch (e) {
    container.textContent = '渲染错误: ' + e.message;
    return container;
  }
}

// 通用 score data → simple-notation 文本格式
// SN 语法约束（实测 2026-10-23）：
//   时值修饰必须写在八度符号之前 —— `4/8'` 对，`4'/8` 会被判错（整小节变红）
//   `-` 不是后缀，要当成独立元素用逗号分隔 —— `3,-` = 3 延长一拍
function buildSNScoreString(staves, perStave = 4) {
  // 拍到一条时间轴上，再按每行小节数重新分组 —— 窄屏一行少放几小节，
  // 音符和减时线才不会被挤在一起
  const all = staves.flatMap(s => s.measures);
  const rows = [];
  for (let i = 0; i < all.length; i += perStave) rows.push(all.slice(i, i + perStave));

  return rows.map((measures, i) => {
    const body = measures.map(m => m.notes.map(noteToSN).join(',')).join('|');
    return `{${i + 1}}${body}`;
  }).join('\n');
}

// === 后端: scribe（打印谱，CSS 排版；自托管内核在 vendor/）===
// 与简谱不同，这个后端吃的是 Scribe 的 sequence JSON，不是 scoreData。
RendererAdapter.register('scribe', {
  _ready: null,

  ensureLoaded() {
    if (this._ready) return this._ready;
    this._ready = new Promise((resolve, reject) => {
      if (customElements.get('scribe-music')) { resolve(); return; }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${ROOT}vendor/element.css`;
      document.head.appendChild(link);
      const s = document.createElement('script');
      s.type = 'module';
      s.src = `${ROOT}vendor/element.js`;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('element.js 加载失败'));
      document.head.appendChild(s);
    });
    return this._ready;
  },

  render(container, opts) {
    container.replaceChildren();
    const hint = document.createElement('div');
    hint.className = 'scribe-hint';
    hint.textContent = '加载打印谱引擎…';
    container.appendChild(hint);

    this.ensureLoaded().then(() => {
      container.replaceChildren();
      const m = document.createElement('scribe-music');
      m.setAttribute('clef', opts.clef || 'treble');
      m.setAttribute('src', `${ROOT}${opts.src}`);
      container.appendChild(m);
    }).catch(err => {
      container.textContent = '打印谱渲染失败：' + err.message;
    });

    return container;
  }
});

function noteToSN(n) {
  const dur = n.beamed === 1 ? '/8' : n.beamed === 2 ? '/16' : '';
  const ext = n.durationExt > 0 ? ',-'.repeat(n.durationExt) : '';

  if (n.type === 'note') {
    let s = '' + n.pitch + dur;
    if (n.octave > 0) s += "'".repeat(n.octave);
    else if (n.octave < 0) s += ','.repeat(Math.abs(n.octave));
    if (n.dotted) s += '.';
    return s + ext;
  }
  if (n.type === 'rest') return '0' + dur + ext;
  if (n.type === 'tie') return '-';
  return '';
}
