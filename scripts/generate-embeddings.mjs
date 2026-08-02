#!/usr/bin/env node
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
 * Requires a Cloudflare API token with Workers AI access:
 *   - env CF_API_TOKEN, or
 *   - the MCP OAuth token in ~/.hermes/config.yaml (mcp_servers.cloudflare)
 *
 * Run (after `npm run build`): node scripts/generate-embeddings.mjs
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  readdirSync, statSync, copyFileSync, rmSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');
const OUT_DIR = join(import.meta.dirname, '..', 'static', 'pagefind-semantic');

const MODEL = '@cf/baai/bge-m3';
const DIM = 1024;
const BATCH_SIZE = 16;
const CONCURRENCY = 4;
const ACCOUNT_ID = 'b0dda00db555f237f277259bed93134b';

// Only include real content paths
const CONTENT_PREFIXES = ['posts', 'til', 'about', 'now', 'projects', 'important-now', 'code'];

const SKIP_DIRS = ['pagefind', 'tags', 'categories', 'changelog', 'feeds', 'links', 'music', 'musical', 'politics', 'search', 'sentences', 'service', 'support', 'uses', 'watch'];

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

function extractPageContent(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Tianhe Gao$/, '').trim() : '';

  const bodyMatch = html.match(/<article[^>]*data-pagefind-body[^>]*>([\s\S]*?)<\/article>/i);
  if (!bodyMatch) return null;

  const text = bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;

  return { title, text };
}

async function getApiToken() {
  if (process.env.CF_API_TOKEN) return process.env.CF_API_TOKEN;
  // Fallback: MCP OAuth token in ~/.hermes/config.yaml
  const configPath = join(process.env.HOME || '/root', '.hermes', 'config.yaml');
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const m = raw.match(/Authorization:\s*Bearer\s+(\S+)/);
    if (m) return m[1];
  } catch { /* fall through */ }
  throw new Error('No Cloudflare API token found. Set CF_API_TOKEN env var.');
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
      text: page.text.slice(0, 3000),
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

  // Generate embeddings via Workers AI (build-time, ~1-2 min for ~1400 pages)
  const token = await getApiToken();
  console.log('Generating embeddings via Workers AI (BGE-M3)...');
  const embeddings = await generateEmbeddings(token, pages.map(p => p.text));
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
