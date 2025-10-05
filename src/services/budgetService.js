import { calculateBudgetStatus, getCurrentMonthSpending } from '../utils/helpers';

/**
 * Check budget status after transaction and return alert information
 * @param {Object} userProfile - User profile with budget settings
 * @param {Array} transactions - User transactions
 * @param {Object} newTransaction - The transaction that was just added
 * @returns {Object} Budget check result with alert info
 */
export const checkBudgetAfterTransaction = (userProfile, transactions, newTransaction) => {
  // Only check budget for expense transactions
  if (newTransaction.type !== 'expense' || !userProfile?.budgetAlerts) {
    return { needsAlert: false };
  }

  // Calculate current spending including the new transaction
  const allTransactions = [...transactions, newTransaction];
  const currentSpending = getCurrentMonthSpending(allTransactions);
  const budgetStatus = calculateBudgetStatus(userProfile.monthlyBudget, currentSpending);

  if (!budgetStatus.hasValidBudget) {
    return { needsAlert: false };
  }

  // Determine alert level
  let alertType = null;
  let alertMessage = '';

  if (budgetStatus.percentage >= 100 && budgetStatus.exceeded) {
    alertType = 'danger';
    alertMessage = `⚠️ Budget Exceeded! You've spent ${budgetStatus.percentage}% of your monthly budget. Consider reviewing your expenses.`;
  } else if (budgetStatus.percentage >= 80) {
    alertType = 'warning';
    alertMessage = `⚠️ Budget Alert! You've used ${budgetStatus.percentage}% of your monthly budget. You're approaching your limit.`;
  } else if (budgetStatus.percentage >= 60) {
    alertType = 'info';
    alertMessage = `ℹ️ Budget Update: You've used ${budgetStatus.percentage}% of your monthly budget. Still on track!`;
  }

  return {
    needsAlert: alertType !== null,
    alertType,
    alertMessage,
    budgetStatus,
    previousSpending: currentSpending - newTransaction.amount,
    newSpending: currentSpending
  };
};

/**
 * Get budget summary for display
 * @param {Object} userProfile - User profile with budget settings  
 * @param {Array} transactions - User transactions
 * @returns {Object} Budget summary
 */
export const getBudgetSummary = (userProfile, transactions) => {
  const currentSpending = getCurrentMonthSpending(transactions);
  const budgetStatus = calculateBudgetStatus(userProfile?.monthlyBudget, currentSpending);
  
  return {
    ...budgetStatus,
    currentSpending,
    monthlyBudget: userProfile?.monthlyBudget || 0,
    alertsEnabled: userProfile?.budgetAlerts !== false
  };
};