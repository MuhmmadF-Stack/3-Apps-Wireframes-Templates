// Core logic for the "describe your expense" AI feature.
// It turns a sentence like "kal dhabe pe chai paratha 4.50" into form fields.
//
// This file runs on the SERVER only (Vercel function or the local dev server),
// so the Gemini API key never reaches the browser.

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FIELDS = ['amount', 'merchant', 'category', 'date', 'account'];
const MAX_TEXT = 300;
const TIMEOUT_MS = 12000;

// Instructions for the model. Kept short and specific so answers are predictable.
function buildPrompt({ today, minDate, categories, accounts }) {
  return `You read one short expense description and extract form fields for a budgeting app.
The user may write in English, Urdu, Roman Urdu (Urdu in Latin letters), or a mix.

Rules:
- Today is ${today}. Resolve relative dates: "today/aaj" = ${today}, "yesterday/kal" = the day before ${today}, "parson" = two days before, weekday names = the most recent such day on or before ${today}. Never return a date after ${today} or before ${minDate}. If no date is mentioned, use ${today}.
- amount: the money spent as a plain number. If several items have prices, add them up. If no amount is mentioned, use 0 and put "amount" in unsure.
- merchant: the shop, brand, service or place, in Title Case (e.g. "Dhaba", "Uber", "K-Electric"). If none, use a short generic name for what was bought (e.g. "Groceries").
- category: exactly one of: ${categories.join(', ')}. Food and drinks eaten out = Dining out. Rides, fuel, bus = Transportation. Bills like electricity, gas, internet, phone = Utilities. Medicine, doctor = Health. Movies, games, streaming = Entertainment.
- account: exactly one of: ${accounts.join(', ')}. "card/credit card" = Credit card, "bank/debit/cash" = Checking. If not mentioned, use Checking.
- note: a short English note (max 8 words) describing what was bought, or "" if nothing to add.
- unsure: list every field you had to guess rather than read from the text (only from: ${FIELDS.join(', ')}). Do not list date or account when they simply used the default.
- If a currency other than dollars is mentioned (e.g. rupees, Rs, PKR), still return the number, add "amount" to unsure, and mention the currency in the note.
- isExpense: false if the text is not describing money spent (e.g. a greeting, a question, or random text). Then the other fields don't matter.
Return only JSON matching the schema.`;
}

function buildSchema(categories, accounts) {
  return {
    type: 'OBJECT',
    properties: {
      isExpense: { type: 'BOOLEAN' },
      amount: { type: 'NUMBER' },
      merchant: { type: 'STRING' },
      category: { type: 'STRING', enum: categories },
      date: { type: 'STRING', description: 'YYYY-MM-DD' },
      account: { type: 'STRING', enum: accounts },
      note: { type: 'STRING' },
      unsure: { type: 'ARRAY', items: { type: 'STRING', enum: FIELDS } },
    },
    required: ['isExpense', 'amount', 'merchant', 'category', 'date', 'account', 'note', 'unsure'],
    propertyOrdering: ['isExpense', 'amount', 'merchant', 'category', 'date', 'account', 'note', 'unsure'],
  };
}

const isISODate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const strList = (v) => Array.isArray(v) && v.length > 0 && v.length <= 20 && v.every((x) => typeof x === 'string' && x.length <= 40);

// Never trust the model blindly: check every field and fall back to safe values.
export function cleanResult(raw, { today, minDate, categories, accounts }) {
  const unsure = new Set(Array.isArray(raw?.unsure) ? raw.unsure.filter((f) => FIELDS.includes(f)) : []);

  let amount = Number(raw?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) { amount = 0; unsure.add('amount'); }
  amount = Math.round(amount * 100) / 100;

  let merchant = typeof raw?.merchant === 'string' ? raw.merchant.trim().slice(0, 40) : '';
  if (!merchant) unsure.add('merchant');

  let category = raw?.category;
  if (!categories.includes(category)) { category = categories.includes('Other') ? 'Other' : categories[0]; unsure.add('category'); }

  let date = raw?.date;
  if (!isISODate(date) || date > today || date < minDate) { date = today; unsure.add('date'); }

  let account = raw?.account;
  if (!accounts.includes(account)) { account = accounts[0]; unsure.add('account'); }

  const note = typeof raw?.note === 'string' ? raw.note.trim().slice(0, 80) : '';

  return { amount, merchant, category, date, account, note, unsure: FIELDS.filter((f) => unsure.has(f)) };
}

// Returns { status, body } so it works with any server (Vercel, Node http, tests).
export async function parseExpense(input, { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  const { text, today, minDate, categories, accounts } = input || {};

  if (typeof text !== 'string' || !text.trim()) return { status: 400, body: { error: 'Type a short description of the expense first.' } };
  if (text.length > MAX_TEXT) return { status: 400, body: { error: `Keep it under ${MAX_TEXT} characters.` } };
  if (!isISODate(today) || !isISODate(minDate) || !strList(categories) || !strList(accounts)) {
    return { status: 400, body: { error: 'Bad request.' } };
  }
  if (!apiKey) return { status: 503, body: { error: 'AI is not set up on this server yet (missing GEMINI_API_KEY).' } };

  const ctx = { today, minDate, categories, accounts };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildPrompt(ctx) }] },
        contents: [{ role: 'user', parts: [{ text: text.trim() }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: buildSchema(categories, accounts),
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    console.error('[parse-expense] request failed:', err?.message);
    return { status: 504, body: { error: timedOut ? 'The AI took too long. Try again.' : 'Could not reach the AI service. Try again.' } };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[parse-expense] Gemini ${res.status}:`, detail.slice(0, 500));
    if (res.status === 429) return { status: 429, body: { error: 'The AI is busy (free-tier limit). Wait a minute and try again.' } };
    return { status: 502, body: { error: 'The AI service returned an error. Try again later.' } };
  }

  let raw;
  try {
    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    raw = JSON.parse(out);
  } catch (err) {
    console.error('[parse-expense] could not read AI output:', err?.message);
    return { status: 502, body: { error: 'The AI gave an unexpected answer. Try rephrasing.' } };
  }

  if (raw?.isExpense === false) {
    return { status: 422, body: { error: 'That doesn’t look like an expense. Try something like “lunch at Noodle House 12”.' } };
  }

  return { status: 200, body: cleanResult(raw, ctx) };
}

// Very small per-IP limiter. In serverless it only lasts while an instance is warm,
// so treat it as a speed bump, not real protection.
const hits = new Map();
export function rateLimited(ip, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}
