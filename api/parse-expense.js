// Vercel serverless function: POST /api/parse-expense
// Set GEMINI_API_KEY in Vercel → Project → Settings → Environment Variables.
import { parseExpense, rateLimited } from '../lib/parseExpense.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many tries. Wait a minute and try again.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }

  const { status, body: out } = await parseExpense(body, {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || undefined,
  });
  return res.status(status).json(out);
}
