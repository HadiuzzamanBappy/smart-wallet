import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions } from '../services/transactionService';
import { computeTransactionEffects } from '../utils/transactionHelpers';
import { TransactionContext } from './createTransactionContext';

export const TransactionProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransactions = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    if (!forceRefresh && transactions.length > 0) {
      return; // Don't reload if we already have data unless forced
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getTransactions(user.uid);
      if (result.success) {
        setTransactions(result.data);
      } else {
        setError(result.error || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, transactions.length]);

  const refreshTransactions = useCallback(() => {
    return loadTransactions(true);
  }, [loadTransactions]);

  // Load transactions when user changes
  useEffect(() => {
    if (user?.uid) {
      loadTransactions();
    }
  }, [user?.uid, loadTransactions]);

  // Calculate derived data
  const currentMonthTransactions = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  // Exclude repayment/collection/adjustment transactions from income/expense aggregation
  const currentMonthIncome = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => !tx.isRepayment && !tx.adjustmentTag && tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpense = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => !tx.isRepayment && !tx.adjustmentTag && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [currentMonthTransactions]);

  // Aggregate totals excluding repayments/collections
  const totalIncome = React.useMemo(() => {
    return transactions
      .filter(tx => !tx.isRepayment && !tx.adjustmentTag && tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalExpense = React.useMemo(() => {
    return transactions
      .filter(tx => !tx.isRepayment && !tx.adjustmentTag && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // Compute balance by summing each transaction's effect. This allows repayment
  // transactions (isRepayment) to only affect balance and not the income/expense totals.
  const balance = React.useMemo(() => {
    return transactions.reduce((sum, tx) => {
      try {
        const eff = computeTransactionEffects(tx);
        return sum + (eff.balance || 0);
      } catch {
        // Fallback: preserve legacy behavior for unknown tx
        if (tx.type === 'income') return sum + (tx.amount || 0);
        if (tx.type === 'expense') return sum - (tx.amount || 0);
        if (tx.type === 'credit') return sum - (tx.amount || 0);
        if (tx.type === 'loan') return sum + (tx.amount || 0);
        return sum;
      }
    }, 0);
  }, [transactions]);

  const value = {
    // Data
    transactions,
    currentMonthTransactions,
    currentMonthIncome,
    currentMonthExpense,
    totalIncome,
    totalExpense,
    balance,
    
    // State
    loading,
    error,
    
    // Actions
    loadTransactions,
    refreshTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};