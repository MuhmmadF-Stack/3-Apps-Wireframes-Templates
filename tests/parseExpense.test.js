// Run with: npm test   (uses Node's built-in test runner, no installs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExpense, cleanResult } from '../lib/parseExpense.js';

const ctx = {
  today: '2026-10-06',
  minDate: '2026-09-01',
  categories: ['Groceries', 'Dining out', 'Utilities', 'Transportation', 'Shopping', 'Health', 'Entertainment', 'Other'],
  accounts: ['Checking', 'Credit card', 'Savings'],
};

// Fake Gemini: returns whatever JSON we give it, and records the request.
function fakeGemini(answer, { status = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts, body: JSON.parse(opts.body) });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] }),
      text: async () => 'upstream error',
    };
  };
  return { fetchImpl, calls };
}

test('fills fields from a good AI answer', async () => {
  const { fetchImpl, calls } = fakeGemini({ isExpense: true, amount: 4.5, merchant: 'Dhaba', category: 'Dining out', date: '2026-10-05', account: 'Checking', note: 'Chai and paratha', unsure: [] });
  const out = await parseExpense({ ...ctx, text: 'kal dhabe pe chai paratha 4.50' }, { apiKey: 'k', fetchImpl });
  assert.equal(out.status, 200);
  assert.deepEqual(out.body, { amount: 4.5, merchant: 'Dhaba', category: 'Dining out', date: '2026-10-05', account: 'Checking', note: 'Chai and paratha', unsure: [] });
  // key goes in a header, never in the URL
  assert.equal(calls[0].opts.headers['x-goog-api-key'], 'k');
  assert.ok(!calls[0].url.includes('key='));
  assert.equal(calls[0].body.generationConfig.responseMimeType, 'application/json');
});

test('rejects invalid AI values and marks them unsure', () => {
  const out = cleanResult({ amount: -3, merchant: '', category: 'Food', date: '2027-01-01', account: 'Wallet', note: 5, unsure: ['hack'] }, ctx);
  assert.deepEqual(out, { amount: 0, merchant: '', category: 'Other', date: '2026-10-06', account: 'Checking', note: '', unsure: ['amount', 'merchant', 'category', 'date', 'account'] });
});

test('non-expense text returns 422', async () => {
  const { fetchImpl } = fakeGemini({ isExpense: false, amount: 0, merchant: '', category: 'Other', date: '2026-10-06', account: 'Checking', note: '', unsure: [] });
  const out = await parseExpense({ ...ctx, text: 'hello how are you' }, { apiKey: 'k', fetchImpl });
  assert.equal(out.status, 422);
});

test('validates input before calling the AI', async () => {
  const { fetchImpl, calls } = fakeGemini({});
  assert.equal((await parseExpense({ ...ctx, text: '  ' }, { apiKey: 'k', fetchImpl })).status, 400);
  assert.equal((await parseExpense({ ...ctx, text: 'x'.repeat(301) }, { apiKey: 'k', fetchImpl })).status, 400);
  assert.equal((await parseExpense({ ...ctx, text: 'ok', today: 'nope' }, { apiKey: 'k', fetchImpl })).status, 400);
  assert.equal((await parseExpense(null, { apiKey: 'k', fetchImpl })).status, 400);
  assert.equal(calls.length, 0);
});

test('missing key gives a clear setup message', async () => {
  const out = await parseExpense({ ...ctx, text: 'uber 12' }, { apiKey: '' });
  assert.equal(out.status, 503);
  assert.match(out.body.error, /GEMINI_API_KEY/);
});

test('upstream errors are turned into friendly messages', async () => {
  assert.equal((await parseExpense({ ...ctx, text: 'uber 12' }, { apiKey: 'k', fetchImpl: fakeGemini({}, { status: 429 }).fetchImpl })).status, 429);
  assert.equal((await parseExpense({ ...ctx, text: 'uber 12' }, { apiKey: 'k', fetchImpl: fakeGemini({}, { status: 500 }).fetchImpl })).status, 502);
  const broken = async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }) });
  assert.equal((await parseExpense({ ...ctx, text: 'uber 12' }, { apiKey: 'k', fetchImpl: broken })).status, 502);
  const down = async () => { throw new Error('network'); };
  assert.equal((await parseExpense({ ...ctx, text: 'uber 12' }, { apiKey: 'k', fetchImpl: down })).status, 504);
});
