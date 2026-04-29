import { useState } from 'react';

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

export function useAIAdvice() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (planData, formData) => {
    setLoading(true);
    setError(null);
    setAdvice("");

    const apiKey = getAPIKey();
    if (!apiKey) {
      setError("API key missing. Your calculations are still accurate above.");
      setLoading(false);
      return "";
    }
    const model = getModel();

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
      flags: planData.flags.map(f => f.msg),
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
          model,
          max_tokens: 800,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(payload) }
          ],
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      setAdvice(text);
      return text;
    } catch (err) {
      console.error("AI Advice Error:", err);
      setError("AI advice unavailable. Your calculations are still accurate above.");
      return "";
    } finally {
      setLoading(false);
    }
  };

  return { advice, loading, error, generate };
}
