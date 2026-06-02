/**
 * jianpu-renderer.js
 * 桥接：我的 DSL parser → simple-notation 库（SVG 渲染）
 * 使用 archive 中的 simple-notation.js
 */

function renderJianpu(parsed) {
  const emptyEl = document.createElement('div');
  emptyEl.className = 'jp-empty';

  if (!parsed || !parsed.notation || !parsed.notation.length) {
    emptyEl.textContent = '暂无简谱';
    return emptyEl;
  }

  const meta = parsed.meta;
  const timeParts = (meta.time || '4/4').split('/');
  const timeNum = timeParts[0] || '4';
  const timeDen = timeParts[1] || '4';
  const tempo = meta.tempo || '100';
  const key = meta.key || 'C';

  // 构建 simple-notation score 字符串
  // 每行 DSL 对应一个谱行，用 {N} 标记
  const staves = [];
  let staveNum = 1;

  for (const tokenLine of parsed.notation) {
    const measures = [];
    let currentMeasure = [];

    for (const tok of tokenLine) {
      if (tok.type === 'barline') {
        if (currentMeasure.length > 0) {
          measures.push(currentMeasure.join(','));
          currentMeasure = [];
        }
      } else {
        currentMeasure.push(tokenToSN(tok));
      }
    }
    if (currentMeasure.length > 0) {
      measures.push(currentMeasure.join(','));
    }

    if (measures.length > 0) {
      staves.push(`{${staveNum}}` + measures.join('|'));
      staveNum++;
    }
  }

  const scoreStr = staves.join('\n');

  // 创建容器并用 simple-notation 渲染
  const container = document.createElement('div');
  container.className = 'jp-score';

  if (typeof SN === 'undefined' || !SN.SimpleNotation) {
    container.textContent = '简谱引擎未加载';
    return container;
  }

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
        title: '',
        composer: '',
        time: timeNum,
        beat: timeDen,
        tempo: tempo,
        key: key
      },
      score: scoreStr,
      lyric: ''
    });

    return container;
  } catch (e) {
    container.textContent = '渲染错误: ' + e.message;
    return container;
  }
}

function tokenToSN(tok) {
  if (tok.type === 'note') {
    let s = '' + tok.pitch;
    // 八度标记
    if (tok.octave > 0) s += "'".repeat(tok.octave);
    else if (tok.octave < 0) s += ",".repeat(Math.abs(tok.octave));
    // 附点
    if (tok.dotted) s += '.';
    // 减时线 (八分/十六分)
    if (tok.beamed === 1) s += '/8';
    else if (tok.beamed === 2) s += '/16';
    // 增时线 (延长)
    if (tok.durationExt > 0) s += '-'.repeat(tok.durationExt);
    return s;
  }
  if (tok.type === 'rest') return '0';
  if (tok.type === 'tie') return '-';
  return '';
}
