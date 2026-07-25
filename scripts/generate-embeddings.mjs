#!/usr/bin/env node
/**
 * generate-embeddings.mjs
 *
 * Crawls public/ HTML files after Hugo build + PageFind, extracts page text,
 * and saves to static/pagefind-semantic/ for the Worker to embed at runtime.
 *
 * Run: node scripts/generate-embeddings.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PUBLIC_DIR = join(import.meta.dirname, '..', 'public');
const OUT_DIR = join(import.meta.dirname, '..', 'static', 'pagefind-semantic');

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

function main() {
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

  const pagesContent = pages.map(p => ({ url: p.url, title: p.title, text: p.text }));
  writeFileSync(join(OUT_DIR, 'pages-content.json'), JSON.stringify(pagesContent));

  const contentSize = (Buffer.byteLength(JSON.stringify(pagesContent), 'utf-8') / 1024 / 1024).toFixed(1);
  console.log(`Written to ${OUT_DIR}/`);
  console.log(`  pages.json: ${(Buffer.byteLength(JSON.stringify(pagesMeta), 'utf-8') / 1024).toFixed(1)} KB`);
  console.log(`  pages-content.json: ${contentSize} MB`);

  // Generate manifest for KV cache invalidation
  const manifest = {
    count: pages.length,
    updated: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest));
  console.log(`  manifest.json: count=${manifest.count}, updated=${manifest.updated}`);
}

main();
