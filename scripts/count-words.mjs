#!/usr/bin/env node
/**
 * CJK-aware word counter for TIL content.
 * Uses Intl.Segmenter for accurate Chinese/English mixed word counting.
 * Outputs to data/til-wordcounts.json for Hugo to consume.
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const tilDir = new URL('../content/til', import.meta.url).pathname;
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

function stripFrontmatter(content) {
  // Remove Org-mode frontmatter lines (#+KEY: value) and Org directives
  return content.split('\n').filter(l => !l.startsWith('#+')).join('\n');
}

function countWords(text) {
  let count = 0;
  for (const seg of segmenter.segment(text)) if (seg.isWordLike) count++;
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
      const content = stripFrontmatter(readFileSync(path, 'utf-8'));
      const wc = countWords(content);
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
