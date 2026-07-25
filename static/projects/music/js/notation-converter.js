/**
 * notation-converter.js
 * 格式转换: parsed notation tokens → 通用结构化 score data
 * 输出格式无关的 measures 数组，适配层按需转换
 */

function buildScore(parsed) {
  if (!parsed || !parsed.notation || !parsed.notation.length) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'jp-empty';
    emptyEl.textContent = '暂无乐谱';
    return emptyEl;
  }

  const meta = parsed.meta;
  const timeParts = (meta.time || '4/4').split('/');

  const scoreData = {
    key: meta.key || 'C',
    time: parseInt(timeParts[0]) || 4,
    beat: parseInt(timeParts[1]) || 4,
    tempo: parseInt(meta.tempo) || 100,
    staves: buildStaves(parsed.notation)
  };

  const container = document.createElement('div');
  container.className = 'jp-score';
  return RendererAdapter.render(container, scoreData);
}

// 构建通用谱行结构
function buildStaves(notation) {
  return notation.map(tokenLine => {
    const measures = [];
    let currentMeasure = [];

    for (const tok of tokenLine) {
      if (tok.type === 'barline') {
        if (currentMeasure.length > 0) {
          measures.push({ notes: currentMeasure });
          currentMeasure = [];
        }
      } else {
        currentMeasure.push(tokenToNote(tok));
      }
    }
    if (currentMeasure.length > 0) {
      measures.push({ notes: currentMeasure });
    }

    return { measures };
  });
}

// 单个 token → 通用 note 对象
function tokenToNote(tok) {
  if (tok.type === 'note') {
    return {
      type: 'note',
      pitch: tok.pitch,
      octave: tok.octave,
      dotted: tok.dotted,
      duration: computeDuration(tok),
      beamed: tok.beamed,
      durationExt: tok.durationExt
    };
  }
  if (tok.type === 'rest') {
    return {
      type: 'rest',
      duration: tok.beamed === 0 ? 1 : Math.pow(0.5, tok.beamed),
      beamed: tok.beamed,
      durationExt: tok.durationExt
    };
  }
  if (tok.type === 'tie') {
    return { type: 'tie' };
  }
  return { type: 'raw' };
}

// 计算拍数（四分音符 = 1 beat）
function computeDuration(tok) {
  let beats = Math.pow(0.5, tok.beamed); // 四分=1, 八分=0.5, 十六分=0.25
  beats += tok.durationExt;              // 每延长一横 = 加一拍
  if (tok.dotted) beats *= 1.5;
  return beats;
}
