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
  
  // Encrypt sensitive fields
  if (encrypted.amount !== undefined) {
    encrypted.amount_encrypted = await encryptData(encrypted.amount);
    encrypted.amount = 0; // Store dummy value
  }
  
  if (encrypted.description) {
    encrypted.description_encrypted = await encryptData(encrypted.description);
    encrypted.description = 'Transaction'; // Store dummy value
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
  
  // Decrypt sensitive fields
  if (decrypted.amount_encrypted) {
    decrypted.amount = parseFloat(await decryptData(decrypted.amount_encrypted));
  }
  
  if (decrypted.description_encrypted) {
    decrypted.description = await decryptData(decrypted.description_encrypted);
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