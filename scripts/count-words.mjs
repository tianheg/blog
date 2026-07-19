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

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const TIL_DIR = join(ROOT, 'content', 'til');
const OUT_PATH = join(ROOT, 'data', 'til-wordcounts.json');

// ── Segmenter (singleton, reusable across files) ──────────────────────

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

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
  for (const [re, sub] of CLEANERS) text = text.replace(re, sub);
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

// ── Worker ────────────────────────────────────────────────────────────

function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const headers = parseHeaders(raw);
  const body = raw.split('\n').filter(l => !l.startsWith('#+')).join('\n');
  const cleaned = clean(body);
  const wc = countWords(cleaned);
  const cat = categorySlug(filePath);
  const rel = 'til/' + relative(TIL_DIR, filePath);
  return { rel, cat, headers, wc };
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

    perPage.push({ path: r.rel, words: r.wc });
  }

  // Sort perPage descending for fast Top N lookup
  perPage.sort((a, b) => b.words - a.words);

  const avg = perPage.length > 0 ? Math.round(total / perPage.length) : 0;

  const output = {
    generatedAt: new Date().toISOString(),
    total,
    avg,
    pages: perPage.length,
    perCategory: catAgg,
    perHeader: Object.values(headerAgg),
    perPage,
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
