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

  // 按每行 N 个小节重新分行。abcjs 严格按 ABC 的换行排版，
  // 手机上想「一行铺满屏」就得先改 ABC 的换行（密集谱 2 小节一行根本塞不进 390px）
  reflowAbc(abc, perLine) {
    const lines = abc.split('\n');
    const head = [];
    const voices = [];
    let cur = null;

    lines.forEach(raw => {
      const line = raw.trim();
      if (!line) return;
      if (/^V:/.test(line)) {
        cur = { header: line, bars: [] };
        voices.push(cur);
        return;
      }
      if (/^[A-Za-z]:/.test(line) && !cur) { head.push(line); return; }
      if (!cur) return;
      line.split('|').forEach(seg => {
        const s = seg.trim();
        if (s) cur.bars.push(s);
      });
    });

    if (!voices.length) return abc;

    const out = [...head];
    voices.forEach(v => {
      out.push(v.header);
      for (let i = 0; i < v.bars.length; i += perLine) {
        const chunk = v.bars.slice(i, i + perLine).map(b => b + ' |').join(' ');
        out.push(chunk);
      }
    });
    return out.join('\n');
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
