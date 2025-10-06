// AI-backed transaction parser — returns an array of 1 or more transactions
// Uses OpenRouter (model from env or default). Exports parseTransaction (async) and learnFromCorrection.

const getAPIKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env.VITE_OPENROUTER_API_KEY;
  try { const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined; if (proc && proc.env) return proc.env.VITE_OPENROUTER_API_KEY || proc.env.OPENROUTER_API_KEY; } catch (err) { void err; }
  return null;
};

const getModel = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENROUTER_MODEL) return import.meta.env.VITE_OPENROUTER_MODEL;
  try { const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined; if (proc && proc.env && proc.env.VITE_OPENROUTER_MODEL) return proc.env.VITE_OPENROUTER_MODEL; } catch (err) { void err; }
  // default to a powerful instruction tuned model available on OpenRouter
  return 'meta-llama/llama-3-8b-instruct';
};

const SYSTEM_PROMPT = `You are a strict transaction parser. ALWAYS reply with VALID JSON ONLY and NOTHING ELSE.

Rules:
- If input contains more than one transaction, RETURN A JSON ARRAY of transaction objects.
- If input contains exactly one transaction, return a single-element array containing that object.
- Do NOT include any non-JSON text.

Each transaction object schema:
{
  "type": "income|expense|credit|loan",
  "amount": number,
  "description": "short clean description",
  "category": "food|transport|entertainment|shopping|bills|health|education|salary|freelance|investment|other",
  "date": "YYYY-MM-DD" // optional
}

Support English and Bengali. Normalize amounts to BDT (numbers only).`;

// Convert Bengali numerals to Latin digits
const convertBengali = s => typeof s === 'string' ? s.replace(/[০১২৩৪৫৬৭৮৯]/g, ch => '০১২৩৪৫৬৭৮৯'.indexOf(ch)) : s;

const sanitizeAmount = raw => {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim();
  s = convertBengali(s);
  s = s.replace(/[,\s]*৳|,|\s*(taka|tk|bdt|টাকা)\b/gi, '');
  s = s.replace(/[^0-9.kKmMlLcrore.-]/gi, ' ');
  s = s.trim();
  // shorthand
  const k = s.match(/^(\d+(?:\.\d+)?)\s*k$/i); if (k) return parseFloat(k[1]) * 1000;
  const thousand = s.match(/^(\d+(?:\.\d+)?)\s*thousand$/i); if (thousand) return parseFloat(thousand[1]) * 1000;
  const lakh = s.match(/^(\d+(?:\.\d+)?)\s*(lakh|লক্ষ)$/i); if (lakh) return parseFloat(lakh[1]) * 100000;
  const crore = s.match(/^(\d+(?:\.\d+)?)\s*(crore|কোটি)$/i); if (crore) return parseFloat(crore[1]) * 10000000;
  const num = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : null;
};

const doFetch = async (url, opts, timeout = 10000) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const signal = controller ? controller.signal : undefined;
  if (controller) setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...opts, signal });
};

const extractJSON = (text) => {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch (err) { void err; }
  // try to find array/object blocks
  const m = text.match(/(\[\s*\{[\s\S]*?\}\s*\])|\{[\s\S]*?\}/m);
  if (m) {
    try { return JSON.parse(m[0]); } catch (err) { void err; }
  }
  return null;
};

export const parseTransaction = async (message) => {
  if (!message || typeof message !== 'string') return { success: false, error: 'Empty message' };
  const apiKey = getAPIKey();
  if (!apiKey) return { success: false, error: 'API key missing' };
  const model = getModel();

  const payload = {
    model,
    messages: [ { role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message } ],
    max_tokens: 800,
    temperature: 0.05
  };

  let res;
  try {
    res = await doFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 10000);
  } catch (err) { void err; return { success: false, error: 'Network error' }; }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { success: false, error: `API error ${res.status}: ${text}` };
  }

  const body = await res.json().catch(() => null);
  const content = body?.choices?.[0]?.message?.content || '';
  let parsed = extractJSON(content);

  // If output is an object, convert to single-element array (we require array)
  if (parsed && !Array.isArray(parsed)) parsed = [parsed];

  // If no parsed JSON, attempt a second call that instructs to return array only
  if (!parsed) {
    const clar = {
      model,
      messages: [ { role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message }, { role: 'system', content: 'If multiple transactions are present return a JSON array. Always reply JSON only.' } ],
      max_tokens: 800,
      temperature: 0.02
    };
    try {
      const r2 = await doFetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(clar) }, 8000);
      if (r2 && r2.ok) {
        const b2 = await r2.json().catch(() => null);
        const c2 = b2?.choices?.[0]?.message?.content || '';
        const p2 = extractJSON(c2);
        if (p2) parsed = Array.isArray(p2) ? p2 : [p2];
      }
    } catch (err) { void err; }
  }

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return { success: false, error: 'Could not parse transactions' };

  // normalize entries
  const now = new Date().toISOString().split('T')[0];
  const normalized = parsed.map((obj) => {
    const type = obj?.type ? String(obj.type).toLowerCase() : 'expense';
    const amount = sanitizeAmount(obj?.amount ?? obj?.value ?? obj?.amt ?? obj?.total);
    const category = obj?.category ? String(obj.category).toLowerCase() : 'other';
    const description = obj?.description ? String(obj.description).trim() : (obj?.desc ? String(obj.desc).trim() : '');
    const date = obj?.date ? String(obj.date) : now;
    return { type, amount, category, description, date, confidence: obj?.confidence ?? 'high' };
  }).filter(x => x && Number.isFinite(x.amount) && x.amount > 0 && x.description.length > 0);

  if (normalized.length === 0) return { success: false, error: 'No valid transactions after normalization' };
  return { success: true, data: normalized };
};

export const learnFromCorrection = (originalMessage, aiResult, userCorrection) => {
  // keep simple - log corrections; you can persist to localStorage later
  console.log('correction', { originalMessage, aiResult, userCorrection });
  return { success: true };
};

// === UTILITY FUNCTIONS (previously in transactionParser.js) ===

/**
 * Simple amount extraction from message
 * @param {string} message - User's input message
 * @returns {number|null} Extracted amount or null
 */
export const extractAmount = (message) => {
  const amounts = message.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g);
  return amounts ? parseFloat(amounts[0].replace(/,/g, '')) : null;
};

/**
 * Format transaction for display
 * @param {Object} transaction - Transaction object
 * @returns {string} Formatted string
 */
export const formatTransactionMessage = (transaction) => {
  const { type, amount, category, description } = transaction;
  const emoji = type === 'income' ? '💰' : '💸';
  const typeText = type === 'income' ? 'Income' : 'Expense';
  
  return `${emoji} ${typeText} Added!\n💵 Amount: ${amount} BDT\n📝 ${description}\n🏷️ Category: ${category}`;
};

/**
 * Get category emoji
 * @param {string} category - Category name
 * @returns {string} Emoji
 */
export const getCategoryEmoji = (category) => {
  const emojiMap = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📄',
    health: '🏥',
    education: '📚',
    salary: '💼',
    freelance: '💻',
    investment: '📈',
    other: '📦',
    other_income: '💰'
  };
  
  return emojiMap[category] || '📦';
};

/**
 * Get category color class for Tailwind CSS
 * @param {string} category - Category name
 * @returns {string} Tailwind CSS classes
 */
export const getCategoryColor = (category) => {
  const colorMap = {
    food: 'bg-orange-100 text-orange-800',
    transport: 'bg-blue-100 text-blue-800',
    entertainment: 'bg-purple-100 text-purple-800',
    shopping: 'bg-pink-100 text-pink-800',
    bills: 'bg-red-100 text-red-800',
    health: 'bg-green-100 text-green-800',
    education: 'bg-indigo-100 text-indigo-800',
    salary: 'bg-emerald-100 text-emerald-800',
    freelance: 'bg-cyan-100 text-cyan-800',
    investment: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
    other_income: 'bg-lime-100 text-lime-800'
  };
  
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Check if a transaction type represents credit given (money lent to others)
 * @param {string} type - Transaction type
 * @returns {boolean} True if it's credit given
 */
export const isCreditCategory = (type) => {
  return type === 'credit';
};

/**
 * Check if a transaction type represents loan taken (money borrowed from others)
 * @param {string} type - Transaction type
 * @returns {boolean} True if it's loan taken
 */
export const isLoanCategory = (type) => {
  return type === 'loan';
};

export default { parseTransaction, learnFromCorrection, extractAmount, formatTransactionMessage, getCategoryEmoji, getCategoryColor, isCreditCategory, isLoanCategory };
