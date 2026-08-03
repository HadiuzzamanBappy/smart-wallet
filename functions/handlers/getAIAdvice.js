const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAPIKey, getModel } = require("../utils/parser");

module.exports = onCall({ cors: true }, async (request) => {
  const { planData, formData } = request.data;

  if (!planData || !formData) {
    throw new HttpsError("invalid-argument", "Must provide planData and formData.");
  }

  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "OpenRouter API Key is missing on the server.");
  }

  const payload = {
    income: { 
      salary: planData.salary, 
      extra: planData.extra, 
      total: planData.totalIncome 
    },
    fixed: { 
      rent: planData.rent, 
      familySend: planData.familySend,
      totalEMI: planData.totalEMI, 
      bills: planData.bills 
    },
    savings: { 
      monthly: planData.actualSavings, 
      rate: planData.savingsRate,
      gap: planData.savingsGap, 
      efMonths: planData.efMonths 
    },
    loans: formData.loans || [],
    deposits: formData.deposits || [],
    untrackedMoney: planData.untrackedMoney,
    flags: planData.flags ? planData.flags.map(f => f.msg) : [],
    ageBracket: formData.ageBracket,
    cityTier: formData.cityTier,
    goal: { amount: planData.goal, months: planData.goalMonths },
    currency: planData.currency,
  };

  const systemPrompt = `You are a sharp personal finance advisor inside a Smart Wallet app.
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

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(payload) }
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API responded with status ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { advice: text };
  } catch (error) {
    throw new HttpsError("internal", error.message || "Failed to generate AI advice");
  }
});
