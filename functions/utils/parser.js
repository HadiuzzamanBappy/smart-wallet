const getAPIKey = () => {
  return process.env.OPENROUTER_API_KEY;
};

const getModel = () => {
  return process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct";
};

const buildSystemPrompt = (userCurrency = "BDT", currentDateStr) => {
  return `You are a financial transaction parser. Return ONLY a JSON array. No markdown formatting, no explanations.

RULES:
1. Context: Today is ${currentDateStr}. Default currency is ${userCurrency}.
2. Languages: English, Bengali, Banglish.
3. Amounts: Must be pure numbers (e.g., "5.5k" -> 5500, "2 lakh" -> 200000). NO strings or currency symbols.
4. Missing Amount: If no amount is found, return: [{"error": "missing_amount", "message": "Please specify the amount"}]
5. Types: "income" (received), "expense" (spent), "loan" (borrowed from someone/dhar nilam), "credit" (lent to someone/dhar dilam).
6. Category: Must logically match. "loan" type MUST have "loan" category. "credit" type MUST have "credit" category.

SCHEMA:
[
  {
    "type": "income|expense|credit|loan",
    "amount": 500,
    "description": "Short English description",
    "category": "food|transport|shopping|salary|loan|credit|other",
    "date": "YYYY-MM-DD"
  }
]

EXAMPLES:
Input: "bought lunch for 150"
Output: [{"type": "expense", "amount": 150, "description": "Lunch", "category": "food", "date": "${currentDateStr}"}]

Input: "Sajib ke 2.5k dhar dilam"
Output: [{"type": "credit", "amount": 2500, "description": "Lent money to Sajib", "category": "credit", "date": "${currentDateStr}"}]`;
};

const getAdvicePrompt = () => {
  return `You are a sharp personal finance advisor inside a Smart Wallet app.
The user's full financial breakdown is below as JSON.
Respond with exactly 3 sections, plain text, no markdown, no asterisks:

BIGGEST RISK: One sentence. Name the exact amount and rule being violated.
BIGGEST OPPORTUNITY: One sentence. Name the exact amount they could gain/save.  
PRIORITY ACTIONS:
1. [Specific action with exact number]
2. [Specific action with exact number]
3. [Specific action with exact number]
4. [Specific action with exact number]

Use their currency symbol. Talk like a smart financially-savvy friend, not a banker. 
Be specific. No fluff. If their situation is actually good, say so and focus on growth.`;
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

module.exports = {
  getAPIKey,
  getModel,
  buildSystemPrompt,
  getAdvicePrompt,
  convertBengali,
  sanitizeAmount,
  extractJSON
};
