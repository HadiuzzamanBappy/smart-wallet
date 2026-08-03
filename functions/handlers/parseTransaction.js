const { onCall, HttpsError } = require("firebase-functions/v2/https");
const {
  getAPIKey,
  getModel,
  convertBengali,
  buildSystemPrompt,
  extractJSON,
  sanitizeAmount
} = require("../utils/parser");

module.exports = onCall({ cors: true }, async (request) => {
  const { message, userCurrency = "BDT" } = request.data;
  
  if (!message || typeof message !== "string") {
    throw new HttpsError("invalid-argument", "The function must be called with a 'message' string.");
  }

  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "OpenRouter API Key is missing on the server.");
  }

  const hasAmountPattern = /(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?|৳|taka|tk|bdt|টাকা|\$|€|£|₹|hundred|thousand|lakh|লক্ষ|crore|কোটি|k\b)/i;
  if (!hasAmountPattern.test(convertBengali(message))) {
    throw new HttpsError("invalid-argument", "Please specify the amount (e.g., '50', '৳100')");
  }

  const localDateStr = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const payload = {
    model: getModel(),
    messages: [
      { role: "system", content: buildSystemPrompt(userCurrency, localDateStr) },
      { role: "user", content: message }
    ],
    max_tokens: 800,
    temperature: 0.05
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API responded with status ${res.status}`);
    }

    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content || "";
    let parsed = extractJSON(content);

    if (parsed && !Array.isArray(parsed)) parsed = [parsed];
    if (!parsed) {
      throw new HttpsError("internal", "Could not parse transactions from AI response.");
    }

    if (parsed.length === 1 && parsed[0].error === "missing_amount") {
      throw new HttpsError("invalid-argument", parsed[0].message);
    }

    const normalized = parsed.map((obj) => {
      const type = (obj?.type || "expense").toLowerCase();
      const category = (type === "loan" || type === "credit") ? type : (obj?.category || "other").toLowerCase();
      return {
        type,
        amount: sanitizeAmount(obj?.amount ?? obj?.value),
        category,
        description: (obj?.description || obj?.desc || "").trim(),
        date: obj?.date && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : localDateStr,
        confidence: obj?.confidence ?? "high"
      };
    });

    const valid = normalized.filter(tx => tx.amount > 0 && tx.description.length > 0);
    if (valid.length === 0) {
      throw new HttpsError("internal", "Incomplete transaction details received from AI.");
    }

    return { success: true, data: valid };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to parse transaction via OpenRouter");
  }
});
