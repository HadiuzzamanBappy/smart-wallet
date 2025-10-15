import { Timestamp } from 'firebase/firestore';

/**
 * Helper functions for transaction service
 * These are pure functions that don't interact with Firestore directly
 */

// ==================== DATE NORMALIZATION ====================

/**
 * Normalize various date inputs to a Firestore Timestamp
 * @param {Date|string|number|Timestamp|null} dateInput - The date to normalize
 * @returns {Timestamp} Firestore Timestamp
 */
export const normalizeDateToTimestamp = (dateInput) => {
  if (!dateInput) return Timestamp.now();
  
  // Already a Firestore Timestamp
  if (dateInput && typeof dateInput.toDate === 'function') {
    return Timestamp.fromDate(dateInput.toDate());
  }
  
  // JS Date object
  if (dateInput instanceof Date) {
    return Timestamp.fromDate(dateInput);
  }
  
  // Numeric timestamp (milliseconds)
  if (typeof dateInput === 'number' && Number.isFinite(dateInput)) {
    return Timestamp.fromDate(new Date(dateInput));
  }
  
  // ISO-like YYYY-MM-DD string (construct in local time to avoid UTC shift)
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split('-').map(n => parseInt(n, 10));
    return Timestamp.fromDate(new Date(year, month - 1, day));
  }
  
  // Fallback: parse as string
  if (typeof dateInput === 'string') {
    return Timestamp.fromDate(new Date(dateInput));
  }
  
  // Last resort
  return Timestamp.now();
};

// ==================== FINGERPRINTING ====================

/**
 * Normalize a string for fingerprint computation
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export const normalizeStringForFingerprint = (str) => {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Compute a deterministic SHA-256 fingerprint for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<string|null>} Hex fingerprint or null on error
 */
export const computeTransactionFingerprint = async (transaction) => {
  try {
    const type = String(transaction.type || '').toLowerCase();
    const amount = Number(transaction.amount || 0);
    
    // Extract date string
    let dateStr = '';
    if (transaction.date) {
      if (typeof transaction.date === 'string') {
        dateStr = transaction.date;
      } else if (transaction.date.toDate) {
        dateStr = transaction.date.toDate().toISOString().split('T')[0];
      } else if (transaction.date instanceof Date) {
        dateStr = transaction.date.toISOString().split('T')[0];
      }
    }
    
    const desc = normalizeStringForFingerprint(
      transaction.description || transaction.desc || transaction.note || ''
    );
    
    const sourceString = `${type}|${amount}|${dateStr}|${desc}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(sourceString);
    const hashBuffer = await (crypto.subtle || window.crypto.subtle).digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Failed to compute transaction fingerprint:', error);
    return null;
  }
};

// ==================== BALANCE CALCULATIONS ====================

/**
 * Compute the effect of a transaction on user totals
 * Handles both normal transactions and repayments
 * @param {Object} transaction - Transaction object with type, amount, isRepayment, repaymentFor
 * @returns {Object} Effects object with balance and total changes
 */
export const computeTransactionEffects = (transaction) => {
  const amount = Number(transaction.amount || 0);
  const type = transaction.type;
  const isRepayment = !!transaction.isRepayment || !!transaction.adjustmentTag;
  const repaymentFor = transaction.repaymentFor;
  
  // Default effects (no change)
  const effects = {
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalCreditGiven: 0,
    totalLoanTaken: 0
  };
  
  // Repayments only affect balance, not totals
  if (isRepayment) {
    if (repaymentFor === 'loan') {
      // Loan repayment: money leaves user's wallet
      effects.balance = -amount;
    } else if (repaymentFor === 'credit') {
      // Credit collection: money enters user's wallet
      effects.balance = amount;
    } else {
      // Fallback: infer from type
      effects.balance = (type === 'income') ? amount : -amount;
    }
    return effects;
  }
  
  // Normal transactions affect both balance and totals
  switch (type) {
    case 'income':
      effects.balance = amount;
      effects.totalIncome = amount;
      break;
    case 'expense':
      effects.balance = -amount;
      effects.totalExpense = amount;
      break;
    case 'credit':
      effects.balance = -amount;
      effects.totalCreditGiven = amount;
      break;
    case 'loan':
      effects.balance = amount;
      effects.totalLoanTaken = amount;
      break;
    default:
      // Unknown type: treat as expense
      effects.balance = -amount;
      effects.totalExpense = amount;
  }
  
  return effects;
};

/**
 * Compute the delta between two transaction states (for updates)
 * @param {Object} oldTransaction - Original transaction
 * @param {Object} newTransaction - Updated transaction
 * @returns {Object} Delta effects to apply
 */
export const computeTransactionDelta = (oldTransaction, newTransaction) => {
  const oldEffects = computeTransactionEffects(oldTransaction);
  const newEffects = computeTransactionEffects(newTransaction);
  
  return {
    balance: newEffects.balance - oldEffects.balance,
    totalIncome: newEffects.totalIncome - oldEffects.totalIncome,
    totalExpense: newEffects.totalExpense - oldEffects.totalExpense,
    totalCreditGiven: newEffects.totalCreditGiven - oldEffects.totalCreditGiven,
    totalLoanTaken: newEffects.totalLoanTaken - oldEffects.totalLoanTaken
  };
};

/**
 * Reverse transaction effects (for deletes)
 * @param {Object} transaction - Transaction to reverse
 * @returns {Object} Reversed effects
 */
export const reverseTransactionEffects = (transaction) => {
  const effects = computeTransactionEffects(transaction);
  
  return {
    balance: -effects.balance,
    totalIncome: -effects.totalIncome,
    totalExpense: -effects.totalExpense,
    totalCreditGiven: -effects.totalCreditGiven,
    totalLoanTaken: -effects.totalLoanTaken
  };
};

// ==================== VALIDATION ====================

/**
 * Validate transaction data before storing
 * @param {Object} transaction - Transaction to validate
 * @throws {Error} If validation fails
 */
export const validateTransaction = (transaction) => {
  const validTypes = ['income', 'expense', 'credit', 'loan'];
  
  if (!validTypes.includes(transaction.type)) {
    throw new Error(`Invalid transaction type: ${transaction.type}`);
  }
  
  const amount = Number(transaction.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${transaction.amount}`);
  }
};

/**
 * Validate that user totals are not negative
 * @param {Object} totals - Totals object to validate
 * @throws {Error} If any total is negative
 */
export const validateTotalsNotNegative = (totals) => {
  const checks = [
    { name: 'totalIncome', value: totals.totalIncome },
    { name: 'totalExpense', value: totals.totalExpense },
    { name: 'totalCreditGiven', value: totals.totalCreditGiven },
    { name: 'totalLoanTaken', value: totals.totalLoanTaken }
  ];
  
  for (const check of checks) {
    if (Number(check.value) < 0) {
      throw new Error(`Transaction would result in negative ${check.name}. Operation not allowed.`);
    }
  }
};

/**
 * Validate repayment/collection amount
 * @param {number} amount - Amount to validate
 * @param {number} remainingAmount - Remaining debt/credit amount
 * @throws {Error} If validation fails
 */
export const validateRepaymentAmount = (amount, remainingAmount) => {
  const numAmount = Number(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Repayment amount must be a positive number');
  }
  
  if (numAmount > remainingAmount) {
    throw new Error('Repayment amount exceeds remaining amount');
  }
};

// ==================== LINKED TRANSACTION UPDATES ====================

/**
 * Calculate updated paidAmount for linked transaction after repayment
 * @param {number} currentPaidAmount - Current paid amount
 * @param {number} repaymentChange - Change in repayment (positive for new payment, negative for delete)
 * @returns {number} Updated paid amount (non-negative)
 */
export const calculateUpdatedPaidAmount = (currentPaidAmount, repaymentChange) => {
  return Math.max(0, Number(currentPaidAmount || 0) + Number(repaymentChange));
};

/**
 * Check if a transaction is fully paid
 * @param {number} totalAmount - Total loan/credit amount
 * @param {number} paidAmount - Amount paid so far
 * @returns {boolean} True if fully paid
 */
export const isFullyPaid = (totalAmount, paidAmount) => {
  return Number(paidAmount) >= Number(totalAmount);
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Apply effects to user profile totals
 * @param {Object} currentTotals - Current user totals
 * @param {Object} effects - Effects to apply
 * @returns {Object} Updated totals
 */
export const applyEffectsToTotals = (currentTotals, effects) => {
  return {
    balance: Number(currentTotals.balance || 0) + Number(effects.balance || 0),
    totalIncome: Number(currentTotals.totalIncome || 0) + Number(effects.totalIncome || 0),
    totalExpense: Number(currentTotals.totalExpense || 0) + Number(effects.totalExpense || 0),
    totalCreditGiven: Number(currentTotals.totalCreditGiven || 0) + Number(effects.totalCreditGiven || 0),
    totalLoanTaken: Number(currentTotals.totalLoanTaken || 0) + Number(effects.totalLoanTaken || 0)
  };
};

/**
 * Normalize numeric fields in loan/credit data
 * @param {Object} item - Loan or credit item
 * @returns {Object} Normalized item with numeric fields
 */
export const normalizeLoanCreditNumbers = (item) => {
  const amount = Number(item.amount || 0);
  const paidAmount = Number(item.paidAmount || 0);
  
  return {
    ...item,
    amount,
    paidAmount,
    remainingAmount: Math.max(0, amount - paidAmount)
  };
};
