/**
 * Application-wide constants and configuration
 * Centralized location for all constant values used across the app
 */

/**
 * Supported currencies configuration
 * Each currency has locale, symbol, decimal places, and metadata
 */
export const CURRENCIES = {
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: 'ট',
    locale: 'en-BD',
    decimals: 0,
    flag: '🇧🇩',
    label: 'ট BDT'
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    decimals: 2,
    flag: '🇺🇸',
    label: '$ USD'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'en-DE',
    decimals: 2,
    flag: '🇪🇺',
    label: '€ EUR'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
    decimals: 2,
    flag: '🇬🇧',
    label: '£ GBP'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    decimals: 2,
    flag: '🇮🇳',
    label: '₹ INR'
  }
};

/**
 * Get currency configuration by code
 * @param {string} code - Currency code (BDT, USD, etc.)
 * @returns {Object} Currency configuration object
 */
export const getCurrencyConfig = (code = 'BDT') => {
  return CURRENCIES[code] || CURRENCIES.BDT;
};

/**
 * Get array of currency options for dropdowns
 * @returns {Array} Array of currency objects with value, label, flag
 */
export const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map(c => ({
    value: c.code,
    label: c.label,
    flag: c.flag
  }));
};

/**
 * Get locale for a currency code
 * @param {string} code - Currency code
 * @returns {string} Locale string
 */
export const getCurrencyLocale = (code = 'BDT') => {
  return getCurrencyConfig(code).locale;
};

/**
 * Get symbol for a currency code
 * @param {string} code - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (code = 'BDT') => {
  return getCurrencyConfig(code).symbol;
};

/**
 * Get decimal places for a currency code
 * @param {string} code - Currency code
 * @returns {number} Number of decimal places
 */
export const getCurrencyDecimals = (code = 'BDT') => {
  return getCurrencyConfig(code).decimals;
};

/**
 * Transaction type constants
 */
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  CREDIT: 'credit',
  LOAN: 'loan',
  REPAYMENT: 'repayment',
  COLLECTION: 'collection'
};

/**
 * Transaction categories with emojis and colors
 */
export const TRANSACTION_CATEGORIES = {
  food: { emoji: '🍔', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Food' },
  transport: { emoji: '🚗', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Transport' },
  shopping: { emoji: '🛍️', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200', label: 'Shopping' },
  entertainment: { emoji: '🎬', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Entertainment' },
  health: { emoji: '🏥', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Health' },
  utilities: { emoji: '💡', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Utilities' },
  salary: { emoji: '💰', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Salary' },
  freelance: { emoji: '💼', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', label: 'Freelance' },
  investment: { emoji: '📈', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', label: 'Investment' },
  gift: { emoji: '🎁', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200', label: 'Gift' },
  loan: { emoji: '🏦', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Loan' },
  credit: { emoji: '💳', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Credit' },
  other: { emoji: '📝', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', label: 'Other' }
};

/**
 * Get category metadata
 * @param {string} category - Category name
 * @returns {Object} Category configuration with emoji, color, label
 */
export const getCategoryConfig = (category) => {
  return TRANSACTION_CATEGORIES[category?.toLowerCase()] || TRANSACTION_CATEGORIES.other;
};

/**
 * Application event names for custom events
 */
export const APP_EVENTS = {
  TRANSACTION_ADDED: 'wallet:transaction-added',
  TRANSACTION_UPDATED: 'wallet:transaction-updated',
  TRANSACTION_EDITED: 'wallet:transaction-edited', // alias for in-place edits
  TRANSACTION_DELETED: 'wallet:transaction-deleted',
  TRANSACTIONS_UPDATED: 'wallet:transactions-updated', // bulk/refresh event
  CURRENCY_CHANGED: 'wallet:currency-changed',
  SALARY_PLAN_UPDATED: 'salary-plan-updated'
};

// Backwards-compatible alias for profile updates
export const PROFILE_EVENTS = {
  PROFILE_UPDATED: 'wallet:profile-updated'
};

/**
 * Default application values
 */
export const DEFAULTS = {
  CURRENCY: 'BDT',
  PAGE_SIZE: 8,
  DATE_FORMAT: 'en-US',
  DEBOUNCE_DELAY: 50
};

/**
 * Budget warning levels
 */
export const BUDGET_WARNING_LEVELS = {
  SAFE: 'safe',
  CAUTION: 'caution',
  WARNING: 'warning',
  DANGER: 'danger'
};

/**
 * Date range filter options (in days)
 */
export const DATE_RANGES = {
  ALL: 'all',
  WEEK: '7',
  MONTH: '30',
  QUARTER: '90',
  YEAR: '365'
};
