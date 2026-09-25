/**
 * blog Worker — Semantic Search API + Static Assets
 *
 * POST /api/semantic/search  { query } -> { results: [{ url, title, score }] }
 * GET  /*                       -> static assets from public/
 *
 * Semantic search: embeddings are pre-generated at build time
 * (scripts/generate-embeddings.mjs -> static/pagefind-semantic/embeddings.bin)
 * and served as static assets. The Worker only embeds the query and computes
 * dot products — no KV, no cold-start re-embedding of the corpus.
 *
 * Prerequisites:
 *   - Workers AI enabled
 *   - static/pagefind-semantic/{embeddings.bin,pages.json} deployed under ASSETS
 */

const EMBEDDING_MODEL = '@cf/baai/bge-m3';
const EMBEDDING_DIM = 1024;
const MAX_RESULTS = 10;
const COMMENTS_BACKEND = 'https://comments.tianheg.co';
// 允许通过 worker 访问 API 的来源（同站 + 本地开发）；白名单是 allow-list，无 Origin 一律拒绝
const ALLOWED_ORIGINS = [
  'https://tianheg.co',
  'https://www.tianheg.co',
  'http://localhost:1313',
  'http://127.0.0.1:1313',
];

function originAllowed(request) {
  const origin = request.headers.get('Origin');
  return ALLOWED_ORIGINS.includes(origin);
}

// 按来源回显 CORS 头；非白名单来源不加 CORS（浏览器跨站调用拿不到响应）
function corsFor(request) {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };
  }
  return null;
}

// Simple in-memory rate limiter (per-worker-isolate, resets on cold start)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30; // requests per window per IP
const rateMap = new Map();

function checkRateLimit(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();

  // 惰性清理：移除已过窗口期的条目，防止 rateMap 无限增长
  if (rateMap.size > 0 && rateMap.size % 64 === 0) {
    for (const [k, v] of rateMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) rateMap.delete(k);
    }
  }

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
        ...(corsFor(request) || {}),
      },
    });
  }
  return null;
}

// In-memory cache for page data + embeddings (lives as long as the isolate)
let pageCache = null;

async function loadPageData(env) {
  if (pageCache) return pageCache;

  const [binResp, metaResp] = await Promise.all([
    env.ASSETS.fetch('https://fake/pagefind-semantic/embeddings.bin'),
    env.ASSETS.fetch('https://fake/pagefind-semantic/pages.json'),
  ]);
  if (!binResp.ok || !metaResp.ok) {
    throw new Error(`semantic index missing (bin=${binResp.status}, pages=${metaResp.status})`);
  }

  const buf = await binResp.arrayBuffer();
  const embeddings = new Float32Array(buf); // already L2-normalized at build time
  const pages = await metaResp.json();

  pageCache = { pages, embeddings, dim: EMBEDDING_DIM };
  return pageCache;
}

async function handleSearch(request, env) {
  // 限制请求体大小，防止无界 JSON body 造成内存压力
  const bodyText = await request.text();
  if (bodyText.length > 10_000) {
    return Response.json({ error: 'Request body too large' }, { status: 413 });
  }
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const query = (body.query || '').trim();
  if (!query) {
    return Response.json({ error: 'Missing query' }, { status: 400 });
  }

  const cache = await loadPageData(env);

  // Embed the query, then L2-normalize to match the pre-normalized doc vectors
  const aiResp = await env.AI.run(EMBEDDING_MODEL, {
    text: [query],
  });
  const q = new Float32Array(aiResp.data[0]);
  let mag = 0;
  for (let i = 0; i < q.length; i++) mag += q[i] * q[i];
  mag = Math.sqrt(mag) || 1;
  for (let i = 0; i < q.length; i++) q[i] /= mag;

  // Dot product = cosine similarity (both vectors normalized)
  const { pages, embeddings, dim } = cache;
  const scored = [];
  for (let i = 0; i < pages.length; i++) {
    const start = i * dim;
    let dot = 0;
    const doc = embeddings.subarray(start, start + dim);
    for (let j = 0; j < dim; j++) dot += q[j] * doc[j];
    scored.push({ ...pages[i], score: +dot.toFixed(4) });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_RESULTS);

  return Response.json({ results: top });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight — 只对白名单来源回 CORS 头
    if (request.method === 'OPTIONS') {
      const cors = corsFor(request);
      if (!cors) return new Response(null, { status: 403 });
      return new Response(null, {
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Semantic search API
    if (url.pathname === '/api/semantic/search' && request.method === 'POST') {
      const cors = corsFor(request);
      // 非白名单来源拒绝调用（防任何网站消耗 AI 配额）
      if (!cors) return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403 });
      // Rate limit check
      const rateLimitResp = checkRateLimit(request);
      if (rateLimitResp) return rateLimitResp;

      try {
        const resp = await handleSearch(request, env);
        const corsResp = new Response(resp.body, resp);
        corsResp.headers.set('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']);
        corsResp.headers.set('Vary', 'Origin');
        return corsResp;
      } catch (err) {
        console.error('semantic search error:', err);
        return Response.json({ error: 'Internal server error' }, {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'], 'Vary': 'Origin' },
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
      const cors = corsFor(request);
      if (cors) {
        resp.headers.set('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']);
        resp.headers.set('Vary', 'Origin');
      }
    }
    // Content Security Policy
    resp.headers.set('Content-Security-Policy',
      "object-src 'none'; base-uri 'none'; frame-ancestors 'none';");
    return resp;
  },
};

/** Proxy comment API requests to the backend server */
async function proxyComments(request, url) {
  // 只允许白名单来源（同站 + 本地开发）访问评论代理，防跨站滥用
  if (!originAllowed(request)) {
    return Response.json({ error: 'Forbidden origin' }, { status: 403 });
  }

  const backend = COMMENTS_BACKEND + url.pathname + url.search;
  const headers = new Headers(request.headers);
  // 清除客户端可控的敏感头，防止伪造转发到后端
  headers.delete('X-Forwarded-For');
  headers.delete('Authorization');
  headers.delete('Cookie');
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Forwarded-Proto', url.protocol);

  const resp = await fetch(backend, {
    method: request.method,
    headers,
    body: request.method === 'POST' ? request.body : undefined,
  });

  // Copy response and add CORS only for allowed origins (not wildcard)
  const proxyResp = new Response(resp.body, resp);
  const cors = corsFor(request);
  if (cors) {
    proxyResp.headers.set('Access-Control-Allow-Origin', cors['Access-Control-Allow-Origin']);
    proxyResp.headers.set('Vary', 'Origin');
  }
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
