
/**
 * AI Service for parsing financial transactions using LLMs (via OpenRouter)
 */

const getAPIKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env.VITE_OPENROUTER_API_KEY;
  try {
    const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
    if (proc && proc.env) return proc.env.VITE_OPENROUTER_API_KEY || proc.env.OPENROUTER_API_KEY;
  } catch (err) { void err; }
  return null;
};

const getModel = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENROUTER_MODEL) return import.meta.env.VITE_OPENROUTER_MODEL;
  try {
    const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
    if (proc && proc.env && proc.env.VITE_OPENROUTER_MODEL) return proc.env.VITE_OPENROUTER_MODEL;
  } catch (err) { void err; }
  return 'meta-llama/llama-3-8b-instruct';
};

const buildSystemPrompt = (userCurrency = 'BDT') => {
  const currencySymbols = { 'BDT': '৳', 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹' };
  const currencySymbol = currencySymbols[userCurrency] || '৳';

  return `You are an advanced multilingual financial transaction parser. You MUST return VALID JSON ONLY.

LANGUAGE SUPPORT:
- English, Bengali, Banglish, Mixed

CRITICAL VALIDATION RULES:
1. If NO EXPLICIT AMOUNT is found, return: [{"error": "missing_amount", "message": "Please specify the amount"}]
2. Valid amounts: numbers (50, 250.50), currency symbols (${currencySymbol}250, $50), words (fifty, hundred, lakh, crore)

RESPONSE FORMAT:
- Always return JSON array (even for single transaction)

TRANSACTION TYPES:
- "income", "expense", "credit" (Money LENT), "loan" (Money BORROWED)

TRANSACTION SCHEMA:
{
  "type": "income|expense|credit|loan",
  "amount": number,
  "description": "clear, normalized description",
  "category": "food|transport|entertainment|shopping|bills|health|education|salary|freelance|investment|other",
  "date": "YYYY-MM-DD"
}`;
};

const convertBengali = s => typeof s === 'string' ? s.replace(/[০১২৩৪৫৬৭৮৯]/g, ch => '০১২৩৪৫৬৭৮৯'.indexOf(ch)) : s;

const sanitizeAmount = raw => {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim();
  s = convertBengali(s);
  s = s.replace(/[,\s]*৳|,|\s*(taka|tk|bdt|টাকা)\b/gi, '');
  s = s.replace(/[^0-9.kKmMlLcrore.-]/gi, ' ');
  s = s.trim();

  const k = s.match(/^(\d+(?:\.\d+)?)\s*k$/i); if (k) return parseFloat(k[1]) * 1000;
  const lakh = s.match(/^(\d+(?:\.\d+)?)\s*(lakh|লক্ষ)$/i); if (lakh) return parseFloat(lakh[1]) * 100000;
  const crore = s.match(/^(\d+(?:\.\d+)?)\s*(crore|কোটি)$/i); if (crore) return parseFloat(crore[1]) * 10000000;

  const num = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : null;
};

const extractJSON = (text) => {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch {
    const m = text.match(/(\[\s*\{[\s\S]*?\}\s*\])|\{[\s\S]*?\}/m);
    if (m) {
      try { return JSON.parse(m[0]); } catch { return null; }
    }
  }
  return null;
};

/**
 * Parse a natural language message into structured transaction objects
 */
export const parseTransaction = async (message, userCurrency = 'BDT') => {
  if (!message || typeof message !== 'string') return { success: false, error: 'Empty message' };

  const hasAmountPattern = /(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?|৳|taka|tk|bdt|টাকা|\$|€|£|₹|hundred|thousand|lakh|লক্ষ|crore|কোটি|k\b)/i;
  if (!hasAmountPattern.test(convertBengali(message))) {
    return { success: false, error: 'Please specify the amount (e.g., "50", "৳100")' };
  }

  const apiKey = getAPIKey();
  if (!apiKey) return { success: false, error: 'AI API key missing' };

  const payload = {
    model: getModel(),
    messages: [{ role: 'system', content: buildSystemPrompt(userCurrency) }, { role: 'user', content: message }],
    max_tokens: 800,
    temperature: 0.05
  };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content || '';
    let parsed = extractJSON(content);

    if (parsed && !Array.isArray(parsed)) parsed = [parsed];
    if (!parsed) return { success: false, error: 'Could not parse transactions' };

    if (parsed.length === 1 && parsed[0].error === 'missing_amount') {
      return { success: false, error: parsed[0].message };
    }

    const now = new Date().toISOString().split('T')[0];
    const normalized = parsed.map((obj) => ({
      type: (obj?.type || 'expense').toLowerCase(),
      amount: sanitizeAmount(obj?.amount ?? obj?.value),
      category: (obj?.category || 'other').toLowerCase(),
      description: (obj?.description || obj?.desc || '').trim(),
      date: obj?.date && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : now,
      confidence: obj?.confidence ?? 'high'
    }));

    const valid = normalized.filter(tx => tx.amount > 0 && tx.description.length > 0);
    if (valid.length === 0) return { success: false, error: 'Incomplete transaction details' };

    return { success: true, data: valid };
  } catch (error) {
    console.error('AI Service Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Utility to format transaction for UI display
 */
export const formatTransactionPreview = (tx) => {
  const emoji = tx.type === 'income' ? '💰' : tx.type === 'loan' ? '🏦' : tx.type === 'credit' ? '🤝' : '💸';
  return `${emoji} ${tx.description}: ${tx.amount} BDT (${tx.category})`;
};
