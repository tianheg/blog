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
  }
});

function renderSN(container, score) {
  try {
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
      score: buildSNScoreString(score.staves),
      lyric: ''
    });

    return container;
  } catch (e) {
    container.textContent = '渲染错误: ' + e.message;
    return container;
  }
}

// 通用 score data → simple-notation 文本格式
function buildSNScoreString(staves) {
  return staves.map((stave, i) => {
    const measures = stave.measures.map(m =>
      m.notes.map(noteToSN).join(',')
    );
    return `{${i + 1}}${measures.join('|')}`;
  }).join('\n');
}

function noteToSN(n) {
  if (n.type === 'note') {
    let s = '' + n.pitch;
    if (n.octave > 0) s += "'".repeat(n.octave);
    else if (n.octave < 0) s += ",".repeat(Math.abs(n.octave));
    if (n.dotted) s += '.';
    if (n.beamed === 1) s += '/8';
    else if (n.beamed === 2) s += '/16';
    if (n.durationExt > 0) s += '-'.repeat(n.durationExt);
    return s;
  }
  if (n.type === 'rest') return '0';
  if (n.type === 'tie') return '-';
  return '';
}
