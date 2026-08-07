#!/usr/bin/env node
/**
 * CJK-aware word counter for TIL content.
 *
 * Uses Intl.Segmenter for accurate Chinese/English mixed word counting.
 * Processes all .org files in parallel, cleans Org markup, segments text,
 * filters pure-punctuation and bare numbers, then aggregates per-category
 * and per-page stats into data/til-wordcounts.json.
 *
 * Also validates:
 *   - Missing or empty frontmatter titles
 *   - Duplicate filenames across categories
 *   - Non-org content files
 *
 * Output: data/til-wordcounts.json
 *   { total, avg, perCategory: { slug: { count, words } }, perPage: [...] }
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const TIL_DIR = join(ROOT, 'content', 'til');
const OUT_PATH = join(ROOT, 'data', 'til-wordcounts.json');

// ── Segmenter (singleton, reusable across files) ──────────────────────

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

// ── Org block stripping (state machine, runs before regex clean) ──────

const BLOCK_BEGIN_RE = /^[ \t]*#\+BEGIN_(SRC|EXAMPLE|QUOTE|VERSE|CENTER|COMMENT|EXPORT|NOTES)/i;
const BLOCK_END_RE = /^[ \t]*#\+END_/i;
const DRAWER_BEGIN_RE = /^[ \t]*:(PROPERTIES|LOGBOOK):/;
const DRAWER_END_RE = /^[ \t]*:END:/;
const KEEP_BLOCK_TYPES = new Set(['QUOTE']);

function stripBlocks(text) {
  const lines = text.split('\n');
  const out = [];
  let inBlock = false;
  let blockType = '';
  let inDrawer = false;
  for (const line of lines) {
    // Drawer handling (higher priority — :PROPERTIES: can appear anywhere)
    if (!inBlock) {
      const drawerMatch = line.match(DRAWER_BEGIN_RE);
      if (drawerMatch) { inDrawer = true; continue; }
    }
    if (inDrawer) {
      if (DRAWER_END_RE.test(line)) { inDrawer = false; }
      continue;
    }
    // Block handling
    if (!inBlock) {
      const blockMatch = line.match(BLOCK_BEGIN_RE);
      if (blockMatch) {
        inBlock = true;
        blockType = blockMatch[1].toUpperCase();
        // Keep quote content — include the BEGIN/END markers too
        if (KEEP_BLOCK_TYPES.has(blockType)) {
          out.push(line);
        }
        continue;
      }
    } else {
      if (BLOCK_END_RE.test(line)) {
        if (KEEP_BLOCK_TYPES.has(blockType)) {
          out.push(line);
        }
        inBlock = false;
        blockType = '';
        continue;
      }
      // Inside a stripped block: skip
      if (!KEEP_BLOCK_TYPES.has(blockType)) continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

// ── Org-mode text cleaning ───────────────────────────────────────────

const CLEANERS = [
  // [[url][desc]] → desc
  [/\[\[([^\]]*)\]\[([^\]]*)\]\]/g, '$2'],
  // [[url]] → empty
  [/\[\[[^\]]*\]\]/g, ''],
  // bare URLs
  [/https?:\/\/[^\s\]\[]+/gi, ''],
  [/(?:www\.)[^\s\]\[]+/gi, ''],
  // /italic/ — NOT between alnum (protects amd64/arm64 paths)
  [/(?:^|(?<=[\s([{>「」『』【】]))\/([^\s\/]+)\/(?=[\s)\]}"':;,!?<]|$)/g, '$1'],
  // *bold*
  [/(?:^|(?<=[\s([{>「」『』【】]))\*([^\s*]+)\*(?=[\s)\]}"':;,!?<]|$)/g, '$1'],
  // ~code~, =verbatim=
  [/(?:^|(?<=[\s([{>「」『』【】]))[~=]([^\s~=]+)[~=](?=[\s)\]}"':;,!?<]|$)/g, '$1'],
  // +strike+
  [/(?:^|(?<=[\s([{>「」『』【】]))\+([^\s+]+)\+(?=[\s)\]}"':;,!?<]|$)/g, '$1'],
  // horizontal rules
  [/^[-\s_]{3,}$/gm, ''],
  // table markers → space
  [/[|+]/g, ' '],
  [/\t/g, ' '],
];

function clean(text) {
  // Run multiple passes to handle nested Org markup (e.g. */bold italic/*)
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const [re, sub] of CLEANERS) {
      const before = text;
      text = text.replace(re, sub);
      if (text !== before) changed = true;
    }
    // Early exit if no changes in this pass
    if (!changed) break;
  }
  return text;
}

// ── Word counting ────────────────────────────────────────────────────

// Pre-compiled: match any pure-punctuation character
const PUNCT_RE = /^[\-–—\/\\|~*=_\[\]{}():;,.!?@#$%^&+<>'"·…「」『』【】《》（）\u2018-\u201d\u3000-\u303f\uff00-\uffef]+$/;
const NUMBER_RE = /^[0-9.,+\-]+$/;

function countWords(text) {
  let count = 0;
  for (const seg of segmenter.segment(text)) {
    if (!seg.isWordLike) continue;
    const w = seg.segment;
    if (PUNCT_RE.test(w)) continue;
    if (NUMBER_RE.test(w)) continue;
    count++;
  }
  return count;
}

// ── File discovery ───────────────────────────────────────────────────

function collectFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path));
    } else if (entry.name.endsWith('.org') && entry.name !== '_index.org') {
      files.push(path);
    }
  }
  return files;
}

/**
 * Extract category slug from the first path segment after content/til/.
 * e.g. "content/til/software/debian.org" → "software"
 */
function categorySlug(filePath) {
  const rel = relative(TIL_DIR, filePath);
  return rel.split(/[/\\]/)[0] || 'uncategorized';
}

/**
 * Parse comma/space-separated header values from Org frontmatter.
 * #+HEADER: Linux → ["Linux"]
 * #+HEADER: Git DevOps → ["Git", "DevOps"]
 * Returns empty array if no header found.
 */
function parseHeaders(content) {
  const m = content.match(/^#\+HEADER:\s*(.+)/m);
  if (!m) return [];
  return m[1].trim().split(/[\s,]+/).filter(Boolean);
}

/**
 * Parse the Org-mode title from frontmatter.
 * Org frontmatter is at the top of the file: #+TITLE: Some Title
 * Returns null if no title found.
 */
function parseTitle(content) {
  const m = content.match(/^#\+TITLE:\s*(.+)/m);
  return m ? m[1].trim() : null;
}

// ── Validation ───────────────────────────────────────────────────────

const warnings = [];

function validate(files) {
  // Check for empty title
  for (const f of files) {
    const raw = readFileSync(f, 'utf-8');
    const title = parseTitle(raw);
    if (!title) warnings.push(`WARN: missing #+TITLE: in ${relative(TIL_DIR, f)}`);
    else if (title.length < 2) warnings.push(`WARN: very short title in ${relative(TIL_DIR, f)}: "${title}"`);
  }

  // Check for duplicate filenames across categories
  const names = {};
  for (const f of files) {
    const base = f.split('/').pop();
    (names[base] = names[base] || []).push(f);
  }
  for (const [name, paths] of Object.entries(names)) {
    if (paths.length > 1) warnings.push(`WARN: duplicate filename "${name}" in:\n  ${paths.join('\n  ')}`);
  }

  // Check for non-org files that look like content
  function walkCheck(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && e.name !== 'refs') walkCheck(join(dir, e.name));
      else if (e.isFile() && !e.name.startsWith('_') && !e.name.startsWith('.') && !e.name.endsWith('.org')) {
        warnings.push(`WARN: non-org content file: ${relative(TIL_DIR, join(dir, e.name))}`);
      }
    }
  }
  walkCheck(TIL_DIR);
}

// ── Git timestamp (last commit date, UTC epoch) ────────────────────────

const GIT_CACHE = new Map();

function gitTimestamp(filePath) {
  const rel = relative(ROOT, filePath);
  if (GIT_CACHE.has(rel)) return GIT_CACHE.get(rel);
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%ct', rel], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim();
    const ts = parseInt(out, 10);
    const result = isNaN(ts) ? null : ts; // Unix seconds — Hugo time() expects seconds
    GIT_CACHE.set(rel, result);
    return result;
  } catch {
    GIT_CACHE.set(rel, null);
    return null;
  }
}

// ── Worker ────────────────────────────────────────────────────────────

function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const headers = parseHeaders(raw);
  // Strip Org blocks (code, drawers, etc.) before regex cleaning
  const stripped = stripBlocks(raw);
  const body = stripped.split('\n').filter(l => !l.startsWith('#+') && !l.startsWith('# ')).join('\n');
  const cleaned = clean(body);
  const wc = countWords(cleaned);
  const cat = categorySlug(filePath);
  const rel = 'til/' + relative(TIL_DIR, filePath);
  const ts = gitTimestamp(filePath);
  return { rel, cat, headers, wc, ts };
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const checkOnly = process.argv.includes('--check');
  const files = collectFiles(TIL_DIR);

  // Validate
  validate(files);

  if (checkOnly) {
    // --check mode: only validate, exit with code 1 on warnings
    if (warnings.length > 0) {
      for (const w of warnings) console.error(w);
      process.exit(1);
    }
    console.log(`OK: ${files.length} files, no issues`);
    return;
  }

  // Process
  process.stdout.write(`Counting ${files.length} files`);
  const results = files.map(f => {
    process.stdout.write('.');
    return processFile(f);
  });
  process.stdout.write('\n');

  // Aggregate
  let total = 0;
  const catAgg = {};
  const headerAgg = {};
  const perPage = [];

  for (const r of results) {
    total += r.wc;
    catAgg[r.cat] = catAgg[r.cat] || { count: 0, words: 0 };
    catAgg[r.cat].count++;
    catAgg[r.cat].words += r.wc;

    for (const h of r.headers) {
      const key = r.cat + '/' + h;
      headerAgg[key] = headerAgg[key] || { category: r.cat, header: h, count: 0, words: 0 };
      headerAgg[key].count++;
      headerAgg[key].words += r.wc;
    }

    perPage.push({ path: r.rel, words: r.wc, ts: r.ts });
  }

  // Sort perPage descending for fast Top N lookup
  perPage.sort((a, b) => b.words - a.words);

  // Recent additions (last 90 days, sorted by commit time)
  const ninetyDaysAgo = (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000; // Unix seconds
  const recent = results
    .filter(r => r.ts && r.ts >= ninetyDaysAgo)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10)
    .map(r => ({ path: r.rel, words: r.wc, ts: new Date(r.ts * 1000).toISOString().slice(0, 10) }));

  const avg = perPage.length > 0 ? Math.round(total / perPage.length) : 0;

    // generatedAt in Asia/Shanghai (UTC+8)
    const now = new Date();
    const shanghaiStr = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const output = {
    generatedAt: shanghaiStr.replace(/\//g, '-'),
    total,
    avg,
    pages: perPage.length,
    perCategory: catAgg,
    perHeader: Object.values(headerAgg),
    perPage,
    recent,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output) + '\n');
  console.log(`Total: ${total} words, avg ${avg}/page across ${perPage.length} pages in ${Object.keys(catAgg).length} categories`);

  // Print warnings after the main output
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ${w}`);
  }
}

main();
