import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions } from '../services/transactionService';
import { getSalaryPlan } from '../services/salaryService';
import { computeTransactionEffects } from '../utils/transactionHelpers';
import { TransactionContext } from './createTransactionContext';

export const TransactionProvider = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaryPlan, setSalaryPlan] = useState(null);

  const loadTransactions = useCallback(async (forceRefresh = false, silent = false) => {
    if (!user) {
      setTransactions([]);
      setSalaryPlan(null);
      setLoading(false);
      return;
    }

    if (!forceRefresh && transactions.length > 0) {
      return; // Don't reload if we already have data unless forced
    }

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [txResult, planResult] = await Promise.all([
        getTransactions(user.uid),
        getSalaryPlan(user.uid)
      ]);

      if (txResult.success) {
        setTransactions(txResult.data);
      } else {
        setError(txResult.error || 'Failed to load transactions');
        setTransactions([]);
      }

      if (planResult) {
        setSalaryPlan(planResult);
      }
    } catch (err) {
      setError(err.message);
      setTransactions([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user, transactions.length]);

  const refreshTransactions = useCallback((silent = false) => {
    return loadTransactions(true, silent);
  }, [loadTransactions]);

  // Load transactions and plan when user changes
  useEffect(() => {
    if (user?.uid) {
      loadTransactions();
    }
  }, [user?.uid, loadTransactions]);

  // Listen for plan updates
  useEffect(() => {
    const handlePlanUpdate = () => refreshTransactions(true);
    window.addEventListener('salary-plan-updated', handlePlanUpdate);
    return () => window.removeEventListener('salary-plan-updated', handlePlanUpdate);
  }, [refreshTransactions]);

  // Optimistic updates
  const removeTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const updateTransactionLocally = useCallback((id, updates) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }, []);

  const addTransactionLocally = useCallback((tx) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

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

  // Aggregated Monthly Income (Transactions only - for display)
  const currentMonthIncomeTransactions = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [currentMonthTransactions]);

  // Aggregated Monthly Expense (Transactions only - for display)
  const currentMonthExpenseTransactions = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [currentMonthTransactions]);

  // Total Net Flow for balance calculation (includes Loans/Credits/etc)
  const monthlyNetFlowTransactions = React.useMemo(() => {
    return currentMonthTransactions.reduce((sum, tx) => {
      const type = (tx.type || '').toLowerCase();
      const amount = Number(tx.amount) || 0;
      if (['income', 'loan', 'collection'].includes(type)) return sum + amount;
      if (['expense', 'credit', 'repayment'].includes(type)) return sum - amount;
      return sum;
    }, 0);
  }, [currentMonthTransactions]);

  // Fixed Monthly Values from Plan
  const monthlyFixedIncome = React.useMemo(() => {
    if (!salaryPlan?.plan) return 0;
    return salaryPlan.plan.totalIncome || 0;
  }, [salaryPlan]);

  const monthlyFixedExpense = React.useMemo(() => {
    if (!salaryPlan?.plan) return 0;
    // For display (the 'Expended' card), we only count actual living costs (Rent, Bills, etc.)
    // We EXCLUDE Loans (EMI), Savings, and Goals as they are transfers/investments, not lifestyle costs.
    return (salaryPlan.plan.totalFixedCosts || 0);
  }, [salaryPlan]);

  const cashInHand = React.useMemo(() => {
    if (!salaryPlan?.plan) return 0;
    return parseFloat(salaryPlan.plan.cashInHand) || 0;
  }, [salaryPlan]);

  // Combine Transactions + Fixed Plan
  const currentMonthIncome = currentMonthIncomeTransactions + monthlyFixedIncome;
  const currentMonthExpense = currentMonthExpenseTransactions + monthlyFixedExpense;

  // Legacy Balance (DB Sum)
  const balance = React.useMemo(() => {
    return transactions.reduce((sum, tx) => {
      try {
        const eff = computeTransactionEffects(tx);
        return sum + (eff.balance || 0);
      } catch {
        if (tx.type === 'income') return sum + (tx.amount || 0);
        if (tx.type === 'expense') return sum - (tx.amount || 0);
        if (tx.type === 'credit') return sum - (tx.amount || 0);
        if (tx.type === 'loan') return sum + (tx.amount || 0);
        return sum;
      }
    }, 0);
  }, [transactions]);

  /**
   * OPENING BALANCE (Carry-over from previous months)
   * This calculates the sum of all transactions before the current month began.
   */
  const openingBalance = useMemo(() => {
    const now = new Date();
    const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.reduce((sum, tx) => {
      const txDate = new Date(tx.date || tx.createdAt);
      if (txDate < firstOfCurrentMonth) {
        try {
          const eff = computeTransactionEffects(tx);
          return sum + (eff.balance || 0);
        } catch {
          if (tx.type === 'income') return sum + (tx.amount || 0);
          if (tx.type === 'expense') return sum - (tx.amount || 0);
          if (tx.type === 'credit') return sum - (tx.amount || 0);
          if (tx.type === 'loan') return sum + (tx.amount || 0);
          return sum;
        }
      }
      return sum;
    }, 0);
  }, [transactions, computeTransactionEffects]);

  /**
   * SMART BALANCE CALCULATION (Auto-Deduct Model)
   * Wallet = Net Surplus (Income - Fixed - Savings - Goal) + Opening Balance + Initial Cash + Actual Extra Transactions
   * This ensures previous month's leftovers (surplus) are carried over automatically.
   */
  const smartBalance = (salaryPlan?.plan?.disposable || 0) + cashInHand + openingBalance + monthlyNetFlowTransactions;
  const netSurplus = (salaryPlan?.plan?.netBalance || 0) + cashInHand + openingBalance + monthlyNetFlowTransactions;

  /**
   * LIQUID BALANCE (Actual Wallet)
   * Wallet = All-time Transactions Sum + Initial Cash in Hand
   * This is the REAL money the user has right now.
   */
  const liquidBalance = balance + cashInHand;

  const value = {
    // Data
    transactions,
    salaryPlan,
    currentMonthTransactions,
    currentMonthIncome,
    currentMonthExpense,
    balance,
    smartBalance,
    netSurplus,
    liquidBalance,
    monthlyNetFlowTransactions,
    netBalance: currentMonthIncome - currentMonthExpense,

    // State
    loading,
    error,

    // Actions
    loadTransactions,
    refreshTransactions,
    removeTransaction,
    updateTransactionLocally,
    addTransactionLocally
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};