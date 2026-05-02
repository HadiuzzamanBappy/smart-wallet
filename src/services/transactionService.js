import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
  runTransaction,
  limit
} from 'firebase/firestore';
import {
  encryptTransactionData,
  decryptTransactions,
  encryptUserProfile,
  decryptUserProfile
} from '../utils/encryption';
import {
  normalizeDateToTimestamp,
  computeTransactionFingerprint,
  validateTransaction,
  calculateUpdatedPaidAmount,
  isFullyPaid
} from '../utils/transactionHelpers';
import { APP_EVENTS } from '../config/constants';
import { deleteSalaryPlan } from './salaryService';

/**
 * Add a new transaction to the user's account
 * @param {string} userId - User's unique identifier
 * @param {Object} transactionData - Transaction data (type, amount, description, date, etc.)
 * @returns {Promise<string>} Created transaction ID
 * @throws {Error} If validation fails or database operation fails
 */
export const addTransaction = async (userId, transactionData) => {
  try {
    // Validate transaction data
    validateTransaction(transactionData);

    // Prepare transaction data for encryption with normalized fields
    const transactionToStore = {
      ...transactionData,
      amount: Number(transactionData.amount), // Ensure number type
      userId,
      createdAt: Timestamp.now(),
      date: normalizeDateToTimestamp(transactionData.date),
      source: transactionData.source || 'manual' // Track if created via chat or manual entry
      // Do NOT include original user message/prompt to preserve user privacy
    };

    // Compute import fingerprint (store as plaintext to allow future dedupe)
    try {
      const fp = await computeTransactionFingerprint(transactionToStore);
      if (fp) transactionToStore.importFingerprint = fp;
    } catch {
      // ignore fingerprint errors
    }

    // Encrypt sensitive transaction data
    const encryptedTransaction = await encryptTransactionData(transactionToStore);

    // Add encrypted transaction to database
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const docRef = await addDoc(transactionsRef, encryptedTransaction);

    // Update user balance. Pass the stored transaction so updateUserBalance can make
    // decisions based on flags like isRepayment/isRepaymentFor (loan/credit).
    const storedTx = { id: docRef.id, ...transactionToStore };
    await updateUserBalance(userId, storedTx);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's balance and totals based on a transaction
 * @param {string} userId - User's unique identifier
 * @param {Object|string} txOrType - Transaction object or type string (for backwards compatibility)
 * @param {number} [maybeAmount] - Amount (only used if txOrType is a string)
 * @returns {Promise<Object>} Success/error result
 */
export const updateUserBalance = async (userId, txOrType, maybeAmount) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Backwards compatible invocation: updateUserBalance(userId, type, amount)
    let tx = null;
    if (typeof txOrType === 'string') {
      tx = { type: txOrType, amount: maybeAmount };
    } else {
      tx = txOrType || {};
    }

    // Basic validation
    const type = tx.type;
    const amount = Number(tx.amount || 0);

    if (!type || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid type or amount for updateUserBalance');
    }

    // Prepare encrypted update (excluding redundant calculated fields)
    const updatedData = {
      // We no longer save balance/income/expense as they are calculated on the fly
      updatedAt: Timestamp.now()
    };

    const encryptedUpdatedData = await encryptUserProfile(updatedData);
    await updateDoc(userRef, encryptedUpdatedData);

    return { success: true };
  } catch (error) {
    console.error('Error updating balance:', error);
    return { success: false, error: error.message };
  }
};

export const getTransactions = async (userId, filters = {}) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    let q = query(transactionsRef, orderBy('createdAt', 'desc'));

    // We CANNOT filter by 'type' or 'category' in Firestore anymore because they are encrypted.
    // We must fetch and filter locally.
    // If a limit is provided, we fetch a larger batch or all to ensure we find enough matches after local filtering.
    // For now, if type/category filters are used, we fetch all to ensure correctness.
    if (filters.limit && !filters.type && !filters.category) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || doc.data().createdAt?.toDate() || new Date()
    }));

    // Decrypt the transactions
    let transactions = await decryptTransactions(encryptedTransactions);

    // Apply local filtering for encrypted fields
    if (filters.type) {
      transactions = transactions.filter(tx => tx.type === filters.type);
    }

    if (filters.category) {
      transactions = transactions.filter(tx => tx.category === filters.category);
    }

    // Apply limit locally if it wasn't applied in the query
    if (filters.limit) {
      transactions = transactions.slice(0, filters.limit);
    }

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error getting transactions:", error);
    return { success: false, error: error.message };
  }
};

export const getRecentTransactions = async (userId, limitCount = 10) => {
  return getTransactions(userId, { limit: limitCount });
};

/**
 * Delete a transaction and cascade-delete any linked repayments
 * @param {string} userId - User's unique identifier
 * @param {string} transactionId - Transaction ID to delete
 * @param {Object} [transactionData] - Optional cached transaction data to avoid decrypt
 * @returns {Promise<Object>} Success/error result
 */
export const deleteTransaction = async (userId, transactionId, transactionData) => {
  try {
    const transactionRef = doc(db, `users/${userId}/transactions/${transactionId}`);
    const userRef = doc(db, 'users', userId);

    // Holder for event emission after commit
    let deletedTransactionInfo = null;

    // Find any repayment/collection transactions that link to this original (cascade-delete)
    let linkedRepayments = [];
    try {
      const transactionsRef = collection(db, `users/${userId}/transactions`);
      const linkedQueryAll = query(transactionsRef, where('linkedTransactionId', '==', transactionId));
      const linkedSnapAll = await getDocs(linkedQueryAll);
      if (!linkedSnapAll.empty) {
        linkedRepayments = linkedSnapAll.docs.map(d => ({ id: d.id, data: d.data() }));
      }
    } catch {
      linkedRepayments = [];
    }

    await runTransaction(db, async (tx) => {
      // Read transaction inside the transaction to ensure consistency
      const txSnap = await tx.get(transactionRef);
      if (!txSnap.exists()) {
        throw new Error('Transaction not found');
      }

      // Decrypt the transaction
      const encryptedTx = { id: txSnap.id, ...txSnap.data() };
      const [decryptedTx] = await decryptTransactions([encryptedTx]);

      // Always use decrypted data for critical operations to ensure data integrity
      const transactionAmount = Number(decryptedTx.amount) || 0;
      const transactionType = decryptedTx.type;

      console.debug(`[DELETE] Deleting transaction ${transactionId}: type=${transactionType}, amount=${transactionAmount}`);

      // Read user profile
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      // If deleting a repayment, update the linked original's paidAmount
      if (decryptedTx.isRepayment && decryptedTx.linkedTransactionId) {
        try {
          const linkedRef = doc(db, `users/${userId}/transactions/${decryptedTx.linkedTransactionId}`);
          const linkedSnap = await tx.get(linkedRef);
          if (linkedSnap.exists()) {
            const [linkedDecrypted] = await decryptTransactions([{ id: linkedSnap.id, ...linkedSnap.data() }]);
            const newPaid = calculateUpdatedPaidAmount(linkedDecrypted.paidAmount || 0, -transactionAmount);
            const updatedLinked = {
              ...linkedDecrypted,
              paidAmount: newPaid,
              isFullyPaid: isFullyPaid(linkedDecrypted.amount, newPaid),
              lastPaymentDate: newPaid > 0 ? linkedDecrypted.lastPaymentDate : null,
              updatedAt: Timestamp.now()
            };
            const encryptedLinked = await encryptTransactionData(updatedLinked);
            tx.update(linkedRef, encryptedLinked);
          }
        } catch (err) {
          console.warn('Failed to update linked loan/credit during delete:', err?.message || err);
        }
      }

      // Cascade-delete linked repayments
      if (linkedRepayments.length > 0) {
        console.debug(`[DELETE] Cascade-deleting ${linkedRepayments.length} linked repayments`);
        for (const linked of linkedRepayments) {
          try {
            const linkedRef = doc(db, `users/${userId}/transactions/${linked.id}`);
            // Delete the linked repayment
            tx.delete(linkedRef);
          } catch (err) {
            console.warn('Failed to cascade-delete linked repayment:', err?.message || err);
          }
        }
      }

      // Prepare encrypted update (we only update the timestamp now)
      const updatedData = {
        updatedAt: Timestamp.now()
      };

      const encryptedUpdatedData = await encryptUserProfile(updatedData);

      // Commit delete and update atomically
      tx.delete(transactionRef);
      tx.update(userRef, encryptedUpdatedData);

      deletedTransactionInfo = {
        transactionId,
        transactionData: transactionData || decryptedTx,
        isRepayment: (transactionData && transactionData.isRepayment) || decryptedTx.isRepayment || false
      };
    });

    // Emit event after commit
    const event = new CustomEvent(APP_EVENTS.TRANSACTION_DELETED, {
      detail: deletedTransactionInfo
    });
    window.dispatchEvent(event);

    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Decrypt sensitive profile data
      const encryptedData = userDoc.data();
      const decryptedData = await decryptUserProfile(encryptedData);
      return { success: true, data: decryptedData };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing transaction and adjust user balances accordingly
 * @param {string} transactionId - Firestore doc ID for transaction
 * @param {Object} updates - Fields to update (type, amount, category, description, date, userId)
 * @returns {Promise<Object>} Success/error result
 * @throws {Error} If validation fails or if guards prevent the update
 */
export const updateTransaction = async (transactionId, updates) => {
  try {
    const { userId, ...rest } = updates;
    if (!userId) {
      throw new Error('userId required to update transaction');
    }

    const transactionRef = doc(db, `users/${userId}/transactions/${transactionId}`);
    const txDoc = await getDoc(transactionRef);
    if (!txDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const encryptedOld = { id: txDoc.id, ...txDoc.data() };
    const [oldDecrypted] = await decryptTransactions([encryptedOld]);

    const oldAmount = Number(oldDecrypted.amount || 0);
    const oldType = oldDecrypted.type || 'expense';

    // Guard: Prevent invalid edits to loans/credits with repayments
    if ((oldType === 'loan' || oldType === 'credit')) {
      try {
        const transactionsRef = collection(db, `users/${userId}/transactions`);
        const linkedQuery = query(transactionsRef, where('linkedTransactionId', '==', transactionId), limit(1));
        const linkedSnap = await getDocs(linkedQuery);
        const hasLinkedRepayments = !linkedSnap.empty;

        if (hasLinkedRepayments) {
          const paidAmount = Number(oldDecrypted.paidAmount || 0);
          const proposedAmount = rest.amount !== undefined ? Number(rest.amount) : oldAmount;
          const proposedType = rest.type || oldType;

          if (proposedType !== oldType) {
            throw new Error('Cannot change transaction type for a loan/credit that has repayments. Remove linked repayments first.');
          }

          if (proposedAmount < paidAmount) {
            throw new Error('Cannot reduce loan/credit amount below already paid amount. Adjust or remove repayments first.');
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('Cannot change transaction type') || err.message.includes('Cannot reduce loan/credit amount'))) {
          throw err;
        }
      }
    }

    // Prepare updates with normalized date and timestamp
    const updatesWithTimestamp = {
      ...rest,
      updatedAt: Timestamp.now()
    };

    if (rest.date) {
      updatesWithTimestamp.date = normalizeDateToTimestamp(rest.date);
    }

    // Compute new values
    const newAmount = rest.amount !== undefined ? Number(rest.amount) : oldAmount;

    // Encrypt the updates
    const encryptedUpdates = await encryptTransactionData({ ...updatesWithTimestamp, amount: newAmount });

    // Read and update user profile
    const userRef = doc(db, 'users', userId);
    const userDocSnapshot = await getDoc(userRef);
    if (!userDocSnapshot.exists()) {
      throw new Error('User not found');
    }

    const updatedProfilePlain = {
      updatedAt: Timestamp.now()
    };

    const encryptedUpdatedProfile = await encryptUserProfile(updatedProfilePlain);

    // Apply both transaction update and profile update atomically
    await runTransaction(db, async (tx) => {
      // If updating a repayment, update linked loan/credit's paidAmount
      const isRepaymentTx = oldDecrypted.isRepayment || rest.isRepayment;
      const linkedId = oldDecrypted.linkedTransactionId || rest.linkedTransactionId;

      if (isRepaymentTx && linkedId) {
        try {
          const linkedRef = doc(db, `users/${userId}/transactions/${linkedId}`);
          const linkedSnap = await tx.get(linkedRef);
          if (linkedSnap.exists()) {
            const [linkedDecrypted] = await decryptTransactions([{ id: linkedSnap.id, ...linkedSnap.data() }]);
            const deltaPaid = newAmount - oldAmount;
            const updatedPaid = calculateUpdatedPaidAmount(linkedDecrypted.paidAmount || 0, deltaPaid);
            const updatedLinked = {
              ...linkedDecrypted,
              paidAmount: updatedPaid,
              isFullyPaid: isFullyPaid(linkedDecrypted.amount, updatedPaid),
              lastPaymentDate: deltaPaid !== 0 ? Timestamp.now() : linkedDecrypted.lastPaymentDate,
              updatedAt: Timestamp.now()
            };
            const encryptedLinked = await encryptTransactionData(updatedLinked);
            tx.update(linkedRef, encryptedLinked);
          }
        } catch (err) {
          console.warn('Failed to update linked loan/credit during transaction edit:', err?.message || err);
        }
      }

      tx.update(transactionRef, encryptedUpdates);
      tx.update(userRef, encryptedUpdatedProfile);
    });

    // Emit event for UI refresh
    const event = new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, { detail: { transactionId, updates: rest } });
    window.dispatchEvent(event);

    return { success: true };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message };
  }
};

// (previous helper removed — update logic now applies computed deltas directly)

/**
 * Export combined user data (profile + all transactions) as a JS object.
 */
export const exportUserData = async (userId) => {
  try {
    const profileRes = await getUserProfile(userId);
    const txRes = await getTransactions(userId);

    if (!profileRes.success) throw new Error(profileRes.error || 'Failed to fetch profile');
    if (!txRes.success) throw new Error(txRes.error || 'Failed to fetch transactions');

    // Prepare a JSON-friendly export: convert Date objects to ISO strings and compute an export fingerprint
    const sanitizedProfile = { ...profileRes.data };
    // Convert Timestamp-like fields to ISO strings if necessary
    if (sanitizedProfile.updatedAt && sanitizedProfile.updatedAt.toDate) {
      sanitizedProfile.updatedAt = sanitizedProfile.updatedAt.toDate().toISOString();
    } else if (sanitizedProfile.updatedAt instanceof Date) {
      sanitizedProfile.updatedAt = sanitizedProfile.updatedAt.toISOString();
    }

    const transactions = txRes.data || [];
    const sanitizedTransactions = [];
    for (const tx of transactions) {
      const exportTx = {
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        date: tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : String(tx.date || ''),
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : String(tx.createdAt || ''),
        updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : (tx.updatedAt ? String(tx.updatedAt) : undefined),
        originalId: tx.originalId || undefined,
        importFingerprint: tx.importFingerprint || undefined,
        source: tx.source || undefined,
        paidAmount: tx.paidAmount || undefined,
        isFullyPaid: tx.isFullyPaid || undefined,
        linkedTransactionId: tx.linkedTransactionId || undefined,
        // include any extra metadata fields the app may use
        notes: tx.notes || tx.note || undefined
      };

      // Compute a deterministic export fingerprint to help imports dedupe even if originalId is missing
      try {
        const fp = await computeTransactionFingerprint(tx);
        if (fp) exportTx.exportFingerprint = fp;
      } catch {
        // ignore fingerprint failures
      }

      sanitizedTransactions.push(exportTx);
    }

    return {
      success: true,
      data: {
        profile: sanitizedProfile,
        transactions: sanitizedTransactions
      }
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all transactions for a user and remove the user document.
 * Note: This deletes Firestore documents but does not delete the Firebase Auth user.
 */
export const deleteAllUserData = async (userId) => {
  try {
    // Fetch all transactions
    const txRes = await getTransactions(userId);
    if (!txRes.success) throw new Error(txRes.error || 'Failed to fetch transactions');

    // Delete each transaction document
    for (const tx of txRes.data) {
      try {
        const txRef = doc(db, `users/${userId}/transactions/${tx.id}`);
        await deleteDoc(txRef);
      } catch (e) {
        console.warn('Failed to delete transaction', tx.id, e?.message);
      }
    }

    // After removing all transaction documents, reconcile user totals to zero
    try {
      const recon = await reconcileUserTotals(userId);
      if (!recon.success) {
        console.warn('Reconciliation after deleteAllUserData failed:', recon.error);
      }
    } catch (e) {
      console.warn('Error running reconciliation after deleteAllUserData:', e?.message || e);
    }

    // Also erase salary manager plan
    try {
      await deleteSalaryPlan(userId);
    } catch (e) {
      console.warn('Failed to delete salary plan during mass erasure:', e?.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting all user data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Recalculate user totals from transactions and update the user profile document.
 * Returns { success: true, totals: { balance, totalIncome, totalExpense, totalCreditGiven, totalLoanTaken } }
 */
export const reconcileUserTotals = async (userId) => {
  try {
    const txRes = await getTransactions(userId);
    if (!txRes.success) throw new Error(txRes.error || 'Failed to fetch transactions for reconciliation');

    const transactions = txRes.data || [];
    let totalIncome = 0;
    let totalExpense = 0;
    let totalCreditGiven = 0;
    let totalLoanTaken = 0;

    transactions.forEach(tx => {
      // Skip repayment/collection transactions - they only affect balance, not totals
      if (tx.type === 'repayment' || tx.type === 'collection') return;

      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') totalIncome += amt;
      else if (tx.type === 'expense') totalExpense += amt;
      else if (tx.type === 'credit') totalCreditGiven += amt;
      else if (tx.type === 'loan') totalLoanTaken += amt;
    });

    const balance = totalIncome - totalExpense - totalCreditGiven + totalLoanTaken;

    // Encrypt the updated totals before storing
    const updatedTotals = {
      balance,
      totalIncome,
      totalExpense,
      totalCreditGiven,
      totalLoanTaken,
      updatedAt: Timestamp.now()
    };

    const encryptedTotals = await encryptUserProfile(updatedTotals);
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, encryptedTotals);

    return { success: true, totals: { balance, totalIncome, totalExpense, totalCreditGiven, totalLoanTaken } };
  } catch (error) {
    console.error('Error reconciling totals:', error);
    return { success: false, error: error.message };
  }
};
/**
 * Import user data from a Vault Export payload.
 */
export const importUserData = async (userId, payload, options = {}) => {
  const { transactions = [] } = payload;
  const { dedupe = true } = options;

  let importedCount = 0;
  let skippedCount = 0;

  try {
    let existingFingerprints = new Set();
    if (dedupe) {
      const currentTxRes = await getTransactions(userId);
      if (currentTxRes.success) {
        existingFingerprints = new Set(
          currentTxRes.data
            .map(tx => tx.importFingerprint || tx.exportFingerprint)
            .filter(Boolean)
        );
      }
    }

    const transactionsRef = collection(db, `users/${userId}/transactions`);

    for (const txData of transactions) {
      const currentFingerprint = txData.importFingerprint || txData.exportFingerprint || await computeTransactionFingerprint(txData);

      if (dedupe && currentFingerprint && existingFingerprints.has(currentFingerprint)) {
        skippedCount++;
        continue;
      }

      const transactionToStore = {
        ...txData,
        userId,
        createdAt: txData.createdAt ? Timestamp.fromDate(new Date(txData.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        date: normalizeDateToTimestamp(txData.date),
        importFingerprint: currentFingerprint,
        source: txData.source || 'import'
      };

      if (!options.preserveIds) {
        delete transactionToStore.id;
      }

      const encryptedTransaction = await encryptTransactionData(transactionToStore);
      await addDoc(transactionsRef, encryptedTransaction);
      importedCount++;
    }

    await reconcileUserTotals(userId);

    return {
      success: true,
      imported: importedCount,
      total: transactions.length,
      skipped: skippedCount
    };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
};
