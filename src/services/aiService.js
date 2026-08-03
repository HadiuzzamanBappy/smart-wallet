import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * AI Service for parsing financial transactions using LLMs via Firebase Cloud Functions
 */
export const parseTransaction = async (message, userCurrency = 'BDT') => {
  if (!message || typeof message !== 'string') return { success: false, error: 'Empty message' };

  try {
    const parseTransactionFn = httpsCallable(functions, 'parseTransaction');
    const result = await parseTransactionFn({ message, userCurrency });
    return result.data;
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

