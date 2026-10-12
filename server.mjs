// Local dev server: serves the prototypes AND the AI endpoint, no installs needed.
// Usage:  1) copy .env.example to .env and paste your Gemini key
//         2) node server.mjs
//         3) open http://localhost:3000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExpense, rateLimited } from './lib/parseExpense.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// Tiny .env loader (so you don't need the dotenv package).
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > limit) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const send = (res, status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/parse-expense') {
    if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' });
    if (rateLimited(req.socket.remoteAddress || 'local')) return send(res, 429, { error: 'Too many tries. Wait a minute and try again.' });
    let body = null;
    try { body = JSON.parse(await readBody(req)); } catch { /* handled by parseExpense */ }
    const out = await parseExpense(body, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || undefined });
    return send(res, out.status, out.body);
  }

  // Static files (never allow paths outside the project folder).
  const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || rel.includes('/.') || rel.startsWith('/lib/') || rel.startsWith('/api/')) {
    res.writeHead(404); return res.end('Not found');
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log(`Pocket AI dev server → http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) console.log('⚠  GEMINI_API_KEY not set: the app works, but "Fill with AI" will show a setup message.');
});
