import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  setDoc,
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
  decryptUserProfile,
  encryptData
} from '../utils/encryption';
import {
  normalizeDateToTimestamp,
  computeTransactionFingerprint,
  computeTransactionEffects,
  validateTransaction,
  validateTotalsNotNegative,
  validateRepaymentAmount,
  calculateUpdatedPaidAmount,
  isFullyPaid,
  applyEffectsToTotals,
  normalizeLoanCreditNumbers
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

// New repayment functions
export const getOutstandingLoans = async (userId) => {
  try {
    const res = await getTransactions(userId, { type: 'loan' });
    if (!res.success) return res;

    // Only include loans that are not fully repaid
    const outstanding = res.data.filter(loan => !loan.isFullyPaid)
      .map(loan => normalizeLoanCreditNumbers(loan));

    return { success: true, data: outstanding };
  } catch (error) {
    console.error('Error getting outstanding loans:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get outstanding (unpaid) credits for a user
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Object>} Success/error result with outstanding credits
 */
export const getOutstandingCredits = async (userId) => {
  try {
    const res = await getTransactions(userId, { type: 'credit' });
    if (!res.success) return res;

    // Only include credits that are not fully collected
    const outstanding = res.data.filter(credit => !credit.isFullyPaid)
      .map(credit => normalizeLoanCreditNumbers(credit));

    return { success: true, data: outstanding };
  } catch (error) {
    console.error('Error getting outstanding credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all loans (including fully paid) for comprehensive view
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Object>} Success/error result with all loans
 */
export const getAllLoans = async (userId) => {
  try {
    const res = await getTransactions(userId, { type: 'loan' });
    if (!res.success) return res;

    const loans = res.data.map(loan => normalizeLoanCreditNumbers(loan));
    return { success: true, data: loans };
  } catch (error) {
    console.error('Error getting all loans:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all credits (including fully paid) for comprehensive view
 * @param {string} userId - User's unique identifier
 * @returns {Promise<Object>} Success/error result with all credits
 */
export const getAllCredits = async (userId) => {
  try {
    const res = await getTransactions(userId, { type: 'credit' });
    if (!res.success) return res;

    const credits = res.data.map(credit => normalizeLoanCreditNumbers(credit));
    return { success: true, data: credits };
  } catch (error) {
    console.error('Error getting all credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a loan as (partially) repaid by creating a repayment transaction
 * @param {string} userId - User's unique identifier
 * @param {string} loanId - ID of the loan transaction
 * @param {number} repaymentAmount - Amount being repaid
 * @param {string} [description] - Optional description for the repayment
 * @returns {Promise<Object>} Success/error result with repayment transaction ID
 */
export const markLoanAsRepaid = async (userId, loanId, repaymentAmount, description = '') => {
  try {
    // Get the original loan transaction
    const loanRef = doc(db, `users/${userId}/transactions`, loanId);
    const loanDoc = await getDoc(loanRef);

    if (!loanDoc.exists()) {
      throw new Error('Loan transaction not found');
    }

    const loanData = loanDoc.data();
    const decryptedLoan = (await decryptTransactions([{ id: loanId, ...loanData }]))[0];

    // Validate repayment amount
    const currentPaidAmount = Number(decryptedLoan.paidAmount || 0);
    const totalAmount = Number(decryptedLoan.amount);
    const remainingAmount = totalAmount - currentPaidAmount;

    validateRepaymentAmount(repaymentAmount, remainingAmount);

    const numRepaymentAmount = Number(repaymentAmount);

    // Create repayment transaction with type='repayment'
    const repaymentTransaction = {
      type: 'repayment',
      // mark as repayment so delete/update logic can detect linked adjustments
      isRepayment: true,
      amount: numRepaymentAmount,
      description: description || `Loan repayment - ${decryptedLoan.description}`,
      category: decryptedLoan.category || 'loan',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: loanId,
      originalAmount: Number(decryptedLoan.amount || 0),
      originalDescription: decryptedLoan.description || ''
    };

    const result = await addTransaction(userId, repaymentTransaction);

    if (result.success) {
      // Update original loan with payment info
      const newPaidAmount = calculateUpdatedPaidAmount(currentPaidAmount, numRepaymentAmount);
      const updatedLoanData = {
        ...decryptedLoan,
        paidAmount: newPaidAmount,
        isFullyPaid: isFullyPaid(totalAmount, newPaidAmount),
        lastPaymentDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const encryptedLoan = await encryptTransactionData(updatedLoanData);
      await updateDoc(loanRef, encryptedLoan);

      return {
        success: true,
        repaymentTransactionId: result.id,
        remainingAmount: totalAmount - newPaidAmount
      };
    }

    return result;
  } catch (error) {
    console.error('Error marking loan as repaid:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a credit as (partially) collected by creating a collection transaction
 * @param {string} userId - User's unique identifier
 * @param {string} creditId - ID of the credit transaction
 * @param {number} collectionAmount - Amount being collected
 * @param {string} [description] - Optional description for the collection
 * @returns {Promise<Object>} Success/error result
 */
export const markCreditAsCollected = async (userId, creditId, collectionAmount, description = '') => {
  try {
    // Get the original credit transaction
    const creditRef = doc(db, `users/${userId}/transactions`, creditId);
    const creditDoc = await getDoc(creditRef);

    if (!creditDoc.exists()) {
      throw new Error('Credit transaction not found');
    }

    const creditData = creditDoc.data();
    const decryptedCredit = (await decryptTransactions([{ id: creditId, ...creditData }]))[0];

    // Validate collection amount
    const currentPaidAmount = Number(decryptedCredit.paidAmount || 0);
    const totalAmount = Number(decryptedCredit.amount);
    const remainingAmount = totalAmount - currentPaidAmount;

    validateRepaymentAmount(collectionAmount, remainingAmount);

    const numCollectionAmount = Number(collectionAmount);

    // Create collection transaction with type='collection'
    const collectionTransaction = {
      type: 'collection',
      // mark as repayment/adjustment so delete logic can treat it accordingly
      isRepayment: true,
      amount: numCollectionAmount,
      description: description || `Credit collected - ${decryptedCredit.description}`,
      category: decryptedCredit.category || 'credit',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: creditId,
      originalAmount: Number(decryptedCredit.amount || 0),
      originalDescription: decryptedCredit.description || ''
    };

    const result = await addTransaction(userId, collectionTransaction);

    if (result.success) {
      // Update original credit with payment info
      const newPaidAmount = calculateUpdatedPaidAmount(currentPaidAmount, numCollectionAmount);
      const updatedCreditData = {
        ...decryptedCredit,
        paidAmount: newPaidAmount,
        isFullyPaid: isFullyPaid(totalAmount, newPaidAmount),
        lastPaymentDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const encryptedCredit = await encryptTransactionData(updatedCreditData);
      await updateDoc(creditRef, encryptedCredit);
    }

    return result;
  } catch (error) {
    console.error('Error marking credit as collected:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import user data previously exported by exportUserData.
 * Expects `data` to have shape: { profile: {...}, transactions: [...] }
 * This function will write transactions back into `users/{userId}/transactions`
 * and replace the user profile document fields present in the exported profile.
 * NOTE: This intentionally writes the transactions as-is (encrypted) and writes profile totals
 * to avoid double-applying balance updates. Use with caution.
 */
export const importUserData = async (userId, data, options = { preserveIds: false, dedupe: true }) => {
  try {
    if (!data) throw new Error('No data provided');
    const { profile, transactions } = data;

    // Validate transactions array
    if (!Array.isArray(transactions)) {
      throw new Error('Invalid transactions payload');
    }

    const transactionsRef = collection(db, `users/${userId}/transactions`);

    const importTag = `import-${new Date().toISOString()}`;

    const result = {
      success: true,
      total: transactions.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      overwritten: [],
      createdIds: []
    };

    // Simple schema validation helper
    const validTypes = ['income', 'expense', 'credit', 'loan'];
    const isValidTx = (tx) => {
      if (!tx) return false;
      if (!tx.type || !validTypes.includes(tx.type)) return false;
      const num = Number(tx.amount);
      if (isNaN(num) || num <= 0) return false;
      if (!tx.date) return false;
      return true;
    };

    // Helper: compute a deterministic fingerprint for a transaction
    const normalizeString = (s) => (String(s || '')).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    const computeFingerprint = async (t) => {
      try {
        const type = String(t.type || '').toLowerCase();
        const amount = Number(t.amount || 0);
        const date = (t.date && typeof t.date === 'string') ? t.date : (t.date && t.date.toDate ? t.date.toDate().toISOString().split('T')[0] : '');
        const desc = normalizeString(t.description || t.desc || t.note || '');
        const src = `${type}|${amount}|${date}|${desc}`;
        const enc = new TextEncoder().encode(src);
        const hash = await (crypto.subtle || window.crypto.subtle).digest('SHA-256', enc);
        // convert to hex
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        return null;
      }
    };

    for (const tx of transactions) {
      try {
        // Validate transaction schema
        if (!isValidTx(tx)) {
          result.skipped += 1;
          result.errors.push({ id: tx?.id || null, error: 'Invalid transaction schema' });
          continue;
        }

        const originalId = tx.id || tx.originalId || null;

        // Compute fingerprint
        const fingerprint = await computeFingerprint(tx);

        // Check for existing doc by originalId first, then by fingerprint
        let existingDoc = null;
        if (originalId) {
          const q = query(transactionsRef, where('originalId', '==', originalId), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) existingDoc = snap.docs[0];
        }

        if (!existingDoc && fingerprint) {
          const q2 = query(transactionsRef, where('importFingerprint', '==', fingerprint), limit(1));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) existingDoc = snap2.docs[0];
        }

        // Prepare tx to store and preserve timestamps
        // IMPORTANT: strip any originalMessage fields to avoid resurrecting user messages
        // that were intentionally removed for privacy.
        const sanitizedTx = { ...tx };
        if ('originalMessage' in sanitizedTx) delete sanitizedTx.originalMessage;
        if ('originalMessage_encrypted' in sanitizedTx) delete sanitizedTx.originalMessage_encrypted;

        const txToStore = {
          ...sanitizedTx,
          userId,
          originalId: originalId || undefined,
          importFingerprint: fingerprint || undefined,
          source: importTag,
          createdAt: tx.createdAt ? Timestamp.fromDate(new Date(tx.createdAt)) : Timestamp.now(),
          date: tx.date ? Timestamp.fromDate(new Date(tx.date)) : Timestamp.now(),
          updatedAt: tx.updatedAt ? Timestamp.fromDate(new Date(tx.updatedAt)) : undefined
        };

        // Remove id field so we don't accidentally try to write it into the document body
        delete txToStore.id;

        const encrypted = await encryptTransactionData(txToStore);

        if (existingDoc) {
          // There is an existing document that matches originalId or fingerprint
          const existingId = existingDoc.id;
          if (options.preserveIds && originalId) {
            // User requested to preserve original IDs. If the existing doc has a different id,
            // write the data to the originalId path and remove the old conflicting doc to avoid duplicates.
            const targetRef = doc(db, `users/${userId}/transactions`, originalId);
            await setDoc(targetRef, encrypted);
            result.overwritten.push(originalId);
            // If existing doc had a different id, remove it
            if (existingId !== originalId) {
              try {
                const oldRef = doc(db, `users/${userId}/transactions`, existingId);
                await deleteDoc(oldRef);
              } catch (deleteErr) {
                // non-fatal: if delete fails, continue but report
                result.errors.push({ id: existingId, error: 'Failed to delete duplicate doc after overwrite: ' + (deleteErr?.message || String(deleteErr)) });
              }
            }
          } else if (options.dedupe) {
            // Skip importing duplicate
            result.skipped += 1;
          } else {
            // Not preserving ids and not deduping: update the existing doc with new data
            const existingRef = doc(db, `users/${userId}/transactions`, existingId);
            await setDoc(existingRef, encrypted, { merge: true });
            result.overwritten.push(existingId);
          }
        } else {
          // No existing doc found
          if (options.preserveIds && originalId) {
            const targetRef = doc(db, `users/${userId}/transactions`, originalId);
            await setDoc(targetRef, encrypted);
            result.createdIds.push(originalId);
          } else {
            const newRef = await addDoc(transactionsRef, encrypted);
            result.createdIds.push(newRef.id);
          }
          result.imported += 1;
        }
      } catch (e) {
        result.failed += 1;
        result.errors.push({ id: tx?.id || null, error: e?.message });
      }
    }
    // Replace user profile fields from exported profile (only specific safe fields)
    if (profile && typeof profile === 'object') {
      const userRef = doc(db, 'users', userId);
      const updatable = {
        displayName: profile.displayName,
        email: profile.email,
        totalCreditGiven: Number(profile.totalCreditGiven) || 0,
        totalLoanTaken: Number(profile.totalLoanTaken) || 0,
        language: profile.language,
        theme: profile.theme,
        notifications: profile.notifications,
        budgetAlerts: profile.budgetAlerts,
        updatedAt: Timestamp.now()
      };

      // Handle salary plan restoration
      if (profile.salaryPlan) {
        try {
          const encryptedSalary = await encryptData(JSON.stringify(profile.salaryPlan));
          updatable.salaryPlan_encrypted = encryptedSalary;
        } catch (e) {
          console.warn("Failed to re-encrypt salary plan during import", e);
        }
      }

      // Ensure updatable is fully encrypted before saving
      const encryptedProfile = await encryptUserProfile(updatable);

      // Remove undefined keys so setDoc doesn't set them (though encryptUserProfile should have handled it)
      Object.keys(encryptedProfile).forEach(k => encryptedProfile[k] === undefined && delete encryptedProfile[k]);

      await setDoc(userRef, encryptedProfile, { merge: true });
    }

    // Attach importSourceTag to result so caller can undo later if needed
    result.importSourceTag = importTag;

    // If the account already had transactions before import, run a reconciliation to ensure totals are accurate
    try {
      const existingCheck = await getTransactions(userId, { limit: 1 });
      if (existingCheck.success && existingCheck.data && existingCheck.data.length > 0) {
        // run reconciliation
        const recon = await reconcileUserTotals(userId);
        result.reconciled = !!recon.success;
        result.totals = recon.totals || null;
      }
    } catch (e) {
      console.warn('Reconciliation after import failed:', e?.message);
      result.reconciled = false;
      result.reconciliationError = e?.message;
    }

    return result;
  } catch (error) {
    console.error('Error importing user data:', error);
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

// Count how many repayment/collection transactions link to a given original transaction
export const countLinkedRepayments = async (userId, originalTransactionId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(transactionsRef, where('linkedTransactionId', '==', originalTransactionId));
    const snap = await getDocs(q);
    return { success: true, count: snap.size };
  } catch (error) {
    console.error('Error counting linked repayments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Adjust the amount of a loan or credit transaction
 * @param {string} userId - User's unique identifier
 * @param {string} transactionId - ID of the loan/credit transaction
 * @param {number} adjustmentAmount - Amount to adjust (positive to increase, negative to decrease)
 * @param {string} [reason] - Optional reason for adjustment
 * @returns {Promise<Object>} Success/error result
 */
export const adjustLoanCreditAmount = async (userId, transactionId, adjustmentAmount, reason = '') => {
  try {
    // Get the original transaction
    const txRef = doc(db, `users/${userId}/transactions`, transactionId);
    const txDoc = await getDoc(txRef);

    if (!txDoc.exists()) {
      throw new Error('Transaction not found');
    }

    const txData = txDoc.data();
    const decryptedTx = (await decryptTransactions([{ id: transactionId, ...txData }]))[0];

    // Verify it's a loan or credit
    if (!['loan', 'credit'].includes(decryptedTx.type)) {
      throw new Error('Only loan and credit transactions can be adjusted');
    }

    const numAdjustment = Number(adjustmentAmount);
    if (isNaN(numAdjustment) || numAdjustment === 0) {
      throw new Error('Invalid adjustment amount');
    }

    const currentAmount = Number(decryptedTx.amount || 0);
    const newAmount = currentAmount + numAdjustment;

    if (newAmount <= 0) {
      throw new Error('Adjusted amount must be greater than zero');
    }

    // Calculate new remaining amount
    const paidAmount = Number(decryptedTx.paidAmount || 0);
    const newRemainingAmount = Math.max(0, newAmount - paidAmount);

    // Create adjustment history entry
    const adjustmentEntry = {
      amount: numAdjustment,
      reason: reason || (numAdjustment > 0 ? 'Amount increased' : 'Amount decreased'),
      date: new Date().toISOString(),
      timestamp: Timestamp.now(),
      previousAmount: currentAmount,
      newAmount: newAmount
    };

    // Get existing adjustment history or initialize empty array
    const adjustmentHistory = decryptedTx.adjustmentHistory || [];
    adjustmentHistory.push(adjustmentEntry);

    // Update transaction with new amount and adjustment history
    const updatedTxData = {
      ...decryptedTx,
      amount: newAmount,
      remainingAmount: newRemainingAmount,
      adjustmentHistory: adjustmentHistory,
      isFullyPaid: isFullyPaid(newAmount, paidAmount),
      updatedAt: Timestamp.now()
    };

    const encryptedTx = await encryptTransactionData(updatedTxData);
    await updateDoc(txRef, encryptedTx);

    // Update user's totals - adjustment affects totalLoanTaken or totalCreditGiven
    // Create a virtual transaction representing the adjustment
    const adjustmentTx = {
      type: decryptedTx.type, // 'loan' or 'credit'
      amount: numAdjustment // positive or negative adjustment
    };

    // Compute the effects of this adjustment
    const effects = computeTransactionEffects(adjustmentTx);

    // Get user profile and update totals
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const encryptedUserData = userDoc.data();
      const userData = await decryptUserProfile(encryptedUserData);

      const currentTotals = {
        balance: Number(userData.balance) || 0,
        totalIncome: Number(userData.totalIncome) || 0,
        totalExpense: Number(userData.totalExpense) || 0,
        totalCreditGiven: Number(userData.totalCreditGiven) || 0,
        totalLoanTaken: Number(userData.totalLoanTaken) || 0
      };

      // Apply adjustment effects to totals
      const updatedTotals = applyEffectsToTotals(currentTotals, effects);

      // Validate: prevent negative totals
      validateTotalsNotNegative(updatedTotals);

      // Update user profile
      const updatedUserData = {
        ...updatedTotals,
        updatedAt: Timestamp.now()
      };

      const encryptedUpdatedData = await encryptUserProfile(updatedUserData);
      await updateDoc(userRef, encryptedUpdatedData);
    }

    // Dispatch event to notify UI components
    window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, {
      detail: {
        transactionId: transactionId,
        type: decryptedTx.type,
        adjustment: numAdjustment
      }
    }));

    return {
      success: true,
      newAmount,
      newRemainingAmount,
      adjustment: adjustmentEntry
    };
  } catch (error) {
    console.error('Error adjusting loan/credit amount:', error);
    return { success: false, error: error.message };
  }
};