#!/usr/bin/env node
/**
 * embed.mjs — 语义索引模块（2026-10-07 由 generate-embeddings.mjs + generate-related.py 合并）
 *
 *   node scripts/embed.mjs           全量：抽取 → Workers AI 嵌入 → 关联笔记（= npm run embed）
 *   node scripts/embed.mjs related   只重算 data/related.json（= npm run related）
 *   node scripts/embed.mjs --help
 *
 * 产物:
 *   static/pagefind-semantic/{pages.json,embeddings.bin,manifest.json} + public/ 镜像
 *   data/related.json —— cosine ≥0.62 Top5，排除自链与正文已显式链接（Hugo 构建时渲染）
 *
 * related 是 python(numpy) 版的 node 零依赖移植：f32 向量逐行点积、
 * 排序键 (score desc, index asc)、输出与原 json.dump 分隔符/键序逐字节同构。
 *
 * 凭据：CF_API_TOKEN env，或 /root/.hermes/secrets/pve.env（secrets-helper.sh 读取）。
 */
import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  readdirSync, statSync, copyFileSync, rmSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';


const BLOG_ROOT = join(import.meta.dirname, "..");
const argvAll = process.argv.slice(2);
const SUB = argvAll[0] || "embed";
const HELP = `embed.mjs — 语义索引模块
用法: node scripts/embed.mjs [embed|related]

  embed（默认）  全量管线：文本抽取 → Workers AI 嵌入(BGE-M3) → 重算关联笔记
  related        只重算 data/related.json（读 static/pagefind-semantic/embeddings.bin）
  -h, --help     显示本帮助

npm 名字未变: npm run embed / npm run related`;

if (["-h", "--help", "help"].includes(SUB)) { console.log(HELP); process.exit(0); }
if (!["embed", "related"].includes(SUB)) {
  console.error(`✗ 未知子命令: ${SUB}\n`);
  console.log(HELP);
  process.exit(2);
}
process.argv = [process.argv[0], process.argv[1], ...argvAll.slice(1)];

/** generate-related.py 的 node 移植（数据源/规则/输出格式与原版一致） */
function relatedMain() {
  const SEM = join(BLOG_ROOT, "static", "pagefind-semantic");
  const OUTF = join(BLOG_ROOT, "data", "related.json");
  const CONTENT = join(BLOG_ROOT, "content");
  const TOP_N = 5, MIN_SCORE = 0.62;

  const pages = JSON.parse(readFileSync(join(SEM, "pages.json"), "utf-8"));
  const manifest = JSON.parse(readFileSync(join(SEM, "manifest.json"), "utf-8"));
  const dim = manifest.dim ?? 1024;
  const raw = readFileSync(join(SEM, "embeddings.bin"));
  if (raw.byteLength !== pages.length * dim * 4) {
    console.error(`ERROR: embeddings 与 pages.json 不匹配（${raw.byteLength / 4} != ${pages.length}×${dim}），先跑 node scripts/embed.mjs embed`);
    process.exit(2);
  }
  const vec = new Float32Array(raw.buffer, raw.byteOffset, pages.length * dim);

  // 文件名/标题 → permalink（先到先得，与原版 setdefault 一致）
  const idx = new Map();
  for (const p of pages) {
    const base = p.url.replace(/^\/+|\/+$/g, "").split("/").pop().toLowerCase();
    if (!idx.has(base)) idx.set(base, p.url);
    if (p.title) {
      const t = p.title.trim().toLowerCase();
      if (!idx.has(t)) idx.set(t, p.url);
    }
  }

  // 正文里已经显式指向的页面（Markdown 内链 + wikilink）→ 不进 top-N
  const cache = new Map();
  function explicitLinks(permalink) {
    if (cache.has(permalink)) return cache.get(permalink);
    const out = new Set();
    const rel = permalink.replace(/^\/+|\/+$/g, "");
    let text = "";
    try { text = readFileSync(join(CONTENT, rel + ".md"), "utf-8"); } catch { /* 区段页无 md → 空集 */ }
    if (text) {
      for (const m of text.matchAll(/\]\((\/[^\)\s#]+)\)/g)) {
        out.add(m[1].endsWith("/") ? m[1] : m[1] + "/");
      }
      for (const m of text.matchAll(/\[\[([^\]\[]+)\]\]/g)) {
        const name = m[1].split("|")[0].split("#")[0].trim().toLowerCase();
        if (idx.has(name)) out.add(idx.get(name));
      }
    }
    cache.set(permalink, out);
    return out;
  }

  const related = {};
  const scores = new Float64Array(pages.length);
  for (let i = 0; i < pages.length; i++) {
    const off = i * dim;
    for (let j = 0; j < pages.length; j++) {
      const oj = j * dim;
      let s = 0;
      for (let k = 0; k < dim; k++) s += vec[off + k] * vec[oj + k];
      scores[j] = s;
    }
    const order = Array.from({ length: pages.length }, (_, j) => j)
      .sort((a, b) => (scores[b] - scores[a]) || (a - b));
    const skip = explicitLinks(pages[i].url);
    const picks = [];
    for (const j of order) {
      if (j === i) continue;
      if (skip.has(pages[j].url)) continue;
      if (scores[j] < MIN_SCORE) break;
      picks.push(pages[j].url);
      if (picks.length >= TOP_N) break;
    }
    if (picks.length) related[pages[i].url] = picks;
  }

  writeFileSync(OUTF, JSON.stringify(related));
  const vals = Object.values(related);
  const total = vals.reduce((a, v) => a + v.length, 0);
  console.log(`data/related.json: ${vals.length} 篇有相关笔记（平均 ${(total / vals.length).toFixed(1)} 条，共 ${total} 条关系）`);
  console.log(`  ${(statSync(OUTF).size / 1024).toFixed(0)} KB，阈值 ${MIN_SCORE} / Top ${TOP_N}`);
  return 0;
}

switch (SUB) {
  case "related": {
    process.exit(relatedMain());
  }
  case "embed": {
/**
 * generate-embeddings.mjs
 *
 * Crawls public/ HTML files after Hugo build + PageFind, extracts page text,
 * generates BGE-M3 embeddings via Cloudflare Workers AI REST API (build-time,
 * not runtime — this is what kills the old cold-start stall), and writes:
 *
 *   static/pagefind-semantic/
 *     ├─ pages.json        (metadata: url, title)
 *     ├─ embeddings.bin    (L2-normalized Float32Array, raw binary)
 *     └─ manifest.json     (count, updated, contentHash — informational only)
 *
 * The Worker at runtime fetches embeddings.bin + pages.json from ASSETS and
 * only embeds the query — no KV, no cold-start re-embedding of all pages.
 *
 * Requires a Cloudflare API token with Workers AI access
 * (permission: Account → Workers AI → Read; account ACCOUNT_ID below):
 *   - env CF_API_TOKEN, or
 *   - CF_API_TOKEN in the local secrets store (/root/.hermes/secrets/pve.env),
 *     read via ~/.hermes/scripts/secrets-helper.sh (Infisical retired 2026-09-30)
 *
 * Do NOT reintroduce a "scrape a Bearer token out of ~/.hermes/config.yaml"
 * fallback. It picks up some *other* MCP server's token and fails with a
 * misleading 401 (2026-09-13 incident: it grabbed the context7 header).
 *
 * Run (after `npm run build`): node scripts/embed.mjs embed（npm run embed）
 */


const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');
const OUT_DIR = join(import.meta.dirname, '..', 'static', 'pagefind-semantic');

const MODEL = '@cf/baai/bge-m3';
const DIM = 1024;
// Long pages are split into chunks of this many characters, embedded
// separately, then mean-pooled into one vector per page — so no page is
// truncated. 3000 chars keeps a Chinese chunk comfortably inside BGE-M3's
// 8192-token window (the previous hard `slice(0, 3000)` dropped the whole tail
// of 185/1526 pages; /posts/javascript/ lost 96% of its text).
const CHUNK_SIZE = 3000;
const BATCH_SIZE = 16;
const CONCURRENCY = 4;
const ACCOUNT_ID = 'b0dda00db555f237f277259bed93134b';

const SKIP_DIRS = ['pagefind', 'tags', 'categories', 'feeds', 'links', 'music', 'musical', 'search', 'sentences', 'service', 'support', 'uses', 'watch'];

function shouldInclude(relPath) {
  for (const prefix of SKIP_DIRS) {
    if (relPath.startsWith(prefix + '/') || relPath === prefix + '.html' || relPath.startsWith(prefix + '-')) {
      return false;
    }
  }
  return true;
}

/** Recursively find .html files */
function findHtmlFiles(dir, rootDir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.includes(entry.name)) continue;
      files.push(...findHtmlFiles(fullPath, rootDir));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Decode the HTML entities Hugo writes into <title> / body text.
 * Without this the index stores markup instead of text: a title like
 * `Pagefind &#43; Hugo` gets embedded (and displayed) verbatim, and the
 * 2026-09-13 template change that started escaping titles silently changed
 * every vector. Called on both title and body so upstream escaping can't
 * leak into the index.
 */
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', middot: '·', times: '×',
  laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => {
      const cp = parseInt(h, 16);
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    })
    .replace(/&#(\d+);/g, (m, d) => {
      const cp = Number(d);
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    })
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

function extractPageContent(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch
    ? decodeEntities(titleMatch[1].replace(/\s*\|\s*Tianhe Gao$/, '')).trim()
    : '';

  const bodyMatch = html.match(/<article[^>]*data-pagefind-body[^>]*>([\s\S]*?)<\/article>/i);
  if (!bodyMatch) return null;

  const text = bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+|#x[0-9a-f]+);/gi, (m) => decodeEntities(m))
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;

  return { title, text };
}

/**
 * Split page text into CHUNK_SIZE pieces, preferring sentence boundaries so a
 * chunk never starts mid-sentence. Falls back to a hard cut when the trailing
 * half of the window contains no terminator (e.g. a long code block).
 */
function splitIntoChunks(text, limit) {
  if (text.length <= limit) return [text];

  const chunks = [];
  let pos = 0;
  while (pos < text.length) {
    let end = Math.min(pos + limit, text.length);
    if (end < text.length) {
      const from = pos + Math.floor(limit / 2);
      let cut = -1;
      for (const m of text.slice(from, end).matchAll(/[。！？；;.!?…]+[\s"”’)]*/g)) {
        cut = from + m.index + m[0].length;
      }
      if (cut > pos) end = cut;
    }
    const chunk = text.slice(pos, end).trim();
    if (chunk) chunks.push(chunk);
    pos = end;
  }

  // Fold a stub tail (a few chars left after a hard cut) into the previous
  // chunk instead of spending a whole API call on it. Worst case a chunk grows
  // to CHUNK_SIZE + 1 + TAIL_FOLD chars, still far below BGE-M3's token window.
  const TAIL_FOLD = 200;
  if (chunks.length > 1 && chunks[chunks.length - 1].length < TAIL_FOLD) {
    chunks[chunks.length - 2] += ' ' + chunks.pop();
  }

  return chunks;
}

const SECRETS_HELPER = join(process.env.HOME || '/root', '.hermes', 'scripts', 'secrets-helper.sh');

async function getApiToken() {
  if (process.env.CF_API_TOKEN) return process.env.CF_API_TOKEN;

  // Fallback: CF_API_TOKEN from the local secrets store (/root/.hermes/secrets/
  // pve.env), read through the shared helper (default output = all keys as
  // KEY=value lines; only the CF_API_TOKEN line is used, never logged).
  // Never scrape ~/.hermes/config.yaml for a Bearer token — see the header.
  if (existsSync(SECRETS_HELPER)) {
    try {
      const out = execFileSync(SECRETS_HELPER, { encoding: 'utf-8', timeout: 20000 });
      for (const line of out.split('\n')) {
        const m = line.match(/^\s*(?:export\s+)?CF_API_TOKEN\s*=\s*(.*)$/);
        if (!m) continue;
        const value = m[1].trim().replace(/^'(.*)'$/, '$1').replace(/^\s*"(.*)"\s*$/, '$1');
        if (value) return value;
      }
    } catch { /* fall through to the error below */ }
  }

  throw new Error(
    'No Cloudflare API token with Workers AI access found. Fix one of:\n' +
    '  a) put it in the local secrets store (picked up automatically next run):\n' +
    '       /root/.hermes/secrets/pve.env  →  CF_API_TOKEN=<token>   (mode 600)\n' +
    '     token needs: Account → Workers AI → Read  (account ' + ACCOUNT_ID + ')\n' +
    '  b) one-off run:  CF_API_TOKEN=<token> npm run embed\n' +
    '(note: Infisical was retired 2026-09-30 — the store is pve.env now,\n' +
    ' read through ~/.hermes/scripts/secrets-helper.sh)'
  );
}

async function embedBatch(token, texts) {
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: texts }),
    },
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`AI API ${resp.status}: ${err.slice(0, 200)}`);
  }
  const json = await resp.json();
  return json.result.data; // array of arrays (batchSize x DIM)
}

/** Generate embeddings for all texts, CONCURRENCY parallel batches, retry on failure */
async function generateEmbeddings(token, texts) {
  const batches = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const all = new Float32Array(texts.length * DIM);
  const queue = batches.map((batch, idx) => ({ batch, idx }));
  let done = 0;

  async function worker() {
    while (queue.length) {
      const { batch, idx } = queue.shift();
      let data;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          data = await embedBatch(token, batch);
          break;
        } catch (e) {
          if (attempt === 2) throw e;
          console.log(`  batch ${idx} failed (${e.message}), retry ${attempt + 1}/3...`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
      for (let i = 0; i < batch.length; i++) {
        const vec = data[i];
        if (!vec || vec.length !== DIM) throw new Error(`Bad embedding at batch ${idx} item ${i}`);
        all.set(vec, (idx * BATCH_SIZE + i) * DIM);
      }
      done++;
      if (done % 20 === 0 || done === batches.length) {
        console.log(`  embedded ${done}/${batches.length} batches`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker));
  return all;
}

/** L2-normalize every row in place so runtime similarity is a pure dot product */
function normalize(embeddings) {
  for (let i = 0; i < embeddings.length; i += DIM) {
    let mag = 0;
    for (let j = 0; j < DIM; j++) mag += embeddings[i + j] ** 2;
    mag = Math.sqrt(mag);
    if (mag > 0) {
      for (let j = 0; j < DIM; j++) embeddings[i + j] /= mag;
    }
  }
}

async function main() {
  const files = findHtmlFiles(PUBLIC_DIR, PUBLIC_DIR);
  const seen = new Set();
  const pages = [];

  for (const filePath of files) {
    const html = readFileSync(filePath, 'utf-8');
    if (!html.includes('data-pagefind-body')) continue;

    const page = extractPageContent(html);
    if (!page) continue;

    const relPath = relative(PUBLIC_DIR, filePath);
    if (!shouldInclude(relPath)) continue;

    let url = '/' + relPath.replace(/\/index\.html$/, '/');
    if (relPath === 'index.html') url = '/';

    // Normalise and deduplicate
    url = url.replace(/\/+/g, '/');
    if (seen.has(url)) continue;
    seen.add(url);

    pages.push({
      url,
      title: page.title,
      text: page.text,
    });
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));

  console.log(`Extracted ${pages.length} pages`);

  if (pages.length === 0) {
    console.error('No pages found! Check public/ directory.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const pagesMeta = pages.map(p => ({ url: p.url, title: p.title }));
  writeFileSync(join(OUT_DIR, 'pages.json'), JSON.stringify(pagesMeta, null, 2));
  console.log(`  pages.json: ${(Buffer.byteLength(JSON.stringify(pagesMeta), 'utf-8') / 1024).toFixed(1)} KB`);

  // Remove the old runtime-embedding source — the Worker no longer needs it
  rmSync(join(OUT_DIR, 'pages-content.json'), { force: true });

  // Flatten every page into embedding-sized chunks, remembering which page
  // each chunk came from so the vectors can be mean-pooled back together.
  const chunkTexts = [];
  const pageOfChunk = [];
  for (let pi = 0; pi < pages.length; pi++) {
    for (const chunk of splitIntoChunks(pages[pi].text, CHUNK_SIZE)) {
      chunkTexts.push(chunk);
      pageOfChunk.push(pi);
    }
  }

  const chunkCounts = new Uint32Array(pages.length);
  for (const pi of pageOfChunk) chunkCounts[pi]++;
  let longest = 0;
  for (const n of chunkCounts) if (n > longest) longest = n;

  // Generate embeddings via Workers AI (build-time, ~1-2 min)
  const token = await getApiToken();
  console.log('Generating embeddings via Workers AI (BGE-M3)...');
  console.log(
    `  chunks: ${chunkTexts.length} from ${pages.length} pages ` +
    `(mean ${(chunkTexts.length / pages.length).toFixed(2)}/page, max ${longest}/page)`
  );
  const chunkVectors = await generateEmbeddings(token, chunkTexts);

  // Mean-pool each page's chunk vectors, then L2-normalize the page vector.
  const embeddings = new Float32Array(pages.length * DIM);
  for (let ci = 0; ci < chunkTexts.length; ci++) {
    const pageOffset = pageOfChunk[ci] * DIM;
    const chunkOffset = ci * DIM;
    for (let j = 0; j < DIM; j++) embeddings[pageOffset + j] += chunkVectors[chunkOffset + j];
  }
  for (let pi = 0; pi < pages.length; pi++) {
    const n = chunkCounts[pi] || 1;
    const offset = pi * DIM;
    for (let j = 0; j < DIM; j++) embeddings[offset + j] /= n;
  }
  normalize(embeddings);

  const binPath = join(OUT_DIR, 'embeddings.bin');
  writeFileSync(binPath, Buffer.from(embeddings.buffer));
  console.log(`  embeddings.bin: ${(embeddings.buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

  const contentHash = createHash('sha256')
    .update(readFileSync(join(OUT_DIR, 'pages.json')))
    .digest('hex')
    .slice(0, 12);

  const manifest = {
    count: pages.length,
    updated: new Date().toISOString(),
    contentHash,
    model: MODEL,
    dim: DIM,
    chunkSize: CHUNK_SIZE,
    pooling: 'mean',
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest));
  console.log(`  manifest.json: count=${manifest.count}, hash=${manifest.contentHash}`);

  // Mirror to public/ — wrangler.jsonc serves ./public as ASSETS, so the
  // deployed semantic index must live there. static/ copy stays in git as
  // the canonical source.
  const publicSemDir = join(PUBLIC_DIR, 'pagefind-semantic');
  if (existsSync(PUBLIC_DIR)) {
    mkdirSync(publicSemDir, { recursive: true });
    rmSync(join(publicSemDir, 'pages-content.json'), { force: true });
    for (const f of ['pages.json', 'embeddings.bin', 'manifest.json']) {
      copyFileSync(join(OUT_DIR, f), join(publicSemDir, f));
    }
    console.log(`Mirrored 3 files to ${publicSemDir}/`);
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

    relatedMain();
    process.exit(0);
  }
}

console.error("✗ 子命令未显式退出");
process.exit(2);
