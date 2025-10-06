/**
 * Currency locale mappings
 */
const CURRENCY_LOCALES = {
  BDT: 'en-BD',
  USD: 'en-US',
  EUR: 'en-DE',
  GBP: 'en-GB',
  INR: 'en-IN'
};

/**
 * Format currency amount with dynamic currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (BDT, USD, EUR, GBP, INR)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'BDT') => {
  const locale = CURRENCY_LOCALES[currency] || 'en-BD';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'BDT' ? 0 : 2
  }).format(amount || 0);
};

/**
 * Format currency using user profile currency
 * @param {number} amount - Amount to format
 * @param {Object} userProfile - User profile containing currency preference
 * @returns {string} Formatted currency string
 */
export const formatCurrencyWithUser = (amount, userProfile) => {
  const currency = userProfile?.currency || 'BDT';
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
      warningLevel: 'none', // none, warning, danger
      status: 'No budget set'
    };
  }
  
  const percentage = Math.round((spending / budget) * 100);
  const remaining = Math.max(0, budget - spending);
  const exceeded = spending > budget;
  
  let warningLevel = 'safe';
  let status = 'On track';
  
  if (percentage >= 100) {
    warningLevel = 'danger';
    status = 'Budget exceeded';
  } else if (percentage >= 80) {
    warningLevel = 'warning';
    status = 'Near budget limit';
  } else if (percentage >= 60) {
    warningLevel = 'caution';
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
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
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