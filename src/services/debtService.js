import { db } from '../config/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import {
  decryptTransactions,
  encryptTransactionData,
  encryptUserProfile,
  decryptUserProfile
} from '../utils/encryption';
import {
  calculateUpdatedPaidAmount,
  isFullyPaid,
  normalizeLoanCreditNumbers,
  validateRepaymentAmount,
  computeTransactionEffects,
  applyEffectsToTotals,
  validateTotalsNotNegative
} from '../utils/transactionHelpers';
import { addTransaction } from './transactionService';
import { APP_EVENTS } from '../config/constants';

/**
 * Get outstanding (unpaid) loans for a user
 */
export const getOutstandingLoans = async (userId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    // Note: We fetch all and filter locally because 'type' is encrypted
    const q = query(transactionsRef);
    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const transactions = await decryptTransactions(encryptedTransactions);
    
    // Only include loans that are not fully repaid
    const outstanding = transactions
      .filter(tx => tx.type === 'loan' && !tx.isFullyPaid)
      .map(loan => normalizeLoanCreditNumbers(loan));

    return { success: true, data: outstanding };
  } catch (error) {
    console.error('Error getting outstanding loans:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get outstanding (unpaid) credits for a user
 */
export const getOutstandingCredits = async (userId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(transactionsRef);
    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const transactions = await decryptTransactions(encryptedTransactions);

    // Only include credits that are not fully collected
    const outstanding = transactions
      .filter(tx => tx.type === 'credit' && !tx.isFullyPaid)
      .map(credit => normalizeLoanCreditNumbers(credit));

    return { success: true, data: outstanding };
  } catch (error) {
    console.error('Error getting outstanding credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all loans (including fully paid)
 */
export const getAllLoans = async (userId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(transactionsRef);
    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const transactions = await decryptTransactions(encryptedTransactions);
    const loans = transactions
      .filter(tx => tx.type === 'loan')
      .map(loan => normalizeLoanCreditNumbers(loan));

    return { success: true, data: loans };
  } catch (error) {
    console.error('Error getting all loans:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all credits (including fully paid)
 */
export const getAllCredits = async (userId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(transactionsRef);
    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const transactions = await decryptTransactions(encryptedTransactions);
    const credits = transactions
      .filter(tx => tx.type === 'credit')
      .map(credit => normalizeLoanCreditNumbers(credit));

    return { success: true, data: credits };
  } catch (error) {
    console.error('Error getting all credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark a loan as (partially) repaid
 */
export const markLoanAsRepaid = async (userId, loanId, repaymentAmount, description = '') => {
  try {
    const loanRef = doc(db, `users/${userId}/transactions`, loanId);
    const loanDoc = await getDoc(loanRef);

    if (!loanDoc.exists()) throw new Error('Loan transaction not found');

    const decryptedLoan = (await decryptTransactions([{ id: loanId, ...loanDoc.data() }]))[0];
    const currentPaidAmount = Number(decryptedLoan.paidAmount || 0);
    const totalAmount = Number(decryptedLoan.amount);
    const remainingAmount = totalAmount - currentPaidAmount;

    validateRepaymentAmount(repaymentAmount, remainingAmount);
    const numRepaymentAmount = Number(repaymentAmount);

    const repaymentTransaction = {
      type: 'repayment',
      isRepayment: true,
      amount: numRepaymentAmount,
      description: description || `Loan repayment - ${decryptedLoan.description}`,
      category: decryptedLoan.category || 'loan',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: loanId,
      originalAmount: totalAmount,
      originalDescription: decryptedLoan.description || ''
    };

    const result = await addTransaction(userId, repaymentTransaction);

    if (result.success) {
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
 * Mark a credit as (partially) collected
 */
export const markCreditAsCollected = async (userId, creditId, collectionAmount, description = '') => {
  try {
    const creditRef = doc(db, `users/${userId}/transactions`, creditId);
    const creditDoc = await getDoc(creditRef);

    if (!creditDoc.exists()) throw new Error('Credit transaction not found');

    const decryptedCredit = (await decryptTransactions([{ id: creditId, ...creditDoc.data() }]))[0];
    const currentPaidAmount = Number(decryptedCredit.paidAmount || 0);
    const totalAmount = Number(decryptedCredit.amount);
    const remainingAmount = totalAmount - currentPaidAmount;

    validateRepaymentAmount(collectionAmount, remainingAmount);
    const numCollectionAmount = Number(collectionAmount);

    const collectionTransaction = {
      type: 'collection',
      isRepayment: true,
      amount: numCollectionAmount,
      description: description || `Credit collected - ${decryptedCredit.description}`,
      category: decryptedCredit.category || 'credit',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: creditId,
      originalAmount: totalAmount,
      originalDescription: decryptedCredit.description || ''
    };

    const result = await addTransaction(userId, collectionTransaction);

    if (result.success) {
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
 * Count linked repayments for a transaction
 */
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
 * Adjust loan/credit amount with history tracking
 */
export const adjustLoanCreditAmount = async (userId, transactionId, adjustmentAmount, reason = '') => {
  try {
    const txRef = doc(db, `users/${userId}/transactions`, transactionId);
    const txDoc = await getDoc(txRef);

    if (!txDoc.exists()) throw new Error('Transaction not found');

    const decryptedTx = (await decryptTransactions([{ id: transactionId, ...txDoc.data() }]))[0];
    if (!['loan', 'credit'].includes(decryptedTx.type)) {
      throw new Error('Only loan and credit transactions can be adjusted');
    }

    const numAdjustment = Number(adjustmentAmount);
    const currentAmount = Number(decryptedTx.amount || 0);
    const newAmount = currentAmount + numAdjustment;

    if (newAmount <= 0) throw new Error('Adjusted amount must be greater than zero');

    const paidAmount = Number(decryptedTx.paidAmount || 0);
    const adjustmentEntry = {
      amount: numAdjustment,
      reason: reason || (numAdjustment > 0 ? 'Amount increased' : 'Amount decreased'),
      date: new Date().toISOString(),
      timestamp: Timestamp.now(),
      previousAmount: currentAmount,
      newAmount: newAmount
    };

    const adjustmentHistory = decryptedTx.adjustmentHistory || [];
    adjustmentHistory.push(adjustmentEntry);

    const updatedTxData = {
      ...decryptedTx,
      amount: newAmount,
      remainingAmount: Math.max(0, newAmount - paidAmount),
      adjustmentHistory,
      isFullyPaid: isFullyPaid(newAmount, paidAmount),
      updatedAt: Timestamp.now()
    };

    const encryptedTx = await encryptTransactionData(updatedTxData);
    await updateDoc(txRef, encryptedTx);

    // Update user's totals
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = await decryptUserProfile(userDoc.data());
      const currentTotals = {
        balance: Number(userData.balance) || 0,
        totalIncome: Number(userData.totalIncome) || 0,
        totalExpense: Number(userData.totalExpense) || 0,
        totalCreditGiven: Number(userData.totalCreditGiven) || 0,
        totalLoanTaken: Number(userData.totalLoanTaken) || 0
      };

      const effects = computeTransactionEffects({ type: decryptedTx.type, amount: numAdjustment });
      const updatedTotals = applyEffectsToTotals(currentTotals, effects);
      validateTotalsNotNegative(updatedTotals);

      const encryptedUpdatedData = await encryptUserProfile({ ...updatedTotals, updatedAt: Timestamp.now() });
      await updateDoc(userRef, encryptedUpdatedData);
    }

    window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, {
      detail: { transactionId, type: decryptedTx.type, adjustment: numAdjustment }
    }));

    return { success: true, newAmount, adjustment: adjustmentEntry };
  } catch (error) {
    console.error('Error adjusting loan/credit amount:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset all payments for a loan/credit
 */
export const resetLoanCreditPayments = async (userId, transactionId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const linkedQuery = query(transactionsRef, where('linkedTransactionId', '==', transactionId));
    const linkedSnap = await getDocs(linkedQuery);
    
    const originalRef = doc(db, `users/${userId}/transactions/${transactionId}`);
    const originalSnap = await getDoc(originalRef);
    
    if (!originalSnap.exists()) throw new Error('Original transaction not found');
    const [originalDecrypted] = await decryptTransactions([{ id: originalSnap.id, ...originalSnap.data() }]);

    await runTransaction(db, async (tx) => {
      linkedSnap.docs.forEach(d => tx.delete(d.ref));
      const encryptedOriginal = await encryptTransactionData({
        ...originalDecrypted,
        paidAmount: 0,
        isFullyPaid: false,
        lastPaymentDate: null,
        updatedAt: Timestamp.now()
      });
      tx.update(originalRef, encryptedOriginal);
    });

    window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_EDITED, { 
      detail: { transactionId, updates: { paidAmount: 0, isFullyPaid: false } } 
    }));
    window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED));

    return { success: true };
  } catch (error) {
    console.error('Error resetting loan/credit:', error);
    return { success: false, error: error.message };
  }
};
