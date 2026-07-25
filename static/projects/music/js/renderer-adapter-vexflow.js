/**
 * renderer-adapter-vexflow.js
 * 五线谱渲染后端 — VexFlow
 *
 * 懒加载 VexFlow (CDN)，首次 use/register 时拉取。
 * 注册后端名: 'vexflow'
 *
 * 依赖: RendererAdapter (定义在 renderer-adapter.js 中)
 */

const VEXFLOW_CDN = 'https://cdn.jsdelivr.net/npm/vexflow@5/build/cjs/vexflow.js';

// 各调式的音名映射 (movable do → actual pitch name)
const SCALE_MAP = {
  'C':  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'G':  ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'D':  ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'A':  ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'E':  ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'B':  ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'F':  ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
};

function loadVexFlow(callback) {
  if (typeof VF !== 'undefined' || typeof VexFlow !== 'undefined') {
    callback();
    return;
  }
  const s = document.createElement('script');
  s.src = VEXFLOW_CDN;
  s.onload = callback;
  s.onerror = () => console.error('[VexFlow] 加载失败:', VEXFLOW_CDN);
  document.body.appendChild(s);
}

// 注册 VexFlow 后端（懒加载）
RendererAdapter.register('vexflow', {
  loaded: false,
  queue: [],

  render(container, score) {
    if (!this.loaded) {
      container.textContent = '正在加载五线谱引擎…';
      this.queue.push({ container, score });
      if (this.queue.length === 1) {
        loadVexFlow(() => {
          this.loaded = true;
          this.queue.forEach(job => renderVexFlow(job.container, job.score));
          this.queue = [];
        });
      }
      return container;
    }
    return renderVexFlow(container, score);
  }
});

function renderVexFlow(container, score) {
  const VF = typeof VexFlow !== 'undefined' ? VexFlow : window.VF;
  if (!VF) {
    container.textContent = '五线谱引擎未加载';
    return container;
  }

  try {
    const width = container.clientWidth || 800;
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, 200);

    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const scale = SCALE_MAP[score.key] || SCALE_MAP['C'];
    const baseOctave = 4;

    // 时间签名
    const timeSig = `${score.time}/${score.beat}`;

    let yOffset = 40;
    score.staves.forEach((stave, si) => {
      const staveEl = new VF.Stave(10, yOffset, width - 20);
      staveEl.addClef('treble');

      if (si === 0) {
        staveEl.addTimeSignature(timeSig);
      }

      staveEl.setContext(ctx).draw();

      // 构建 VexFlow 音符
      const vexNotes = [];

      stave.measures.forEach(measure => {
        measure.notes.forEach(n => {
          if (n.type === 'note') {
            const pitchName = scale[(n.pitch - 1) % 7];
            const octave = baseOctave + n.octave;
            const durStr = durationToVex(n.duration, n.dotted);

            // 创建 VexFlow note
            const vn = new VF.StaveNote({
              keys: [`${pitchName}/${octave}`],
              duration: durStr,
              clef: 'treble'
            });

            // 临时记号（升降号）
            if (pitchName.length > 1) {
              // e.g., "F#" or "Bb" — VexFlow auto-accidentals
              vn.addAccidental(0, new VF.Accidental(pitchName.includes('#') ? '#' : 'b'));
            }

            if (n.dotted) {
              vn.addDot(0);
            }

            vexNotes.push(vn);
          } else if (n.type === 'rest') {
            const durStr = durationToVex(n.duration, false);
            vexNotes.push(
              new VF.StaveNote({ keys: ['B/4'], duration: durStr, type: 'r' })
            );
          }
        });
      });

      // 格式化和渲染
      if (vexNotes.length > 0) {
        try {
          VF.Formatter.FormatAndDraw(ctx, staveEl, vexNotes);
        } catch (e) {
          // 某些音符组合可能格式不兼容，直接跳过格式化
        }
      }

      yOffset += 120;
    });

    return container;
  } catch (e) {
    container.textContent = '五线谱渲染错误: ' + e.message;
    return container;
  }
}

function durationToVex(beats, dotted) {
  let base;
  if (beats >= 4) base = 'w';
  else if (beats >= 2) base = 'h';
  else if (beats >= 1) base = 'q';
  else if (beats >= 0.5) base = '8';
  else base = '16';

  if (dotted) base += 'd';
  return base;
}
