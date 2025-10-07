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
  decryptUserProfile
} from '../utils/encryption';

// Compute deterministic fingerprint for a transaction (used for export/import dedupe)
const normalizeStringForFingerprint = (s) => (String(s || '')).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const computeTransactionFingerprint = async (t) => {
  try {
    const type = String(t.type || '').toLowerCase();
    const amount = Number(t.amount || 0);
    const date = (t.date && typeof t.date === 'string') ? t.date : (t.date && t.date.toDate ? t.date.toDate().toISOString().split('T')[0] : '');
    const desc = normalizeStringForFingerprint(t.description || t.desc || t.note || '');
    const src = `${type}|${amount}|${date}|${desc}`;
    const enc = new TextEncoder().encode(src);
    const hash = await (crypto.subtle || window.crypto.subtle).digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
};

export const addTransaction = async (userId, transactionData) => {
  try {
    // Validate transaction type
    const validTypes = ['income', 'expense', 'credit', 'loan'];
    if (!validTypes.includes(transactionData.type)) {
      throw new Error(`Invalid transaction type: ${transactionData.type}`);
    }
    
    // Ensure amount is a number
    const amount = Number(transactionData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${transactionData.amount}`);
    }
    
    // Prepare transaction data for encryption with robust date normalization.
    const transactionToStore = {
      ...transactionData,
      amount, // Ensure it's stored as number
      userId,
      createdAt: Timestamp.now(),
      // Normalize date input to a JS Date constructed in local time for
      // YYYY-MM-DD strings to avoid timezone shifts when converting to
      // Firestore Timestamp. Accept Date, numeric ms, Firestore Timestamp-like
      // objects (have toDate), or ISO-like strings.
      date: (function () {
        const d = transactionData.date;
        if (!d) return Timestamp.now();
        // Firestore Timestamp-like
        if (d && typeof d.toDate === 'function') return Timestamp.fromDate(d.toDate());
        // JS Date
        if (d instanceof Date) return Timestamp.fromDate(d);
        // Numeric ms
        if (typeof d === 'number' && Number.isFinite(d)) return Timestamp.fromDate(new Date(d));
        // ISO-like YYYY-MM-DD string -> construct local Date to avoid UTC shift
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          const [y, m, day] = d.split('-').map(n => parseInt(n, 10));
          return Timestamp.fromDate(new Date(y, m - 1, day));
        }
        // Fallback to Date parsing (best-effort)
        return Timestamp.fromDate(new Date(d));
      })(),
      // Include original user message/prompt if provided
      originalMessage: transactionData.originalMessage || transactionData.description,
      source: transactionData.source || 'manual' // Track if created via chat or manual entry
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

    // Update user balance
    await updateUserBalance(userId, transactionData.type, amount);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false, error: error.message };
  }
};

export const updateUserBalance = async (userId, type, amount) => {
  try {
    // Validate inputs
    const validTypes = ['income', 'expense', 'credit', 'loan'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`);
    }
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Decrypt user data first
      const encryptedUserData = userDoc.data();
      const userData = await decryptUserProfile(encryptedUserData);
      
      const currentBalance = Number(userData.balance) || 0;
      const totalIncome = Number(userData.totalIncome) || 0;
      const totalExpense = Number(userData.totalExpense) || 0;
      const totalCreditGiven = Number(userData.totalCreditGiven) || 0;
      const totalLoanTaken = Number(userData.totalLoanTaken) || 0;
      
      // Calculate new values based on transaction type
      let newBalance = currentBalance;
      let newTotalIncome = totalIncome;
      let newTotalExpense = totalExpense;
      let newTotalCreditGiven = totalCreditGiven;
      let newTotalLoanTaken = totalLoanTaken;

      switch (type) {
        case 'income':
          // Money comes in: increase balance and totalIncome
          newBalance = currentBalance + numAmount;
          newTotalIncome = totalIncome + numAmount;
          break;
        case 'expense':
          // Money goes out: decrease balance and increase totalExpense
          newBalance = currentBalance - numAmount;
          newTotalExpense = totalExpense + numAmount;
          break;
        case 'credit':
          // User gave credit/loan to someone else: money goes out, track credit given
          newBalance = currentBalance - numAmount;
          newTotalCreditGiven = totalCreditGiven + numAmount;
          break;
        case 'loan':
          // User took loan/credit: money comes in, track loan taken
          newBalance = currentBalance + numAmount;
          newTotalLoanTaken = totalLoanTaken + numAmount;
          break;
      }
      
      // Encrypt updated data before storing
      const updatedData = {
        balance: newBalance,
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        totalCreditGiven: newTotalCreditGiven,
        totalLoanTaken: newTotalLoanTaken,
        updatedAt: Timestamp.now()
      };
      
      const encryptedUpdatedData = await encryptUserProfile(updatedData);
      await updateDoc(userRef, encryptedUpdatedData);
      
      return { success: true };
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error updating balance:", error);
    return { success: false, error: error.message };
  }
};

export const getTransactions = async (userId, filters = {}) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    let q = query(transactionsRef, orderBy('createdAt', 'desc'));
    
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    const encryptedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt?.toDate() || doc.data().createdAt.toDate() // fallback to createdAt if updatedAt doesn't exist
    }));
    
    // Decrypt the transactions
    const transactions = await decryptTransactions(encryptedTransactions);
    
    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error getting transactions:", error);
    return { success: false, error: error.message };
  }
};

export const getRecentTransactions = async (userId, limitCount = 10) => {
  return getTransactions(userId, { limit: limitCount });
};

export const deleteTransaction = async (userId, transactionId, transactionData) => {
  try {
    const transactionRef = doc(db, `users/${userId}/transactions/${transactionId}`);
    const userRef = doc(db, 'users', userId);

    // Holder so we can emit a reliable event after the transaction commits
    let deletedTransactionInfo = null;

    await runTransaction(db, async (tx) => {
      // Read transaction inside the transaction to ensure consistency
      const txSnap = await tx.get(transactionRef);
      if (!txSnap.exists()) {
        throw new Error('Transaction not found');
      }

      // Decrypt the transaction to discover its true amount and type
      const encryptedTx = { id: txSnap.id, ...txSnap.data() };
      const [decryptedTx] = await decryptTransactions([encryptedTx]);

      const transactionAmount = Number((transactionData && transactionData.amount) ?? decryptedTx.amount) || 0;
      const transactionType = (transactionData && transactionData.type) ?? decryptedTx.type;

      // Read user profile inside transaction
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const encryptedUserData = userSnap.data();
      const userData = await decryptUserProfile(encryptedUserData);

      const currentBalance = Number(userData.balance) || 0;
      const totalIncome = Number(userData.totalIncome) || 0;
      const totalExpense = Number(userData.totalExpense) || 0;
      const totalCreditGiven = Number(userData.totalCreditGiven) || 0;
      const totalLoanTaken = Number(userData.totalLoanTaken) || 0;

      // Reverse the transaction effect
      let newBalance = currentBalance;
      let newTotalIncome = totalIncome;
      let newTotalExpense = totalExpense;
      let newTotalCreditGiven = totalCreditGiven;
      let newTotalLoanTaken = totalLoanTaken;

      if (transactionType === 'income') {
        newBalance = currentBalance - transactionAmount;
        newTotalIncome = totalIncome - transactionAmount;
      } else if (transactionType === 'expense') {
        newBalance = currentBalance + transactionAmount;
        newTotalExpense = totalExpense - transactionAmount;
      } else if (transactionType === 'credit') {
        newBalance = currentBalance + transactionAmount;
        newTotalCreditGiven = totalCreditGiven - transactionAmount;
      } else if (transactionType === 'loan') {
        newBalance = currentBalance - transactionAmount;
        newTotalLoanTaken = totalLoanTaken - transactionAmount;
      }

      const updatedData = {
        balance: newBalance,
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        totalCreditGiven: newTotalCreditGiven,
        totalLoanTaken: newTotalLoanTaken,
        updatedAt: Timestamp.now()
      };

      const encryptedUpdatedData = await encryptUserProfile(updatedData);

      // Schedule delete and update inside the same transaction
      tx.delete(transactionRef);
      tx.update(userRef, encryptedUpdatedData);

      deletedTransactionInfo = {
        transactionId,
        transactionData: transactionData || decryptedTx,
        isRepayment: (transactionData && transactionData.isRepayment) || decryptedTx.isRepayment || false
      };
    });

    // Emit event to notify other components about the deletion (after commit)
    const event = new CustomEvent('wallet:transaction-deleted', {
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
 * Update an existing transaction by id and adjust user balances accordingly.
 * @param {string} transactionId - Firestore doc id for transaction
 * @param {Object} updates - Fields to update (type, amount, category, description, date)
 */
export const updateTransaction = async (transactionId, updates) => {
  try {
    // Find owning user by querying transactions collection across users is expensive.
    // Here expect caller to provide userId in updates.userId or pass userId separately.
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
    // Decrypt the old transaction to read amount and type
    const [oldDecrypted] = await decryptTransactions([encryptedOld]);

    const oldAmount = Number(oldDecrypted.amount || 0);
    const oldType = oldDecrypted.type || 'expense';

    // Prepare updates with timestamp. Convert date strings/Date objects to Timestamp when provided.
    const updatesWithTimestamp = {
      ...rest,
      updatedAt: Timestamp.now()
    };

    if (rest.date) {
      try {
        const rd = rest.date;
        if (rd && typeof rd.toDate === 'function') {
          updatesWithTimestamp.date = Timestamp.fromDate(rd.toDate());
        } else if (rd instanceof Date) {
          updatesWithTimestamp.date = Timestamp.fromDate(rd);
        } else if (typeof rd === 'number' && Number.isFinite(rd)) {
          updatesWithTimestamp.date = Timestamp.fromDate(new Date(rd));
        } else if (typeof rd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rd)) {
          const [yy, mm, dd] = rd.split('-').map(n => parseInt(n, 10));
          updatesWithTimestamp.date = Timestamp.fromDate(new Date(yy, mm - 1, dd));
        } else if (typeof rd === 'string') {
          updatesWithTimestamp.date = Timestamp.fromDate(new Date(rd));
        }
        // If it's already a Timestamp-like or convertible, handled above
      } catch {
        // keep original if conversion fails
      }
    }

    // Ensure amount is a number if provided
    const newAmount = rest.amount !== undefined ? Number(rest.amount) : oldAmount;
    const newType = rest.type || oldType;

  // Encrypt the updates if they contain sensitive data
  const encryptedUpdates = await encryptTransactionData({ ...updatesWithTimestamp, amount: newAmount });

  // Compute effect helper
    const computeEffects = (type, amount) => {
      const a = Number(amount || 0);
      switch (type) {
        case 'income':
          return { balance: a, totalIncome: a, totalExpense: 0, totalCreditGiven: 0, totalLoanTaken: 0 };
        case 'expense':
          return { balance: -a, totalIncome: 0, totalExpense: a, totalCreditGiven: 0, totalLoanTaken: 0 };
        case 'credit':
          return { balance: -a, totalIncome: 0, totalExpense: 0, totalCreditGiven: a, totalLoanTaken: 0 };
        case 'loan':
          return { balance: a, totalIncome: 0, totalExpense: 0, totalCreditGiven: 0, totalLoanTaken: a };
        default:
          return { balance: -a, totalIncome: 0, totalExpense: a, totalCreditGiven: 0, totalLoanTaken: 0 };
      }
    };

    const oldEffects = computeEffects(oldType, oldAmount);
    const newEffects = computeEffects(newType, newAmount);

    // Delta to apply to user profile
    const delta = {
      balance: newEffects.balance - oldEffects.balance,
      totalIncome: (newEffects.totalIncome || 0) - (oldEffects.totalIncome || 0),
      totalExpense: (newEffects.totalExpense || 0) - (oldEffects.totalExpense || 0),
      totalCreditGiven: (newEffects.totalCreditGiven || 0) - (oldEffects.totalCreditGiven || 0),
      totalLoanTaken: (newEffects.totalLoanTaken || 0) - (oldEffects.totalLoanTaken || 0)
    };

    // Prepare encrypted updated user profile data by reading and decrypting current profile
    const userRef = doc(db, 'users', userId);
    const userDocSnapshot = await getDoc(userRef);
    if (!userDocSnapshot.exists()) {
      throw new Error('User not found');
    }

    const encryptedUserData = userDocSnapshot.data();
    const userData = await decryptUserProfile(encryptedUserData);

    const currentBalance = Number(userData.balance) || 0;
    const totalIncome = Number(userData.totalIncome) || 0;
    const totalExpense = Number(userData.totalExpense) || 0;
    const totalCreditGiven = Number(userData.totalCreditGiven) || 0;
    const totalLoanTaken = Number(userData.totalLoanTaken) || 0;

    const updatedProfilePlain = {
      balance: currentBalance + delta.balance,
      totalIncome: totalIncome + delta.totalIncome,
      totalExpense: totalExpense + delta.totalExpense,
      totalCreditGiven: totalCreditGiven + delta.totalCreditGiven,
      totalLoanTaken: totalLoanTaken + delta.totalLoanTaken,
      updatedAt: Timestamp.now()
    };

    const encryptedUpdatedProfile = await encryptUserProfile(updatedProfilePlain);

    // Apply both transaction update and profile update atomically
    await runTransaction(db, async (tx) => {
      tx.update(transactionRef, encryptedUpdates);
      tx.update(userRef, encryptedUpdatedProfile);
    });

    // Emit event so UI can refresh
    const event = new CustomEvent('wallet:transaction-edited', { detail: { transactionId, updates: rest } });
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

    // Delete user profile document
    try {
      const userRef = doc(db, `users/${userId}`);
      await deleteDoc(userRef);
    } catch (e) {
      console.warn('Failed to delete user profile doc:', e?.message);
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
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(
      transactionsRef, 
      where('type', '==', 'loan')
    );
    
    const querySnapshot = await getDocs(q);
    const loans = [];
    
    for (const docSnap of querySnapshot.docs) {
      const decryptedTransactions = await decryptTransactions([{
        id: docSnap.id,
        ...docSnap.data()
      }]);
      
      const loan = decryptedTransactions[0];
      // Check if loan is not fully repaid
      if (!loan.isFullyPaid) {
        loans.push({
          ...loan,
          remainingAmount: loan.amount - (loan.paidAmount || 0)
        });
      }
    }
    
    // Sort by createdAt in JavaScript instead of Firestore
    loans.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA; // desc order
    });
    
    return { success: true, data: loans };
  } catch (error) {
    console.error('Error getting outstanding loans:', error);
    return { success: false, error: error.message };
  }
};

export const getOutstandingCredits = async (userId) => {
  try {
    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(
      transactionsRef, 
      where('type', '==', 'credit')
    );
    
    const querySnapshot = await getDocs(q);
    const credits = [];
    
    for (const docSnap of querySnapshot.docs) {
      const decryptedTransactions = await decryptTransactions([{
        id: docSnap.id,
        ...docSnap.data()
      }]);
      
      const credit = decryptedTransactions[0];
      // Check if credit is not fully collected
      if (!credit.isFullyPaid) {
        credits.push({
          ...credit,
          remainingAmount: credit.amount - (credit.paidAmount || 0)
        });
      }
    }
    
    // Sort by createdAt in JavaScript instead of Firestore
    credits.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA; // desc order
    });
    
    return { success: true, data: credits };
  } catch (error) {
    console.error('Error getting outstanding credits:', error);
    return { success: false, error: error.message };
  }
};

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
    
    const currentPaidAmount = decryptedLoan.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + repaymentAmount;
    const remainingAmount = decryptedLoan.amount - newPaidAmount;
    
    if (newPaidAmount > decryptedLoan.amount) {
      throw new Error('Repayment amount exceeds loan amount');
    }
    
    // Create repayment transaction (expense)
    const repaymentTransaction = {
      type: 'expense',
      amount: repaymentAmount,
      description: description || `Loan repayment - ${decryptedLoan.description}`,
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: loanId,
      isRepayment: true,
      repaymentFor: 'loan'
    };
    
    const result = await addTransaction(userId, repaymentTransaction);
    
    if (result.success) {
      // Update original loan with payment info
      const updatedLoanData = {
        ...decryptedLoan,
        paidAmount: newPaidAmount,
        isFullyPaid: remainingAmount <= 0,
        lastPaymentDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const encryptedLoan = await encryptTransactionData(updatedLoanData);
      await updateDoc(loanRef, encryptedLoan);
      
      return { 
        success: true, 
        repaymentTransactionId: result.id,
        remainingAmount: remainingAmount 
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error marking loan as repaid:', error);
    return { success: false, error: error.message };
  }
};

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
    
    const currentPaidAmount = decryptedCredit.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + collectionAmount;
    const remainingAmount = decryptedCredit.amount - newPaidAmount;
    
    if (newPaidAmount > decryptedCredit.amount) {
      throw new Error('Collection amount exceeds credit amount');
    }
    
    // Create collection transaction (income)
    const collectionTransaction = {
      type: 'income',
      amount: collectionAmount,
      description: description || `Credit collected - ${decryptedCredit.description}`,
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      linkedTransactionId: creditId,
      isRepayment: true,
      repaymentFor: 'credit'
    };
    
    const result = await addTransaction(userId, collectionTransaction);
    
    if (result.success) {
      // Update original credit with payment info
      const updatedCreditData = {
        ...decryptedCredit,
        paidAmount: newPaidAmount,
        isFullyPaid: remainingAmount <= 0,
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
        const txToStore = {
          ...tx,
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
        balance: Number(profile.balance) || 0,
        totalIncome: Number(profile.totalIncome) || 0,
        totalExpense: Number(profile.totalExpense) || 0,
        totalCreditGiven: Number(profile.totalCreditGiven) || 0,
        totalLoanTaken: Number(profile.totalLoanTaken) || 0,
        language: profile.language,
        theme: profile.theme,
        notifications: profile.notifications,
        budgetAlerts: profile.budgetAlerts,
        updatedAt: Timestamp.now()
      };

      // Remove undefined keys so updateDoc doesn't set them
      Object.keys(updatable).forEach(k => updatable[k] === undefined && delete updatable[k]);

      await updateDoc(userRef, updatable);
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