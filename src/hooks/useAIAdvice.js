import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export function useAIAdvice() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (planData, formData) => {
    setLoading(true);
    setError(null);
    setAdvice("");

    try {
      const getAIAdviceFn = httpsCallable(functions, 'getAIAdvice');
      const result = await getAIAdviceFn({ planData, formData });
      const text = result.data.advice || "";
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

