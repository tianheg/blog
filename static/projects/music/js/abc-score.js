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
  toNotes(abcText) {
    const lines = abcText.split('\n');
    const body = [];
    let inHeader = true;
    let unit = 1;                 // L: 一行音符的时值（拍，四分=1）
    let bpm = 100;

    for (const raw of lines) {
      const line = raw.trim();
      if (inHeader) {
        const m = /^L:\s*(\d+)\s*\/\s*(\d+)/.exec(line);
        if (m) unit = (Number(m[1]) / Number(m[2])) * 4;
        const q = /^Q:\s*1\s*\/\s*(\d+)\s*=\s*(\d+)/.exec(line);
        if (q) bpm = Number(q[2]);
        if (/^K:/.test(line)) inHeader = false;
        continue;
      }
      body.push(line);
    }

    const text = body.join(' ');
    const tokens = text
      .replace(/"[^"]*"/g, ' ')                 // 和弦标记
      .replace(/![^!]*!/g, ' ')                 // 装饰
      .replace(/\{([^}]*)\}/g, '$1')            // grace note 保留音符
      .replace(/\|[\]:]?/g, ' | ')
      .split(/\s+/)
      .filter(Boolean);

    const notes = [];
    let beat = 0;
    for (const tk of tokens) {
      if (tk === '|') continue;
      const m = /^([_^=]*)([A-Ga-gzx])([,']*)(\d*)(?:\/(\d*))?$/.exec(tk);
      if (!m) continue;

      const [, acc, letter, octMark, numStr, denStr] = m;
      // 时值：num/den × L
      let mult = 1;
      if (numStr) mult = Number(numStr);
      if (denStr !== undefined) mult /= denStr === '' ? 2 : Number(denStr);
      const dur = mult * unit || 1;

      if (letter === 'z' || letter === 'x') { beat += dur; continue; }

      const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      const upper = letter.toUpperCase();
      let midi = LETTERS[upper];
      let oct = letter === upper ? 4 : 5;
      for (const ch of octMark) oct += ch === "'" ? 1 : -1;
      midi += (oct + 1) * 12;

      for (const ch of acc) midi += ch === '^' ? 1 : ch === '_' ? -1 : 0;

      notes.push({ midi, start: beat, dur });
      beat += dur;
    }

    return { notes, bpm, totalBeats: beat };
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
        for (let i = 0; i < px.length; i += 4) {
          const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
          const v = lum < 140 ? 0 : 255;
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
