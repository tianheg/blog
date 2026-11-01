/**
 * abc-score.js — ABC 文本 → 五线谱（abcjs）、播放音符序列、导出 72mm PDF
 *
 * 依赖 vendor/abcjs-basic-min.js（自托管）与 vendor/pdf-lib.min.js
 * ABC 是唯一真源：渲染、播放、导出全部从它派生，不再有第二份音符数据。
 */
const AbcScore = {
  _libPromise: null,
  _pdfPromise: null,

  loadLib() {
    if (window.ABCJS) return Promise.resolve();
    if (!this._libPromise) {
      this._libPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${ROOT}vendor/abcjs-basic-min.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('abcjs 加载失败'));
        document.head.appendChild(s);
      });
    }
    return this._libPromise;
  },

  loadPdfLib() {
    if (window.PDFLib) return Promise.resolve();
    if (!this._pdfPromise) {
      this._pdfPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${ROOT}vendor/pdf-lib.min.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('pdf-lib 加载失败'));
        document.head.appendChild(s);
      });
    }
    return this._pdfPromise;
  },

  // 渲染到容器；options 透传给 abcjs（staffwidth / scale / responsive）
  async render(container, abcText, options = {}) {
    await this.loadLib();
    container.replaceChildren();
    const paper = document.createElement('div');
    container.appendChild(paper);

    const tunes = ABCJS.renderAbc(paper, abcText, Object.assign({
      responsive: 'resize',
      staffwidth: 900,
      scale: 1,
      paddingtop: 0,
      paddingbottom: 0,
      paddingleft: 0,
      paddingright: 0,
      add_classes: true,
    }, options));

    return { tunes, svg: paper.querySelector('svg') };
  },

  // 用 abcjs 返回的 visualObj 建立「播放进度比例 → SVG 元素」映射。
  // 每个 note 自带 abselem.elemset（就是它的 g 元素），比按 ABC 行号/序号猜可靠得多
  // —— abcjs 会按 staffwidth 重排，渲染行数不一定等于 ABC 的行数（踩过）
  buildElemMap(tunes) {
    const tune = tunes && tunes[0];
    const map = new Map();
    if (!tune || !tune.lines) return { map, totalUnits: 1 };

    let t0 = 0;
    const rows = [];
    tune.lines.forEach(line => {
      const v0 = (line.staff[0] && line.staff[0].voices[0]) || [];
      const lineDur = v0.reduce((s, n) => s + (n.duration || 0), 0);
      rows.push({ line, t0 });
      t0 += lineDur;
    });
    const totalUnits = t0 || 1;

    rows.forEach(({ line, t0: start }) => {
      line.staff.forEach(staff => {
        (staff.voices || []).forEach(notes => {
          let t = start;
          notes.forEach(note => {
            const el = note.abselem && note.abselem.elemset && note.abselem.elemset[0];
            if (el) {
              const k = (t / totalUnits).toFixed(4);
              if (!map.has(k)) map.set(k, []);
              map.get(k).push(el);
            }
            t += note.duration || 0;
          });
        });
      });
    });

    // 排好序，供单调查找
    const list = [...map.entries()]
      .map(([k, els]) => ({ k: Number(k), els }))
      .sort((a, b) => a.k - b.k);

    return { map, list, totalUnits };
  },

  // 按播放进度比例取元素。播放是顺序的，查找也必须单调往前推进，
  // 否则两套时值算法的微小误差会让高亮偶尔跳回前一个音符（看起来像"往回放"）
  elemAt(elemMap, ratio, hint) {
    if (!elemMap || !elemMap.list || !elemMap.list.length) return [];
    const list = elemMap.list;
    const start = Math.max(0, (hint || 0) - 1);
    let best = null;
    for (let i = start; i < list.length && i <= start + 6; i++) {
      const d = Math.abs(list[i].k - ratio);
      if (!best || d < best.d) best = { i, d, els: list[i].els };
    }
    if (!best) return [];
    elemMap.lastHint = best.i;
    return best.els;
  },

  // 给每个音符加注解：「音名」(C D E) 或「唱名」(do re mi，按调号算相对音级)
  annotate(abc, mode) {
    if (!mode || mode === 'none') return abc;
    const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const NAME = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const SOLFA = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];

    const lines = abc.split('\n');
    let inBody = false;
    let tonic = 0;

    return lines.map(line => {
      const keyM = /^K:\s*([A-G])([#b]?)/.exec(line);
      if (keyM) {
        inBody = true;
        tonic = (LETTERS[keyM[1]] + (keyM[2] === '#' ? 1 : keyM[2] === 'b' ? -1 : 0) + 12) % 12;
        return line;
      }
      if (!inBody || /^w:/.test(line) || /^[A-Za-z]:/.test(line)) return line;

      return line.replace(/(^|[\s|])([_^=]?)([A-Ga-g])([,']*)(\d*(?:\/\d+)?)?/g,
        (m, pre, acc, letter, octMark, dur) => {
          const upper = letter.toUpperCase();
          let pc = LETTERS[upper];
          for (const ch of acc) pc += ch === '^' ? 1 : ch === '_' ? -1 : 0;
          pc = ((pc % 12) + 12) % 12;

          let label;
          if (mode === 'note') {
            label = NAME[pc];
          } else {
            const deg = ((pc - tonic) % 12 + 12) % 12;
            const MAJOR = [0, 2, 4, 5, 7, 9, 11];
            const idx = MAJOR.indexOf(deg);
            if (idx >= 0) {
              label = SOLFA[idx];
            } else {
              let lo = 0;
              for (let k = 0; k < MAJOR.length; k++) if (MAJOR[k] < deg) lo = k;
              label = SOLFA[lo] + '#';
            }
          }
          return `${pre}"${label}"${acc}${letter}${octMark}${dur || ''}`;
        });
    }).join('\n');
  },

  // ABC 头里的拍号与速度（状态栏、小节号用）
  meta(abc) {
    const m = /^M:\s*(\d+)\s*\/\s*(\d+)/m.exec(abc);
    const q = /^Q:\s*1\s*\/\s*(\d+)\s*=\s*(\d+)/m.exec(abc);
    return {
      beatsPerBar: m ? Number(m[1]) : 4,
      beatUnit: m ? Number(m[2]) : 4,
      tempo: q ? Number(q[2]) : 100,
    };
  },

  // ABC → [{ midi, start(拍), dur(拍) }]，供 Web Audio 播放
  // ABC → 音符事件。支持 V:1 / V:2 双声部：各声部独立计时，同一时刻的音合并成和弦
  toNotes(abcText) {
    const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const lines = abcText.split('\n');
    let inHeader = true;
    let unit = 1;
    let bpm = 100;
    let curVoice = '1';
    const voices = {};

    const flush = (voice, tokens, cursorRef, lineNo) => {
      const arr = voices[voice] || (voices[voice] = []);
      let nIn = 0;
      for (const tk of tokens) {
        if (tk === '|' || tk === '') continue;

        // 和弦 [FAc] / [E2B2]：方括号里的音同时发声，时值取括号后的后缀
        const chordM = /^\[(.+)\](\d*)(?:\/(\d*))?$/.exec(tk);
        if (chordM) {
          const inner = chordM[1];
          const sufNum = chordM[2];
          const sufDen = chordM[3];

          let mult = 1;
          if (sufNum) mult = Number(sufNum);
          if (sufDen !== undefined) mult /= sufDen === '' ? 2 : Number(sufDen);

          const midis = [];
          let innerDur = null;
          const re = /([_^=]*)([A-Ga-gzx])([,']*)(\d*)(?:\/(\d*))?/g;
          let im;
          while ((im = re.exec(inner))) {
            const [, a2, l2, o2, n2, d2] = im;
            if (l2 === 'z' || l2 === 'x') continue;
            const up = l2.toUpperCase();
            let mi = LETTERS[up];
            let oc = l2 === up ? 4 : 5;
            for (const ch of o2) oc += ch === "'" ? 1 : -1;
            mi += (oc + 1) * 12;
            for (const ch of a2) mi += ch === '^' ? 1 : ch === '_' ? -1 : 0;
            midis.push(mi);
            // 各音自己的时值（没写就用统一的）
            let mm = 1;
            if (n2) mm = Number(n2);
            if (d2 !== undefined) mm /= d2 === '' ? 2 : Number(d2);
            if (innerDur === null) innerDur = mm * unit;
          }
          if (!midis.length) continue;

          const dur = (sufNum || sufDen !== undefined ? mult * unit : innerDur) || 1;
          arr.push({ midis, start: cursorRef.beat, dur, line: lineNo, nIn: nIn++ });
          cursorRef.beat += dur;
          continue;
        }

        const m = /^([_^=]*)([A-Ga-gzx])([,']*)(\d*)(?:\/(\d*))?$/.exec(tk);
        if (!m) continue;
        const [, acc, letter, octMark, numStr, denStr] = m;

        let mult = 1;
        if (numStr) mult = Number(numStr);
        if (denStr !== undefined) mult /= denStr === '' ? 2 : Number(denStr);
        const dur = (mult * unit) || 1;

        if (letter === 'z' || letter === 'x') {
          arr.push({ rest: true, midis: [], start: cursorRef.beat, dur, line: lineNo, nIn: nIn++ });
          cursorRef.beat += dur;
          continue;
        }

        const upper = letter.toUpperCase();
        let midi = LETTERS[upper];
        let oct = letter === upper ? 4 : 5;
        for (const ch of octMark) oct += ch === "'" ? 1 : -1;
        midi += (oct + 1) * 12;
        for (const ch of acc) midi += ch === '^' ? 1 : ch === '_' ? -1 : 0;

        arr.push({ midis: [midi], start: cursorRef.beat, dur, line: lineNo, nIn: nIn++ });
        cursorRef.beat += dur;
      }
    };

    const cursors = {};
    const lineNos = {};
    for (const raw of lines) {
      const line = raw.trim();
      const vh = /^V:\s*(\S+)/.exec(line);
      if (vh) { curVoice = vh[1]; inHeader = false; continue; }
      if (inHeader) {
        const m = /^L:\s*(\d+)\s*\/\s*(\d+)/.exec(line);
        if (m) unit = (Number(m[1]) / Number(m[2])) * 4;
        const q = /^Q:\s*1\s*\/\s*(\d+)\s*=\s*(\d+)/.exec(line);
        if (q) bpm = Number(q[2]);
        if (/^K:/.test(line)) inHeader = false;
        continue;
      }
      if (!line || /^[A-Za-z]:/.test(line)) continue;

      if (!cursors[curVoice]) cursors[curVoice] = { beat: 0 };
      if (lineNos[curVoice] === undefined) lineNos[curVoice] = 0;
      const tokens = line
        .replace(/"[^"]*"/g, ' ')
        .replace(/![^!]*!/g, ' ')
        .replace(/\{([^}]*)\}/g, '$1')
        .replace(/\|\]?/g, ' | ')
        .replace(/\|:/g, ' | ')
        .split(/\s+/)
        .filter(Boolean);
      flush(curVoice, tokens, cursors[curVoice], lineNos[curVoice]++);
    }

    // 合并：同一 start 的所有音 → 一个和弦事件；单声部时就是单音
    const byStart = new Map();
    Object.keys(voices).forEach(v => {
      voices[v].forEach(n => {
        if (n.rest) return;          // 休止符不发声，只占 DOM 序号
        const k = n.start.toFixed(3);
        const cur = byStart.get(k);
        // abcjs 给每个元素打 abcjs-l{行} / abcjs-v{声部} / abcjs-n{行内序号}，
        // 三元组才能唯一定位（n 是每行重置的）
        const part = { v: v === '1' ? 0 : 1, line: n.line, nIn: n.nIn };
        if (cur) {
          n.midis.forEach(m => { if (!cur.midis.includes(m)) cur.midis.push(m); });
          cur.dur = Math.max(cur.dur, n.dur);
          if (v === '1') cur.hasMelody = true;
          cur.parts.push(part);
        } else {
          byStart.set(k, { start: n.start, dur: n.dur, midis: [...n.midis],
                           hasMelody: v === '1', parts: [part] });
        }
      });
    });

    const notes = [...byStart.values()].sort((a, b) => a.start - b.start);
    const totalBeats = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
    return { notes, bpm, totalBeats };
  },

  // 导出 72mm 宽（203dpi 下 576 dots）单页 PDF
  async exportThermalPdf(abcText, title) {
    await this.loadLib();
    await this.loadPdfLib();

    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:576px;background:#fff;';
    document.body.appendChild(holder);

    try {
      const { svg } = await this.render(holder, abcText, {
        responsive: undefined, staffwidth: 568, scale: 1, add_classes: true,
      });
      if (!svg) throw new Error('渲染失败');

      const blob = await this.svgToMonoPng(svg, 576);
      const pngBytes = await blob.arrayBuffer();

      const pdf = await PDFLib.PDFDocument.create();
      const png = await pdf.embedPng(pngBytes);
      const pageW = (72 / 25.4) * 72;          // 72mm → pt
      const scale = pageW / png.width;
      const pageH = png.height * scale;
      const page = pdf.addPage([pageW, pageH]);
      page.drawImage(png, { x: 0, y: 0, width: pageW, height: pageH });

      const bytes = await pdf.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${title}-72mm.pdf`);
      return { cm: Math.round(pageH / 72 * 25.4 / 10), pt: [Math.round(pageW), Math.round(pageH)] };
    } finally {
      holder.remove();
    }
  },

  // SVG → 按内容 bbox 裁剪 → 576 宽 1-bit PNG
  svgToMonoPng(svg, targetWidth) {
    return new Promise((resolve, reject) => {
      const bb = svg.getBBox();
      const pad = 6;
      const w = Math.round(bb.width + pad * 2);
      const h = Math.round(bb.height + pad * 2);
      if (!w || !h) { reject(new Error('SVG 尺寸为 0')); return; }

      const clone = svg.cloneNode(true);
      clone.setAttribute('viewBox', `${Math.round(bb.x - pad)} ${Math.round(bb.y - pad)} ${w} ${h}`);
      clone.setAttribute('width', w);
      clone.setAttribute('height', h);

      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('x', String(Math.round(bb.x - pad)));
      bg.setAttribute('y', String(Math.round(bb.y - pad)));
      bg.setAttribute('width', String(w));
      bg.setAttribute('height', String(h));
      bg.setAttribute('fill', '#fff');
      clone.insertBefore(bg, clone.firstChild);

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

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        // 阈值放宽到 205：abcjs 的谱线只有 0.5px 宽，缩放后抗锯齿成浅灰（≈180），
        // 用 140 过滤会把五线谱的线整条吃掉，纸上就少一条线
        for (let i = 0; i < px.length; i += 4) {
          const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
          const v = lum < 205 ? 0 : 255;
          px[i] = px[i + 1] = px[i + 2] = v;
          px[i + 3] = 255;
        }
        ctx.putImageData(data, 0, 0);
        canvas.toBlob(b => resolve(b), 'image/png');
      };
      img.onerror = () => reject(new Error('SVG 转位图失败'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
  },
};

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
