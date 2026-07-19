#!/usr/bin/env node
/**
 * CJK-aware word counter for TIL content.
 * Uses Intl.Segmenter for accurate Chinese/English mixed word counting.
 *
 * Pipeline:
 *   1. Strip Org frontmatter (#+KEY: value)
 *   2. Strip Org link syntax: [[url][text]] → text, [[url]] → ∅
 *   3. Strip bare URLs (http://, https://, www.)
 *   4. Strip Org inline markup with word-boundary guards
 *   5. Strip Org table and hr structural markers
 *   6. Segment and count only word-like tokens (excl. pure numbers/punct)
 *
 * Output: data/til-wordcounts.json
 *   { total, perCategory: { slug: { count, words } }, perPage: [{ path, words }] }
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const TIL_DIR = join(ROOT, 'content/til');
const OUT_PATH = join(ROOT, 'data/til-wordcounts.json');

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

// ── Cleaning ──────────────────────────────────────────────────────────

function stripFrontmatter(content) {
  return content.split('\n').filter(l => !l.startsWith('#+')).join('\n');
}

function cleanOrgMarkup(text) {
  // [[url][desc]] → desc
  text = text.replace(/\[\[([^\]]*)\]\[([^\]]*)\]\]/g, '$2');
  // [[url]] → ∅
  text = text.replace(/\[\[[^\]]*\]\]/g, '');
  // bare URLs
  text = text.replace(/https?:\/\/[^\s\]\[]+/gi, '');
  text = text.replace(/(?:www\.)[^\s\]\[]+/gi, '');
  // /italic/ — not between alnum (avoids amd64/arm64)
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\/([^\s\/]+)\/(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // *bold*
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\*([^\s*]+)\*(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // ~code~, =verbatim=
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))[~=]([^\s~=]+)[~=](?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // +strike+
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\+([^\s+]+)\+(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // horizontal rules
  text = text.replace(/^[-\s_]{3,}$/gm, '');
  // table markers  
  text = text.replace(/[|+]/g, ' ');
  text = text.replace(/[-]{3,}/g, ' ');
  return text;
}

// ── Counting ──────────────────────────────────────────────────────────

function countWords(text) {
  let count = 0;
  for (const seg of segmenter.segment(text)) {
    if (!seg.isWordLike) continue;
    const w = seg.segment;
    if (/^[\-–—/\\|~*=_\[\]{}():;,.!?@#$%^&+<>'"·…「」『』【】《》（）\u2018-\u201d\u3000-\u303f\uff00-\uffef]+$/.test(w)) continue;
    if (/^[0-9.,+\-]+$/.test(w)) continue;
    count++;
  }
  return count;
}

// ── File walker ───────────────────────────────────────────────────────

/**
 * Extract category slug from file path relative to content/til/.
 * e.g. "content/til/software/debian.org" → "software"
 */
function getCategorySlug(filePath) {
  const rel = filePath.replace(TIL_DIR, '');
  const parts = rel.split('/').filter(Boolean);
  return parts[0] || 'uncategorized';
}

function walk(dir) {
  let total = 0;
  const perPage = [];
  const catTotals = {};

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const r = walk(path);
      total += r.total;
      perPage.push(...r.perPage);
      for (const [cat, c] of Object.entries(r.catTotals)) {
        catTotals[cat] = (catTotals[cat] || { count: 0, words: 0 });
        catTotals[cat].count += c.count;
        catTotals[cat].words += c.words;
      }
    } else if (entry.name.endsWith('.org') && entry.name !== '_index.org') {
      process.stdout.write('.');
      const raw = readFileSync(path, 'utf-8');
      const cleaned = cleanOrgMarkup(stripFrontmatter(raw));
      const wc = countWords(cleaned);
      total += wc;
      perPage.push({ path: entry.name, words: wc });

      const cat = getCategorySlug(path);
      catTotals[cat] = catTotals[cat] || { count: 0, words: 0 };
      catTotals[cat].count++;
      catTotals[cat].words += wc;
    }
  }

  return { total, perPage, catTotals };
}

// ── Main ──────────────────────────────────────────────────────────────

process.stdout.write('Counting');
const stats = walk(TIL_DIR);
process.stdout.write('\n');

// Sort perPage by words descending for longest/shortest lookups
stats.perPage.sort((a, b) => b.words - a.words);

const output = {
  total: stats.total,
  perCategory: stats.catTotals,
  perPage: stats.perPage,
};

writeFileSync(OUT_PATH, JSON.stringify(output));
console.log(`Total: ${stats.total} words across ${stats.perPage.length} pages in ${Object.keys(stats.catTotals).length} categories`);
