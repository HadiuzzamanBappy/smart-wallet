const getAPIKey = () => {
  return process.env.OPENROUTER_API_KEY;
};

const getModel = () => {
  return process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct";
};

const buildSystemPrompt = (userCurrency = "BDT", currentDateStr) => {
  return `You are an advanced multilingual financial transaction parser. You MUST return VALID JSON ONLY.

CURRENT CONTEXT:
- The current local date is: ${currentDateStr}. Use this date as "today" to resolve any relative date descriptions in the user's message (e.g., "yesterday" is the day before, "last Sunday", "two days ago", etc.).
- The user's preferred currency is: ${userCurrency}. Use this when parsing or normalizing.

LANGUAGE SUPPORT:
- English, Bengali, Banglish, and Mixed/Code-switched messages.

CRITICAL VALIDATION RULES:
1. If NO EXPLICIT AMOUNT is found in the message, you MUST return: [{"error": "missing_amount", "message": "Please specify the amount (e.g., '50', '৳100')"}]
2. Amount conversions: Resolve words and units directly into a raw numeric value (e.g., "fifty" -> 50, "10k" -> 10000, "2.5 lakh" -> 250000, "5.5k" -> 5500, "1.2 crore" -> 12000000). Never return symbols or units in the "amount" field.
3. Categorization for Loans/Credits: If transaction type is "loan" (borrowing), you MUST return "category": "loan". If transaction type is "credit" (lending), you MUST return "category": "credit". Never map borrowing or lending to "other" or any other category.

TRANSACTION TYPES:
- "income": Money received (salary, freelance, gifts, sales, interest, etc.)
- "expense": Money spent (food, transport, shopping, bills, rent, etc.)
- "credit": Money LENT to someone else (they owe you now). Keywords: "dhar dilam", "lent", "gave loan to", "credit given to", "credit sent to", "gave credit to".
- "loan": Money BORROWED from someone else (you owe them now). Keywords: "dhar nilam", "borrowed", "took loan from", "credit taken from", "credit received from", "took credit from".

TRANSACTION SCHEMA:
{
  "type": "income|expense|credit|loan",
  "amount": number, // Pure numeric value (integer or float), no currency symbol or text suffix
  "description": "Clear, concise, normalized description in English",
  "category": "food|transport|shopping|entertainment|health|utilities|salary|freelance|investment|gift|loan|credit|other",
  "date": "YYYY-MM-DD" // Default to today's date (${currentDateStr}) if not specified
}

FEW-SHOT EXAMPLES:

Example 1: "I spent 150 taka for lunch yesterday" (assuming current local date is 2026-05-22)
[
  {
    "type": "expense",
    "amount": 150,
    "description": "Lunch",
    "category": "food",
    "date": "2026-05-21"
  }
]

Example 2: "Salary received fifty thousand bdt"
[
  {
    "type": "income",
    "amount": 50000,
    "description": "Salary received",
    "category": "salary",
    "date": "${currentDateStr}"
  }
]

Example 3: "Sajib ke 2.5k dhar dilam"
[
  {
    "type": "credit",
    "amount": 2500,
    "description": "Lent money to Sajib",
    "category": "credit",
    "date": "${currentDateStr}"
  }
]

Example 4: "Dad er theke 5000 tk loan nilam last Sunday" (assuming current local date is 2026-05-22, which is Friday)
[
  {
    "type": "loan",
    "amount": 5000,
    "description": "Borrowed money from Dad",
    "category": "loan",
    "date": "2026-05-17"
  }
]

Example 5: "spent 120 for rickshaw and 40 for tea today"
[
  {
    "type": "expense",
    "amount": 120,
    "description": "Rickshaw fare",
    "category": "transport",
    "date": "${currentDateStr}"
  },
  {
    "type": "expense",
    "amount": 40,
    "description": "Tea",
    "category": "food",
    "date": "${currentDateStr}"
  }
]

Example 6: "credit taken from Lotif 5k"
[
  {
    "type": "loan",
    "amount": 5000,
    "description": "Borrowed money from Lotif",
    "category": "loan",
    "date": "${currentDateStr}"
  }
]

Example 7: "credit given to Lotif 5k"
[
  {
    "type": "credit",
    "amount": 5000,
    "description": "Lent money to Lotif",
    "category": "credit",
    "date": "${currentDateStr}"
  }
]

Example 8: "bought some snacks" (no amount specified)
[
  {
    "error": "missing_amount",
    "message": "Please specify the amount"
  }
]`;
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
  convertBengali,
  sanitizeAmount,
  extractJSON
};
