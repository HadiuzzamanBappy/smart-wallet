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
  limit
} from 'firebase/firestore';
import { encryptTransactionData, decryptTransactions } from '../utils/encryption';

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
    
    // Prepare transaction data for encryption
    const transactionToStore = {
      ...transactionData,
      amount, // Ensure it's stored as number
      userId,
      createdAt: Timestamp.now(),
      date: Timestamp.fromDate(new Date(transactionData.date)),
      // Include original user message/prompt if provided
      originalMessage: transactionData.originalMessage || transactionData.description,
      source: transactionData.source || 'manual' // Track if created via chat or manual entry
    };

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
      const userData = userDoc.data();
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
      
      await updateDoc(userRef, {
        balance: newBalance,
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        totalCreditGiven: newTotalCreditGiven,
        totalLoanTaken: newTotalLoanTaken,
        updatedAt: Timestamp.now()
      });
      
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
    // Delete transaction
    const transactionRef = doc(db, `users/${userId}/transactions/${transactionId}`);
    await deleteDoc(transactionRef);
    
    // Reverse the balance update by subtracting the original transaction effect
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;
      const totalIncome = userData.totalIncome || 0;
      const totalExpense = userData.totalExpense || 0;
      
      // Reverse the transaction effect
      let newBalance = currentBalance;
      let newTotalIncome = totalIncome;
      let newTotalExpense = totalExpense;
      let newTotalCreditGiven = userData.totalCreditGiven || 0;
      let newTotalLoanTaken = userData.totalLoanTaken || 0;

      if (transactionData.type === 'income') {
        // Remove income: subtract from balance and totalIncome
        newBalance = currentBalance - transactionData.amount;
        newTotalIncome = totalIncome - transactionData.amount;
      } else if (transactionData.type === 'expense') {
        // Remove expense: add back to balance and subtract from totalExpense
        newBalance = currentBalance + transactionData.amount;
        newTotalExpense = totalExpense - transactionData.amount;
      } else if (transactionData.type === 'credit') {
        // Reversing a credit given: add back to balance and reduce totalCreditGiven
        newBalance = currentBalance + transactionData.amount;
        newTotalCreditGiven = newTotalCreditGiven - transactionData.amount;
      } else if (transactionData.type === 'loan') {
        // Reversing a loan taken: subtract from balance and reduce totalLoanTaken
        newBalance = currentBalance - transactionData.amount;
        newTotalLoanTaken = newTotalLoanTaken - transactionData.amount;
      }

      await updateDoc(userRef, {
        balance: newBalance,
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        totalCreditGiven: newTotalCreditGiven,
        totalLoanTaken: newTotalLoanTaken,
        updatedAt: Timestamp.now()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
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

    const old = txDoc.data();
    
    // Prepare updates with timestamp
    const updatesWithTimestamp = { 
      ...rest, 
      updatedAt: Timestamp.now()
    };
    
    // Encrypt the updates if they contain sensitive data
    const encryptedUpdates = await encryptTransactionData(updatesWithTimestamp);
    
    // Update transaction fields
    await updateDoc(transactionRef, encryptedUpdates);

    // If type or amount changed, adjust user summary totals
    if ((rest.type && rest.type !== old.type) || (rest.amount && Number(rest.amount) !== Number(old.amount))) {
      // Recalculate by reversing old and applying new
      const numOld = Number(old.amount || 0);
      const numNew = Number(rest.amount || old.amount || 0);
      // Reverse old transaction
      await updateUserBalance(userId, invertTypeForReverse(old.type), numOld);
      // Apply new transaction
      await updateUserBalance(userId, rest.type || old.type, numNew);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message };
  }
};

// Helper to invert type when reversing a transaction to update balances
const invertTypeForReverse = (type) => {
  // When reversing an effect we swap income<->expense and credit<->loan
  switch (type) {
    case 'income': return 'expense';
    case 'expense': return 'income';
    case 'credit': return 'loan';
    case 'loan': return 'credit';
    default: return 'expense';
  }
};

/**
 * Export combined user data (profile + all transactions) as a JS object.
 */
export const exportUserData = async (userId) => {
  try {
    const profileRes = await getUserProfile(userId);
    const txRes = await getTransactions(userId);

    if (!profileRes.success) throw new Error(profileRes.error || 'Failed to fetch profile');
    if (!txRes.success) throw new Error(txRes.error || 'Failed to fetch transactions');

    return {
      success: true,
      data: {
        profile: profileRes.data,
        transactions: txRes.data
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
      
      return { 
        success: true, 
        collectionTransactionId: result.id,
        remainingAmount: remainingAmount 
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error marking credit as collected:', error);
    return { success: false, error: error.message };
  }
};