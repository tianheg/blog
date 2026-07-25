/**
 * renderer-adapter-vexflow.js
 * 五线谱渲染后端 — VexFlow v4
 *
 * 懒加载 VexFlow (CDN)，首次 use/register 时拉取。
 * 注册后端名: 'vexflow'
 *
 * 依赖: RendererAdapter (定义在 renderer-adapter.js 中)
 */

const VEXFLOW_CDN = 'https://cdn.jsdelivr.net/npm/vexflow@4.2.5/releases/vexflow-min.js';

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
  if (typeof Vex !== 'undefined' && Vex.Flow) {
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
  const VF = Vex.Flow;
  if (!VF) {
    container.textContent = '五线谱引擎未加载';
    return container;
  }

  try {
    const width = container.parentElement?.clientWidth || container.clientWidth || 800;
    const scale = SCALE_MAP[score.key] || SCALE_MAP['C'];
    const baseOctave = 4;
    const lineHeight = 100;
    const staveCount = score.staves.length;
    const totalHeight = staveCount * lineHeight + 40;

    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const timeSig = `${score.time}/${score.beat}`;

    score.staves.forEach((stave, si) => {
      const y = si * lineHeight + 30;
      const staveEl = new VF.Stave(10, y, width - 20);
      staveEl.addClef('treble');
      if (si === 0) staveEl.addTimeSignature(timeSig);
      staveEl.setContext(ctx).draw();

      // 构建每个小节的音符
      const allVexNotes = [];
      stave.measures.forEach((measure, mi) => {
        const measureNotes = [];
        measure.notes.forEach(n => {
          if (n.type === 'note') {
            const pitchName = scale[(n.pitch - 1) % 7];
            const octave = baseOctave + n.octave;
            const durStr = durationToVex(n.duration, n.dotted);

            const vn = new VF.StaveNote({
              keys: [`${pitchName}/${octave}`],
              duration: durStr,
              clef: 'treble'
            });

            if (pitchName.length > 1) {
              vn.addAccidental(0, new VF.Accidental(
                pitchName.includes('#') ? '#' : 'b'
              ));
            }
            if (n.dotted) vn.addDot(0);
            measureNotes.push(vn);
          } else if (n.type === 'rest') {
            const durStr = durationToVex(n.duration, false);
            measureNotes.push(
              new VF.StaveNote({ keys: ['B/4'], duration: durStr, type: 'r' })
            );
          }
        });

        // 每小节音符放入独立 Voice，自动处理小节线
        if (measureNotes.length > 0) {
          const voice = new VF.Voice({
            num_beats: score.time,
            beat_value: score.beat
          });
          voice.addTickables(measureNotes);

          try {
            new VF.Formatter().joinVoices([voice]).format([voice], width / stave.measures.length - 20);
            voice.draw(ctx, staveEl);
          } catch (e) {
            // 跳过格式不兼容的声部
          }
        }
      });
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
  return dotted ? base + 'd' : base;
}
