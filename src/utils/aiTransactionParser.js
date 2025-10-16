// AI-backed transaction parser — returns an array of 1 or more transactions
// Uses OpenRouter (model from env or default). Exports parseTransaction (async) and learnFromCorrection.

import { getCategoryConfig } from '../config/constants.js';

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

const buildSystemPrompt = (userCurrency = 'BDT') => {
  const currencySymbols = {
    'BDT': '৳',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹'
  };
  const currencySymbol = currencySymbols[userCurrency] || '৳';
  const currencyName = userCurrency === 'BDT' ? 'taka' : userCurrency;

  return `You are an advanced multilingual financial transaction parser. You MUST return VALID JSON ONLY.

LANGUAGE SUPPORT:
- English: "bought lunch for 250", "spent $50 on groceries"
- Bengali: "২৫০ টাকা দিয়ে লাঞ্চ কিনেছি", "৫০০ টাকা খরচ"
- Banglish (Bengali in English script): "250 taka diye lunch kinechi", "500 taka khoroch"
- Mixed: "lunch er jonno 250 taka", "দুপুরের খাবারে ৳250"
- Any language with numbers or currency

CRITICAL VALIDATION RULES:
1. If NO EXPLICIT AMOUNT is found, return: [{"error": "missing_amount", "message": "Please specify the amount"}]
2. Valid amounts: numbers (50, 250.50), currency symbols (${currencySymbol}250, $50), words (fifty, hundred, lakh, crore)
3. DO NOT guess amounts from context ("lunch" alone is invalid)
4. DO NOT invent amounts based on typical costs

RESPONSE FORMAT:
- Always return JSON array (even for single transaction)
- Multiple transactions: [tx1, tx2, ...]
- Single transaction: [tx1]
- Error: [{"error": "missing_amount", "message": "..."}]

TRANSACTION TYPES:
- "income": Money IN (salary, বেতন, payment received, refund, gift)
- "expense": Money OUT (খরচ, khoroch, purchase, bills, shopping)
- "credit": Money LENT to others (ধার দিয়েছি, dhar diyechi, loan given)
- "loan": Money BORROWED (ধার নিয়েছি, dhar niyechi, loan taken)

AMOUNT RECOGNITION (examples):
✓ "250" → 250
✓ "৳250" or "${currencySymbol}250" → 250
✓ "250 taka" or "২৫০ টাকা" → 250
✓ "two hundred fifty" → 250
✓ "5k" → 5000
✓ "1 lakh" or "১ লক্ষ" → 100000
✓ "2.5 crore" → 25000000
✗ "lunch" (no amount)
✗ "expensive meal" (no amount)

BENGALI/BANGLISH KEYWORDS:
- খরচ, khoroch, khorcha = expense
- আয়, income, payment = income
- বেতন, salary, beton = income/salary category
- লাঞ্চ, lunch, দুপুরের খাবার = food category
- যাতায়াত, jatayat, transport, গাড়ি = transport
- বিল, bill, bills = bills category
- ধার দিয়েছি, dhar diyechi, lent = credit
- ধার নিয়েছি, dhar niyechi, borrowed = loan

DESCRIPTION GUIDELINES:
- Create clear, semantic descriptions that explain what the transaction is for
- DO NOT just repeat the user's input verbatim
- Normalize and clean up descriptions (e.g., "lunch kinechi 250" → "Lunch purchase", "২৫০ টাকা খরচ করেছি লাঞ্চে" → "Lunch expense")
- Include relevant context from the message but make it concise and professional
- For Bengali/Banglish input, you can provide English descriptions or keep original language based on clarity
- Examples:
  * "bought groceries for 500" → "Grocery shopping"
  * "lunch er jonno 250 taka" → "Lunch"
  * "বেতন পেয়েছি ৫০০০০" → "Salary received" or "বেতন"
  * "taxi bhara 120" → "Taxi fare"
  * "ধার দিয়েছি রহিমকে 5000" → "Loan given to Rahim" or "Credit to Rahim"

TRANSACTION SCHEMA:
{
  "type": "income|expense|credit|loan",
  "amount": number (positive, no symbols),
  "description": "clear, normalized description (not verbatim user input)",
  "category": "food|transport|entertainment|shopping|bills|health|education|salary|freelance|investment|other",
  "date": "YYYY-MM-DD" (optional, defaults to today)
}

EXAMPLES (user currency: ${userCurrency}):
Input: "lunch kinechi 250 taka" → [{"type":"expense","amount":250,"description":"Lunch","category":"food"}]
Input: "২৫০ টাকা খরচ করেছি লাঞ্চে" → [{"type":"expense","amount":250,"description":"Lunch expense","category":"food"}]
Input: "received salary 50000" → [{"type":"income","amount":50000,"description":"Salary received","category":"salary"}]
Input: "বেতন পেয়েছি ৫০০০০" → [{"type":"income","amount":50000,"description":"Salary","category":"salary"}]
Input: "taxi bhara 120 taka" → [{"type":"expense","amount":120,"description":"Taxi fare","category":"transport"}]
Input: "ধার দিয়েছি রহিমকে 5000" → [{"type":"credit","amount":5000,"description":"Loan to Rahim","category":"other"}]
Input: "type:expense note:lunch" → [{"error":"missing_amount","message":"Please specify the amount"}]

IMPORTANT:
- Convert Bengali numerals (০-৯) to English (0-9)
- Recognize "taka", "টাকা", "${currencyName}" as currency indicators
- Default currency is ${userCurrency}
- Be flexible with language mixing
- NEVER invent amounts`};


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

export const parseTransaction = async (message, userCurrency = 'BDT') => {
  if (!message || typeof message !== 'string') return { success: false, error: 'Empty message' };
  
  // Pre-check: Look for any amount indication in the message
  const hasAmountPattern = /(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?|৳|taka|tk|bdt|টাকা|\$|€|£|₹|hundred|thousand|lakh|লক্ষ|crore|কোটি|k\b)/i;
  if (!hasAmountPattern.test(convertBengali(message))) {
    return { success: false, error: 'Please specify the amount for this transaction (e.g., "50", "$50", "৳100")' };
  }
  
  const apiKey = getAPIKey();
  if (!apiKey) return { success: false, error: 'API key missing' };
  const model = getModel();
  
  // Build prompt with user's currency context
  const SYSTEM_PROMPT = buildSystemPrompt(userCurrency);

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

  // Check if AI returned an error object for missing amount
  if (parsed.length === 1 && parsed[0].error === 'missing_amount') {
    return { success: false, error: parsed[0].message || 'Please specify the amount for this transaction' };
  }

  // normalize entries
  const now = new Date().toISOString().split('T')[0];
  // Helper: infer credit vs loan from description if parser returns a generic income/expense
  const inferTypeFromDescription = (desc, givenType) => {
    const s = (desc || '').toLowerCase();
    // phrases indicating the user GAVE money to someone => credit (credit given)
    const gaveLoanKeywords = ['lent', 'loaned', 'lend to', 'lent to', 'gave loan', 'gave loan to', 'loan given'];
    // phrases indicating the user BORROWED money => loan (loan taken)
    const tookLoanKeywords = ['borrow', 'borrowed', 'took loan', 'took a loan', 'loan from', 'took loan from', 'borrow from'];

    const hasGave = gaveLoanKeywords.some(k => s.includes(k));
    const hasTook = tookLoanKeywords.some(k => s.includes(k));

    if (hasTook) return 'loan';
    if (hasGave) return 'credit';

    // If parser already provided a clear type, keep it
    if (givenType && ['income', 'expense', 'credit', 'loan'].includes(givenType)) return givenType;

    // Default to expense when uncertain
    return 'expense';
  };

  const normalized = parsed.map((obj) => {
    let type = obj?.type ? String(obj.type).toLowerCase() : null;
    const amount = sanitizeAmount(obj?.amount ?? obj?.value ?? obj?.amt ?? obj?.total);
    const category = obj?.category ? String(obj.category).toLowerCase() : 'other';
    const description = obj?.description ? String(obj.description).trim() : (obj?.desc ? String(obj.desc).trim() : '');

    // Normalize date: accept various human-readable forms but always return YYYY-MM-DD
    let date = now;
    if (obj?.date) {
      try {
        const raw = String(obj.date).trim();
        // If already ISO-like YYYY-MM-DD, keep it
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          date = raw;
        } else {
          const parsedDate = new Date(raw);
          if (!Number.isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString().split('T')[0];
          } else {
            date = now;
          }
        }
      } catch {
        date = now;
      }
    }

    // Infer type from description when parser returns a generic one or mislabels
    type = inferTypeFromDescription(description, type);

    return { type, amount, category, description, date, confidence: obj?.confidence ?? 'high' };
  });

  // Check for missing or invalid amounts before filtering
  const invalidTransactions = normalized.filter(x => !x || !Number.isFinite(x.amount) || x.amount <= 0);
  if (invalidTransactions.length > 0) {
    return { success: false, error: 'Please specify a valid amount for this transaction (e.g., "bought lunch for 250")' };
  }

  // Filter for valid transactions
  const validTransactions = normalized.filter(x => x && Number.isFinite(x.amount) && x.amount > 0 && x.description.length > 0);

  if (validTransactions.length === 0) return { success: false, error: 'Please include both amount and description for the transaction' };
  return { success: true, data: validTransactions };
};

// eslint-disable-next-line no-unused-vars
export const learnFromCorrection = (originalMessage, aiResult, userCorrection) => {
  // Future: persist corrections to localStorage or backend for continuous improvement
  // console.log('correction', { originalMessage, aiResult, userCorrection });
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
  return getCategoryConfig(category).emoji;
};

/**
 * Get category color class for Tailwind CSS
 * @param {string} category - Category name
 * @returns {string} Tailwind CSS classes
 */
export const getCategoryColor = (category) => {
  return getCategoryConfig(category).color;
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