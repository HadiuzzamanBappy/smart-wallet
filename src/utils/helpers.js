import { getCurrencyConfig, DEFAULTS, BUDGET_WARNING_LEVELS } from '../config/constants';

/**
 * Format currency amount with dynamic currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (BDT, USD, EUR, GBP, INR)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = DEFAULTS.CURRENCY) => {
  const config = getCurrencyConfig(currency);
  // Use decimal formatting for numbers and prefix with configured symbol.
  // This avoids relying on Intl currency formatting for non-standard/custom symbols.
  const formattedNumber = new Intl.NumberFormat(config.locale, {
    style: 'decimal',
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals
  }).format(amount || 0);

  // Prefix symbol (e.g., '$' or 'ট') with a thin space for readability when symbol is non-ASCII
  const space = config.symbol && config.symbol.length > 1 ? '\u00A0' : '\u00A0';
  return `${config.symbol}${space}${formattedNumber}`;
};

/**
 * Format currency using user profile currency
 * @param {number} amount - Amount to format
 * @param {Object} userProfile - User profile containing currency preference
 * @returns {string} Formatted currency string
 */
export const formatCurrencyWithUser = (amount, userProfile) => {
  const currency = userProfile?.currency || DEFAULTS.CURRENCY;
  return formatCurrency(amount, currency);
};

/**
 * Calculate budget usage and status
 * @param {number} monthlyBudget - User's monthly budget
 * @param {number} currentSpending - Current month spending
 * @returns {Object} Budget analysis object
 */
export const calculateBudgetStatus = (monthlyBudget, currentSpending) => {
  const budget = Number(monthlyBudget) || 0;
  const spending = Number(currentSpending) || 0;
  
  if (budget <= 0) {
    return {
      hasValidBudget: false,
      percentage: 0,
      remaining: 0,
      exceeded: false,
      warningLevel: 'none',
      status: 'No budget set'
    };
  }
  
  const percentage = Math.round((spending / budget) * 100);
  const remaining = Math.max(0, budget - spending);
  const exceeded = spending > budget;
  
  let warningLevel = BUDGET_WARNING_LEVELS.SAFE;
  let status = 'On track';
  
  if (percentage >= 100) {
    warningLevel = BUDGET_WARNING_LEVELS.DANGER;
    status = 'Budget exceeded';
  } else if (percentage >= 80) {
    warningLevel = BUDGET_WARNING_LEVELS.WARNING;
    status = 'Near budget limit';
  } else if (percentage >= 60) {
    warningLevel = BUDGET_WARNING_LEVELS.CAUTION;
    status = 'Moderate spending';
  }
  
  return {
    hasValidBudget: true,
    percentage,
    remaining,
    exceeded,
    warningLevel,
    status,
    budget,
    spending
  };
};

/**
 * Get current month spending from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Total expenses for current month
 */
export const getCurrentMonthSpending = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return transactions
    .filter(transaction => {
      // Use createdAt for more accurate monthly calculations
      const createdDate = new Date(transaction.createdAt || transaction.date);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear &&
        transaction.type === 'expense'
      );
    })
    .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
/**
 * Format date for display
 * @param {Date|Timestamp|string|number} date - Date to format (supports Firestore Timestamp)
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
};

/**
 * Get greeting based on time of day
 * @returns {string} Greeting message
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Calculate percentage
 * @param {number} part - Part amount
 * @param {number} total - Total amount
 * @returns {number} Percentage
 */
export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Generate random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};