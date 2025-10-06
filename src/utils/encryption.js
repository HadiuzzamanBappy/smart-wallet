/**
 * Data encryption utility for sensitive transaction data
 * Uses AES-256-GCM encryption for secure data storage
 */

// Simple encryption key derivation (in production, use proper key management)
const getEncryptionKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('wallet-tracker-secure-key-2025'),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = new TextEncoder().encode('wallet-salt-2025');
  
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
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
export const decryptData = async (encryptedData) => {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;
    
    const key = await getEncryptionKey();
    
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

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
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Fallback to original data
  }
};

/**
 * Encrypt transaction data before storing
 * @param {Object} transactionData - Transaction object
 * @returns {Promise<Object>} Transaction with encrypted sensitive fields
 */
export const encryptTransactionData = async (transactionData) => {
  const encrypted = { ...transactionData };
  
  // Encrypt sensitive fields and remove originals for privacy
  if (encrypted.amount !== undefined) {
    encrypted.amount_encrypted = await encryptData(encrypted.amount);
    delete encrypted.amount; // Remove original field completely
  }
  
  if (encrypted.description) {
    encrypted.description_encrypted = await encryptData(encrypted.description);
    delete encrypted.description; // Remove original field completely
  }

  return encrypted;
};

/**
 * Decrypt transaction data after retrieving
 * @param {Object} transactionData - Transaction object with encrypted fields
 * @returns {Promise<Object>} Transaction with decrypted sensitive fields
 */
export const decryptTransactionData = async (transactionData) => {
  const decrypted = { ...transactionData };
  
  // Decrypt sensitive fields or provide defaults
  if (decrypted.amount_encrypted) {
    decrypted.amount = parseFloat(await decryptData(decrypted.amount_encrypted));
  } else if (decrypted.amount === undefined) {
    decrypted.amount = 0; // Default for missing amount
  }
  
  if (decrypted.description_encrypted) {
    decrypted.description = await decryptData(decrypted.description_encrypted);
  } else if (decrypted.description === undefined) {
    decrypted.description = 'Transaction'; // Default for missing description
  }

  return decrypted;
};

/**
 * Batch decrypt transactions
 * @param {Array} transactions - Array of transactions with encrypted data
 * @returns {Promise<Array>} Array of decrypted transactions
 */
export const decryptTransactions = async (transactions) => {
  return Promise.all(transactions.map(decryptTransactionData));
};

/**
 * Encrypt user profile data before storing
 * @param {Object} profileData - User profile object
 * @returns {Promise<Object>} Profile with encrypted sensitive fields
 */
export const encryptUserProfile = async (profileData) => {
  const encrypted = { ...profileData };
  
  // Encrypt numeric/sensitive fields and remove original fields for privacy
  if (encrypted.balance !== undefined && encrypted.balance !== null) {
    encrypted.balance_encrypted = await encryptData(encrypted.balance);
    delete encrypted.balance; // Remove original field completely
  }
  
  if (encrypted.totalIncome !== undefined && encrypted.totalIncome !== null) {
    encrypted.totalIncome_encrypted = await encryptData(encrypted.totalIncome);
    delete encrypted.totalIncome; // Remove original field completely
  }
  
  if (encrypted.totalExpense !== undefined && encrypted.totalExpense !== null) {
    encrypted.totalExpense_encrypted = await encryptData(encrypted.totalExpense);
    delete encrypted.totalExpense; // Remove original field completely
  }
  
  if (encrypted.monthlyBudget !== undefined && encrypted.monthlyBudget !== null) {
    encrypted.monthlyBudget_encrypted = await encryptData(encrypted.monthlyBudget);
    delete encrypted.monthlyBudget; // Remove original field completely
  }
  
  // Also encrypt other numeric fields that might be present
  if (encrypted.totalCreditGiven !== undefined && encrypted.totalCreditGiven !== null) {
    encrypted.totalCreditGiven_encrypted = await encryptData(encrypted.totalCreditGiven);
    delete encrypted.totalCreditGiven; // Remove original field completely
  }
  
  if (encrypted.totalLoanTaken !== undefined && encrypted.totalLoanTaken !== null) {
    encrypted.totalLoanTaken_encrypted = await encryptData(encrypted.totalLoanTaken);
    delete encrypted.totalLoanTaken; // Remove original field completely
  }

  return encrypted;
};

/**
 * Decrypt user profile data after retrieving
 * @param {Object} profileData - User profile object with encrypted fields
 * @returns {Promise<Object>} Profile with decrypted sensitive fields
 */
export const decryptUserProfile = async (profileData) => {
  const decrypted = { ...profileData };
  
  // Decrypt numeric fields or provide defaults
  if (decrypted.balance_encrypted) {
    decrypted.balance = parseFloat(await decryptData(decrypted.balance_encrypted)) || 0;
  } else if (decrypted.balance === undefined) {
    decrypted.balance = 0; // Default for new fields
  }
  
  if (decrypted.totalIncome_encrypted) {
    decrypted.totalIncome = parseFloat(await decryptData(decrypted.totalIncome_encrypted)) || 0;
  } else if (decrypted.totalIncome === undefined) {
    decrypted.totalIncome = 0; // Default for new fields
  }
  
  if (decrypted.totalExpense_encrypted) {
    decrypted.totalExpense = parseFloat(await decryptData(decrypted.totalExpense_encrypted)) || 0;
  } else if (decrypted.totalExpense === undefined) {
    decrypted.totalExpense = 0; // Default for new fields
  }
  
  if (decrypted.monthlyBudget_encrypted) {
    decrypted.monthlyBudget = parseFloat(await decryptData(decrypted.monthlyBudget_encrypted)) || 0;
  } else if (decrypted.monthlyBudget === undefined) {
    decrypted.monthlyBudget = 0; // Default for new fields
  }
  
  // Decrypt additional numeric fields if present
  if (decrypted.totalCreditGiven_encrypted) {
    decrypted.totalCreditGiven = parseFloat(await decryptData(decrypted.totalCreditGiven_encrypted)) || 0;
  } else if (decrypted.totalCreditGiven === undefined) {
    decrypted.totalCreditGiven = 0; // Default for new fields
  }
  
  if (decrypted.totalLoanTaken_encrypted) {
    decrypted.totalLoanTaken = parseFloat(await decryptData(decrypted.totalLoanTaken_encrypted)) || 0;
  } else if (decrypted.totalLoanTaken === undefined) {
    decrypted.totalLoanTaken = 0; // Default for new fields
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
  
  // Encrypt message content
  if (encrypted.message) {
    encrypted.message_encrypted = await encryptData(encrypted.message);
    delete encrypted.message; // Remove original field completely for privacy
  }
  
  if (encrypted.originalMessage) {
    encrypted.originalMessage_encrypted = await encryptData(encrypted.originalMessage);
    delete encrypted.originalMessage; // Remove original field completely for privacy
  }

  return encrypted;
};

/**
 * Decrypt chat/message data after retrieving
 * @param {Object} messageData - Message object with encrypted fields
 * @returns {Promise<Object>} Message with decrypted content
 */
export const decryptMessageData = async (messageData) => {
  const decrypted = { ...messageData };
  
  // Decrypt message content
  if (decrypted.message_encrypted) {
    decrypted.message = await decryptData(decrypted.message_encrypted);
  }
  
  if (decrypted.originalMessage_encrypted) {
    decrypted.originalMessage = await decryptData(decrypted.originalMessage_encrypted);
  }

  return decrypted;
};