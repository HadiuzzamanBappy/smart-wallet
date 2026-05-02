/**
 * Data encryption utility for sensitive transaction data
 * Uses AES-256-GCM encryption for secure data storage
 */

// Key derivation using PBKDF2. Read secret/salt/iterations from Vite env vars
// In development these fall back to the existing values, but in production
// you should provide `VITE_ENC_SECRET` and `VITE_ENC_SALT` in your environment.
const DEFAULT_SECRET = 'smart-wallet-secure-key-2025';
const DEFAULT_SALT = 'smart-wallet-salt-2025';
const DEFAULT_ITERATIONS = 100000;

const getEnv = (name, fallback) => {
  try {
    // Vite exposes env vars on import.meta.env
    const val = import.meta && import.meta.env ? import.meta.env[name] : undefined;
    return val || fallback;
  } catch {
    return fallback;
  }
};

const getEncryptionKey = async () => {
  const secret = String(getEnv('VITE_ENC_SECRET', DEFAULT_SECRET));
  const saltStr = String(getEnv('VITE_ENC_SALT', DEFAULT_SALT));
  const iterationsRaw = getEnv('VITE_ENC_ITERATIONS', DEFAULT_ITERATIONS);
  const iterations = Number.isFinite(Number(iterationsRaw)) ? Number(iterationsRaw) : DEFAULT_ITERATIONS;

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = new TextEncoder().encode(saltStr);

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt sensitive data
 * @param {string|number} data - Data to encrypt
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export const encryptData = async (data) => {
  try {
    if (data === null || data === undefined) return data;

    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const dataString = String(data);
    const encodedData = new TextEncoder().encode(dataString);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to original data
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string>} Decrypted data
 */
/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string>} Decrypted data or original if not encrypted
 */
export const decryptData = async (encryptedData) => {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;

    // Check if it looks like our encrypted format (at least 12 bytes IV + data)
    // Minimal length for AES-GCM (12 bytes IV + 16 bytes auth tag + at least 1 byte data)
    // Base64 of 29 bytes is around 40 chars.
    if (encryptedData.length < 20) return encryptedData;

    const key = await getEncryptionKey();

    // Convert from base64
    let combined;
    try {
      combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );
    } catch {
      return encryptedData; // Not valid base64, return as is
    }

    if (combined.length < 13) return encryptedData; // Too short to be IV + Data

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decryptedData);
  } catch {
    // If decryption fails, it's likely not encrypted or encrypted with a different key
    // In "Hybrid" mode, we return the original data to support plain-text legacy data
    return encryptedData;
  }
};

export const encryptTransactionData = async (transactionData) => {
  const encrypted = { ...transactionData };

  // 1. Numeric fields
  const numericFields = ['amount', 'paidAmount', 'originalAmount'];
  for (const field of numericFields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[`${field}_encrypted`] = await encryptData(encrypted[field]);
      delete encrypted[field];
    }
  }

  // 2. Text/categorical fields
  const textFields = ['description', 'category', 'type', 'originalDescription'];
  for (const field of textFields) {
    if (encrypted[field]) {
      encrypted[`${field}_encrypted`] = await encryptData(encrypted[field]);
      delete encrypted[field];
    }
  }

  // 3. Debt status
  if (encrypted.isFullyPaid !== undefined) {
    encrypted.isFullyPaid_encrypted = await encryptData(encrypted.isFullyPaid ? 'true' : 'false');
    delete encrypted.isFullyPaid;
  }
  
  // 4. Complex fields (Arrays/Objects)
  if (encrypted.adjustmentHistory) {
    encrypted.adjustmentHistory_encrypted = await encryptData(JSON.stringify(encrypted.adjustmentHistory));
    delete encrypted.adjustmentHistory;
  }

  return encrypted;
};

/**
 * Decrypt transaction data after retrieving
 * Supports "Hybrid" mode where some fields might be raw (migration state)
 * @param {Object} transactionData - Transaction object with encrypted fields
 * @returns {Promise<Object>} Transaction with decrypted sensitive fields
 */
export const decryptTransactionData = async (transactionData) => {
  if (!transactionData) return transactionData;
  const decrypted = { ...transactionData };

  // 1. Numeric Fields Decryption
  const numericFields = [
    { key: 'amount', default: 0 },
    { key: 'paidAmount', default: 0 },
    { key: 'originalAmount', default: 0 }
  ];

  for (const field of numericFields) {
    const encKey = `${field.key}_encrypted`;
    if (decrypted[encKey]) {
      const val = await decryptData(decrypted[encKey]);
      decrypted[field.key] = parseFloat(val);
    }

    // Fallback to raw or default
    if (decrypted[field.key] === undefined || isNaN(decrypted[field.key])) {
      decrypted[field.key] = Number(transactionData[field.key]) || field.default;
    }
  }

  // 2. Text Fields Decryption
  const textFields = [
    { key: 'description', default: 'Transaction' },
    { key: 'category', default: 'other' },
    { key: 'type', default: 'expense' },
    { key: 'originalDescription', default: '' }
  ];

  for (const field of textFields) {
    const encKey = `${field.key}_encrypted`;
    if (decrypted[encKey]) {
      decrypted[field.key] = await decryptData(decrypted[encKey]);
    }

    // Fallback to raw or default
    if (decrypted[field.key] === undefined || decrypted[field.key] === null) {
      decrypted[field.key] = transactionData[field.key] || field.default;
    }
  }

  // 3. Status Fields Decryption
  if (decrypted.isFullyPaid_encrypted) {
    const val = await decryptData(decrypted.isFullyPaid_encrypted);
    decrypted.isFullyPaid = val === 'true';
  } else if (decrypted.isFullyPaid === undefined) {
    decrypted.isFullyPaid = transactionData.isFullyPaid !== undefined ? transactionData.isFullyPaid : true;
  }
  
  // 4. Complex Fields Decryption
  if (decrypted.adjustmentHistory_encrypted) {
    try {
      const val = await decryptData(decrypted.adjustmentHistory_encrypted);
      decrypted.adjustmentHistory = JSON.parse(val);
    } catch (e) {
      console.warn("Failed to decrypt adjustment history", e);
    }
  } else if (!decrypted.adjustmentHistory && transactionData.adjustmentHistory) {
    decrypted.adjustmentHistory = transactionData.adjustmentHistory;
  }

  return decrypted;
};

/**
 * Batch decrypt transactions
 * @param {Array} transactions - Array of transactions with encrypted data
 * @returns {Promise<Array>} Array of decrypted transactions
 */
export const decryptTransactions = async (transactions) => {
  if (!Array.isArray(transactions)) return [];
  return Promise.all(transactions.map(decryptTransactionData));
};

/**
 * Encrypt user profile data before storing
 * @param {Object} profileData - User profile object
 * @returns {Promise<Object>} Profile with encrypted sensitive fields
 */
export const encryptUserProfile = async (profileData) => {
  if (!profileData) return profileData;
  const encrypted = { ...profileData };
  
  // 1. Numeric fields (Financial data)
  const numericFields = [
    'balance', 'totalIncome', 'totalExpense', 'monthlyBudget', 
    'totalCreditGiven', 'totalLoanTaken'
  ];

  // 2. Personal/Setting fields (Identity & Preferences)
  const personalFields = [
    'email', 'displayName', 'currency', 'theme', 'language', 
    'notifications', 'budgetAlerts'
  ];

  // Encrypt numeric fields
  for (const field of numericFields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[`${field}_encrypted`] = await encryptData(encrypted[field]);
      delete encrypted[field];
    }
  }

  // Encrypt personal fields
  for (const field of personalFields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      // Convert everything to string for encryption
      const val = typeof encrypted[field] === 'object' ? JSON.stringify(encrypted[field]) : String(encrypted[field]);
      encrypted[`${field}_encrypted`] = await encryptData(val);
      delete encrypted[field];
    }
  }
  
  return encrypted;
};

/**
 * Decrypt user profile data after retrieving
 * Supports "Hybrid" mode where some fields might be raw
 * @param {Object} profileData - User profile object with encrypted fields
 * @returns {Promise<Object>} Profile with decrypted sensitive fields
 */
export const decryptUserProfile = async (profileData) => {
  if (!profileData) return profileData;
  const decrypted = { ...profileData };
  
  // 1. Decrypt numeric fields
  const numericFields = [
    { key: 'balance', default: 0 },
    { key: 'totalIncome', default: 0 },
    { key: 'totalExpense', default: 0 },
    { key: 'monthlyBudget', default: 0 },
    { key: 'totalCreditGiven', default: 0 },
    { key: 'totalLoanTaken', default: 0 }
  ];

  for (const field of numericFields) {
    const encKey = `${field.key}_encrypted`;
    if (decrypted[encKey]) {
      const val = await decryptData(decrypted[encKey]);
      decrypted[field.key] = parseFloat(val) || 0;
    }
    
    // Fallback to raw field
    if (decrypted[field.key] === undefined || (decrypted[field.key] === 0 && profileData[field.key] !== undefined)) {
      decrypted[field.key] = parseFloat(profileData[field.key]) || field.default;
    }
  }

  // 2. Decrypt personal/setting fields
  const personalFields = [
    { key: 'email', default: '' },
    { key: 'displayName', default: 'User' },
    { key: 'currency', default: 'BDT' },
    { key: 'theme', default: 'system' },
    { key: 'language', default: 'en' }
  ];

  for (const field of personalFields) {
    const encKey = `${field.key}_encrypted`;
    if (decrypted[encKey]) {
      decrypted[field.key] = await decryptData(decrypted[encKey]);
    }
    
    // Fallback to raw field
    if (!decrypted[field.key] && profileData[field.key]) {
      decrypted[field.key] = profileData[field.key];
    }
    
    // Final default
    if (!decrypted[field.key]) {
      decrypted[field.key] = field.default;
    }
  }

  // 3. Decrypt boolean/object settings
  const complexFields = ['notifications', 'budgetAlerts'];
  for (const key of complexFields) {
    const encKey = `${key}_encrypted`;
    if (decrypted[encKey]) {
      const val = await decryptData(decrypted[encKey]);
      try {
        // Try parsing as JSON if it was a boolean or object
        decrypted[key] = JSON.parse(val);
      } catch {
        decrypted[key] = val; // String fallback
      }
    } else if (decrypted[key] === undefined && profileData[key] !== undefined) {
      decrypted[key] = profileData[key];
    }
  }

  return decrypted;
};

/**
 * Encrypt chat/message data before storing
 * @param {Object} messageData - Message object
 * @returns {Promise<Object>} Message with encrypted content
 */
export const encryptMessageData = async (messageData) => {
  const encrypted = { ...messageData };

  if (encrypted.message) {
    encrypted.message_encrypted = await encryptData(encrypted.message);
    delete encrypted.message;
  }

  return encrypted;
};

/**
 * Decrypt chat/message data after retrieving
 * @param {Object} messageData - Message object with encrypted fields
 * @returns {Promise<Object>} Message with decrypted content
 */
export const decryptMessageData = async (messageData) => {
  if (!messageData) return messageData;
  const decrypted = { ...messageData };

  if (decrypted.message_encrypted) {
    decrypted.message = await decryptData(decrypted.message_encrypted);
  }

  // Fallback to raw message if decryption didn't happen
  if (decrypted.message === undefined && messageData.message) {
    decrypted.message = messageData.message;
  }

  return decrypted;
};