/**
 * jianpu-parser.js
 * 简谱 DSL 解析器
 *
 * DSL 格式：
 *   @key 1=C        元数据
 *   @time 4/4
 *   @tempo 120
 *
 *   3 3 4 5 | 5 4 3 2 | ...   谱行，空格分隔 token
 *
 * Token 规则：
 *   1-7    中音四分音符
 *   1'-7'  高八度
 *   1''    高两个八度
 *   1,-7,  低八度
 *   1,,    低两个八度
 *   _1_    八分音符（半拍）
 *   __1__  十六分
 *   1·     附点
 *   1-     二分（两拍）
 *   1--    三拍
 *   1---   全音符（四拍）
 *   0      四分休止
 *   0-     二分休止
 *   |      小节线
 *   ||     双小节线
 *   :||    反复结束
 *   -      延音/空拍
 */

function parseJianpu(source) {
  if (!source || typeof source !== 'string') return null;
  const lines = source.split('\n');
  const meta = {};
  const notation = [];
  let inBody = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // 元数据行
    if (line.startsWith('@')) {
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx > 1) {
        const key = line.substring(1, spaceIdx).trim();
        const value = line.substring(spaceIdx + 1).trim();
        meta[key] = value;
      }
      continue;
    }

    // 谱行
    const tokens = line.split(/\s+/);
    const parsed = [];
    for (const token of tokens) {
      if (!token) continue;
      parsed.push(parseToken(token));
    }
    if (parsed.length > 0) notation.push(parsed);
  }

  return { meta, notation };
}

function parseToken(token) {
  // 小节线
  if (token === '|') return { type: 'barline' };
  if (token === '||') return { type: 'barline', double: true };
  if (token === ':||' || token === '|:') return { type: 'barline', repeat: token === ':||' ? 'end' : 'start' };

  // 延音
  if (token === '-') return { type: 'tie' };

  // 音符/休止
  // 匹配: [八分前缀][音高][八度标记][附点][延长后缀]
  const m = token.match(/^(_{0,2})([0-7])([,']*)([·.]?)(_{0,2})(-*)$/);
  if (!m) return { type: 'raw', text: token };

  const [, prefix, pitch, octaveMarks, dotted, suffix, durationExt] = m;
  const pitchNum = parseInt(pitch, 10);

  // 休止符
  if (pitchNum === 0) {
    return {
      type: 'rest',
      beamed: prefix.length,
      durationExt: durationExt.length
    };
  }

  // 八度
  let octave = 0;
  for (const ch of octaveMarks) {
    if (ch === "'") octave++;
    else if (ch === ",") octave--;
  }

  return {
    type: 'note',
    pitch: pitchNum,
    octave: octave,
    dotted: dotted === '·' || dotted === '.',
    beamed: prefix.length, // 0=四分, 1=八分, 2=十六分
    durationExt: durationExt.length // 额外拍数
  };
}

/**
 * 获取音符的拍数时长
 */
function getNoteBeats(note) {
  if (note.type !== 'note') return 0;
  let beats = Math.pow(0.5, note.beamed); // 四分=1, 八分=0.5, 十六分=0.25
  beats += note.durationExt; // 每延长一横 = 加一拍
  if (note.dotted) beats *= 1.5;
  return beats;
}
