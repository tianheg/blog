#!/usr/bin/env node
/**
 * CJK-aware word counter for TIL content.
 * Uses Intl.Segmenter for accurate Chinese/English mixed word counting.
 *
 * Cleaning pipeline:
 *   1. Strip Org frontmatter (#+KEY: value)
 *   2. Strip Org link syntax: [[url][text]] → text, [[url]] → ∅
 *   3. Strip bare URLs (http://, https://, www.)
 *   4. Strip Org inline markup with word-boundary guards
 *   5. Strip Org table and hr structural markers
 *   6. Segment and count only isWordLike tokens
 *
 * Outputs to data/til-wordcounts.json for Hugo to consume.
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const tilDir = new URL('../content/til', import.meta.url).pathname;

// Intl.Segmenter: CJK-aware word segmentation
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

/**
 * Strip Org-mode frontmatter lines.
 */
function stripFrontmatter(content) {
  return content.split('\n').filter(l => !l.startsWith('#+')).join('\n');
}

/**
 * Clean Org-mode markup from text, leaving only readable content.
 * Handles: links, URLs, inline markup, tables, horizontal rules.
 */
function cleanOrgMarkup(text) {
  // Org links: [[url][description]] → description
  text = text.replace(/\[\[([^\]]*)\]\[([^\]]*)\]\]/g, '$2');
  // Bare Org links: [[url]] → ∅
  text = text.replace(/\[\[[^\]]*\]\]/g, '');
  // Bare URLs
  text = text.replace(/https?:\/\/[^\s\]\[]+/gi, '');
  text = text.replace(/(?:www\.)[^\s\]\[]+/gi, '');
  // Org inline markup with word-boundary guards
  // /italic/ — not between alphanumeric chars (avoids amd64/arm64 false positives)
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\/([^\s\/]+)\/(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // *bold* — not ** or *** (literal asterisks in code)
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\*([^\s*]+)\*(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // ~code~ and =verbatim=
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))[~=]([^\s~=]+)[~=](?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // +strike-through+
  text = text.replace(/(?:^|(?<=[\s([{>「」『』【】]))\+([^\s+]+)\+(?=[\s)\]}"':;,!?<]|$)/g, '$1');
  // Org horizontal rules: -----, -----
  text = text.replace(/^[-\s_]{3,}$/gm, '');
  // Org table structural markers
  text = text.replace(/[|+]/g, ' ');          // table cell separators → space
  text = text.replace(/[-]{3,}/g, ' ');       // table dash-rows → space  
  return text;
}

/**
 * Count word-like tokens in text.
 * Uses Intl.Segmenter and filters out pure-punctuation tokens.
 */
function countWords(text) {
  let count = 0;
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) {
      const w = seg.segment;
      // Exclude pure punctuation
      if (/^[\-–—/\\|~*=_\[\]{}():;,.!?@#$%^&+<>'\"·…「」『』【】《》（）\u2018-\u201d\u3000-\u303f\uff00-\uffef]+$/.test(w)) continue;
      // Exclude bare numbers
      if (/^[0-9.,+\-]+$/.test(w)) continue;
      count++;
    }
  }
  return count;
}

function walk(dir) {
  let total = 0;
  const perPage = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const r = walk(path);
      total += r.total;
      perPage.push(...r.perPage);
    } else if (entry.name.endsWith('.org') && entry.name !== '_index.org') {
      const raw = readFileSync(path, 'utf-8');
      const cleaned = cleanOrgMarkup(stripFrontmatter(raw));
      const wc = countWords(cleaned);
      total += wc;
      perPage.push({ path: entry.name, words: wc });
    }
  }
  return { total, perPage };
}

const stats = walk(tilDir);
const outPath = new URL('../data/til-wordcounts.json', import.meta.url).pathname;
writeFileSync(outPath, JSON.stringify(stats));
console.log(`Total: ${stats.total} words across ${stats.perPage.length} pages`);
