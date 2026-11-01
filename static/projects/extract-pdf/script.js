// PDF 提取 — 纯前端：读文件 → pdf-lib 抽页 → 下载，文件不离开浏览器
const drop = document.getElementById('drop');
const dropText = document.getElementById('dropText');
const input = document.getElementById('pdfinput');
const fileInfo = document.getElementById('fileInfo');
const rangeInput = document.getElementById('rangeSelector');
const extractBtn = document.getElementById('extractBtn');
const hint = document.getElementById('hint');
const statusEl = document.getElementById('status');

let pdfBytes = null;      // ArrayBuffer
let pageCount = 0;
let fileName = '';

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` is-${kind}` : '');
}

// ── 读文件 ────────────────────────────────────────────────────
async function loadFile(file) {
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    setStatus('这不是 PDF 文件。', 'error');
    return;
  }

  setStatus('读取中…');
  extractBtn.disabled = true;

  try {
    const buf = await file.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(buf, { updateMetadata: false });
    pdfBytes = buf;
    pageCount = doc.getPageCount();
    fileName = file.name;

    drop.classList.add('has-file');
    dropText.textContent = fileName;
    fileInfo.hidden = false;
    const size = file.size < 1048576
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : `${(file.size / 1048576).toFixed(1)} MB`;
    fileInfo.innerHTML = `共 <strong>${pageCount}</strong> 页 · ${size}`;
    hint.textContent = `可填 1–${pageCount}`;
    rangeInput.value = pageCount > 1 ? `1-${pageCount}` : '1';
    validate();
  } catch (err) {
    reset();
    const encrypted = /encrypt|password/i.test(String(err && err.message));
    setStatus(encrypted ? '这个 PDF 有密码保护，暂时处理不了。' : '这个 PDF 读不出来，可能文件损坏了。', 'error');
  }
}

function reset() {
  pdfBytes = null;
  pageCount = 0;
  fileName = '';
  drop.classList.remove('has-file');
  dropText.textContent = '点击选择，或把文件拖进来';
  fileInfo.hidden = true;
  hint.textContent = '支持 1-3 连续、2,5,7 不连续、4 单页';
  extractBtn.disabled = true;
  input.value = '';
}

// ── 页码解析：1-3 / 2,5,7 / 4 / 2-4,7 ────────────────────────
function parseRange(raw) {
  const pages = new Set();
  const parts = raw.split(/[,，、\s]+/).filter(Boolean);

  for (const part of parts) {
    const m = part.match(/^(\d+)(?:[-–—~](\d+))?$/);
    if (!m) return { error: `看不懂「${part}」` };

    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < 1) return { error: '页码从 1 开始' };
    if (a > b) return { error: `${a}-${b} 起始页比结束页大` };
    if (b > pageCount) return { error: `只有 ${pageCount} 页，填到 ${b} 超了` };
    for (let i = a; i <= b; i++) pages.add(i);
  }

  if (!pages.size) return { error: '还没填页码' };
  return { pages: [...pages].sort((x, y) => x - y) };
}

function validate() {
  if (!pageCount) { extractBtn.disabled = true; return null; }

  const result = parseRange(rangeInput.value.trim());
  if (result.error) {
    extractBtn.disabled = true;
    setStatus(result.error, 'error');
    return null;
  }

  extractBtn.disabled = false;
  const n = result.pages.length;
  setStatus(n === pageCount ? `全部 ${n} 页` : `将提取 ${n} 页：${summarize(result.pages)}`);
  return result.pages;
}

// 1,2,3,7 → "1-3, 7"
function summarize(pages) {
  const out = [];
  let start = pages[0];
  let prev = pages[0];
  for (let i = 1; i <= pages.length; i++) {
    const cur = pages[i];
    if (cur === prev + 1) { prev = cur; continue; }
    out.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return out.join(', ');
}

// ── 提取 ──────────────────────────────────────────────────────
async function extract() {
  const pages = validate();
  if (!pages) return;

  extractBtn.disabled = true;
  setStatus('提取中…');

  try {
    const src = await PDFLib.PDFDocument.load(pdfBytes, { updateMetadata: false });
    const out = await PDFLib.PDFDocument.create();
    const copied = await out.copyPages(src, pages.map(p => p - 1));  // 零基
    copied.forEach(page => out.addPage(page));

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const base = fileName.replace(/\.pdf$/i, '');
    download(blob, `${base}-p${summarize(pages).replace(/,\s*/g, '_')}.pdf`);
    setStatus(`已导出 ${pages.length} 页`, 'done');
  } catch (err) {
    console.error('[extract-pdf]', err);
    setStatus('提取失败：' + (err && err.message ? err.message : '未知错误'), 'error');
  } finally {
    extractBtn.disabled = !pageCount;
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ── 事件 ──────────────────────────────────────────────────────
input.addEventListener('change', e => loadFile(e.target.files[0]));

rangeInput.addEventListener('input', validate);
rangeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !extractBtn.disabled) extract();
});

extractBtn.addEventListener('click', extract);

// 拖拽
['dragenter', 'dragover'].forEach(evt =>
  drop.addEventListener(evt, e => {
    e.preventDefault();
    drop.classList.add('is-over');
  })
);
['dragleave', 'drop'].forEach(evt =>
  drop.addEventListener(evt, e => {
    e.preventDefault();
    drop.classList.remove('is-over');
  })
);
drop.addEventListener('drop', e => {
  const file = e.dataTransfer && e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// 整页拦截：文件掉在拖放区外面时别让浏览器把页面替换成 PDF
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
