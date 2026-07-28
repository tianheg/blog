/**
 * blog Worker — Semantic Search API + Static Assets
 *
 * POST /api/semantic/search  { query } -> { results: [{ url, title, score }] }
 * GET  /*                       -> static assets from public/
 *
 * Prerequisites:
 *   - KV namespace "BLOG_EMBEDDINGS" bound as env.EMBEDDINGS_KV
 *   - Workers AI enabled
 *   - static/pagefind-semantic/ assets deployed under ASSETS binding
 */

const EMBEDDING_MODEL = '@cf/baai/bge-m3';
const EMBEDDING_DIM = 1024;
const KV_KEY = 'embeddings:v1';
const MAX_RESULTS = 10;
const BATCH_SIZE = 16;
const MANIFEST_PATH = '/pagefind-semantic/manifest.json';
const COMMENTS_BACKEND = 'https://comments.tianheg.co';

// Simple in-memory rate limiter (per-worker-isolate, resets on cold start)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateMap = new Map();

function checkRateLimit(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(ip, { windowStart: now, count: 1 });
    return null;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  return null;
}

// In-memory cache for page data + embeddings (lives as long as the isolate)
let pageCache = null;

async function loadManifest(env) {
  const resp = await env.ASSETS.fetch('https://fake' + MANIFEST_PATH);
  if (!resp.ok) return null;
  return resp.json();
}

async function loadPageData(env) {
  if (pageCache) return pageCache;

  // Check current asset version via manifest
  const manifest = await loadManifest(env);

  // Try KV first
  const cached = await env.EMBEDDINGS_KV.get(KV_KEY, { type: 'text' });
  if (cached) {
    const parsed = JSON.parse(cached);
    // Check if manifest count/updated matches — if not, KV is stale
    if (!manifest || (parsed.count === manifest.count && parsed.updated === manifest.updated)) {
      const buf = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0)).buffer;
      const embeddings = new Float32Array(buf);
      pageCache = {
        pages: parsed.pages,
        embeddings,
        dim: parsed.dim,
      };
      return pageCache;
    }
    // Stale cache — clear and regenerate
    await env.EMBEDDINGS_KV.delete(KV_KEY);
  }

  // Load from static assets
  const resp = await env.ASSETS.fetch('https://fake/pagefind-semantic/pages-content.json');
  const pagesContent = await resp.json();
  const pages = pagesContent.map(p => ({ url: p.url, title: p.title }));
  const texts = pagesContent.map(p => p.text);

  // Batch-embed all texts via Workers AI
  const allEmbeddings = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const aiResp = await env.AI.run(EMBEDDING_MODEL, {
      text: batch,
    });
    // BGE-M3 returns { data: [...], shape: [...] }
    const batchEmbeddings = aiResp.data || aiResp;
    for (const emb of batchEmbeddings) {
      allEmbeddings.push(...emb);
    }
  }

  const flatEmbeddings = new Float32Array(allEmbeddings);

  // Cache in KV as base64
  const bytes = new Uint8Array(flatEmbeddings.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64Data = btoa(binary);

  await env.EMBEDDINGS_KV.put(KV_KEY, JSON.stringify({
    v: 1,
    dim: EMBEDDING_DIM,
    count: pages.length,
    updated: manifest.updated,
    pages,
    data: b64Data,
  }));

  pageCache = { pages, embeddings: flatEmbeddings, dim: EMBEDDING_DIM };
  return pageCache;
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function handleSearch(request, env) {
  const body = await request.json();
  const query = (body.query || '').trim();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  const cache = await loadPageData(env);

  // Embed the query
  const aiResp = await env.AI.run(EMBEDDING_MODEL, {
    text: [query],
  });
  const queryEmbedding = new Float32Array(aiResp.data[0]);

  // Compute similarity
  const scored = [];
  const dim = cache.dim;
  for (let i = 0; i < cache.pages.length; i++) {
    const start = i * dim;
    const docVec = cache.embeddings.subarray(start, start + dim);
    const score = cosineSimilarity(queryEmbedding, docVec);
    scored.push({ ...cache.pages[i], score: +score.toFixed(4) });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_RESULTS);

  return Response.json({ results: top });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Semantic search API
    if (url.pathname === '/api/semantic/search' && request.method === 'POST') {
      // Rate limit check
      const rateLimitResp = checkRateLimit(request);
      if (rateLimitResp) return rateLimitResp;

      try {
        const resp = await handleSearch(request, env);
        const corsResp = new Response(resp.body, resp);
        corsResp.headers.set('Access-Control-Allow-Origin', '*');
        return corsResp;
      } catch (err) {
        return new Response(err.stack || err.message || String(err), {
          status: 500,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
      }
    }

    // Comments API proxy — same-origin, no CORS needed
    if (url.pathname === '/api/comment' && request.method === 'POST') {
      return proxyComments(request, url);
    }
    if (url.pathname.startsWith('/comments/')) {
      return proxyComments(request, url);
    }
    // Artalk static assets proxy (same-origin)
    if (url.pathname.startsWith('/dist/Artalk.')) {
      return proxyArtalkAsset(request, url);
    }

    // Fall through to static assets
    const asset = await env.ASSETS.fetch(request);
    // SPA fallback: 如果 /projects/music/* 返回 404，serve index.html
    if (!asset.ok && url.pathname.startsWith('/projects/music/')) {
      const spaUrl = new URL('/projects/music/index.html', url);
      const spaAsset = await env.ASSETS.fetch(spaUrl);
      if (spaAsset.ok) {
        const resp = new Response(spaAsset.body, spaAsset);
        resp.headers.set('Cache-Control', 'no-cache');
        return resp;
      }
    }
    // Add CORS for /pagefind-semantic/ assets (used by client-side JS)
    const resp = new Response(asset.body, asset);
    if (url.pathname.startsWith('/pagefind-semantic/')) {
      resp.headers.set('Access-Control-Allow-Origin', '*');
    }
    return resp;
  },
};

/** Proxy comment API requests to the backend server */
async function proxyComments(request, url) {
  const backend = COMMENTS_BACKEND + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Forwarded-Proto', url.protocol);

  const resp = await fetch(backend, {
    method: request.method,
    headers,
    body: request.method === 'POST' ? request.body : undefined,
  });

  // Copy response and add CORS for local dev
  const proxyResp = new Response(resp.body, resp);
  proxyResp.headers.set('Access-Control-Allow-Origin', '*');
  return proxyResp;
}

/** Proxy Artalk static assets (JS/CSS) */
async function proxyArtalkAsset(request, url) {
  const backend = COMMENTS_BACKEND + url.pathname + url.search;
  const resp = await fetch(backend);
  const proxyResp = new Response(resp.body, resp);
  // Cache for 1 year on CDN
  proxyResp.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return proxyResp;
}
