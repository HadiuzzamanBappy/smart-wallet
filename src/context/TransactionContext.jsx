import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTransactions } from '../services/transactionService';
import { getSalaryPlan } from '../services/salaryService';
import { computeTransactionEffects } from '../utils/transactionHelpers';
import { TransactionContext } from './createTransactionContext';
import { generateMonthlyBaselineTransactions } from '../services/rolloverService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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

      let finalTxs = txResult.success ? txResult.data : [];
      let finalPlan = planResult;

      // Detect month-start rollover silently
      if (planResult && planResult.plan && planResult.form) {
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Double check: check if baseline transactions have ALREADY been written to Firestore for this month
        const hasBaselineInDb = finalTxs.some(tx => {
          if (tx.source !== 'salary-plan-baseline') return false;
          const txDate = new Date(tx.date || tx.createdAt);
          const mStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          return mStr === currentMonthStr;
        });

        if (planResult.lastGeneratedMonth !== currentMonthStr && !hasBaselineInDb) {
          console.debug(`[ROLLOVER] Rollover detected. Generating baseline transactions for ${currentMonthStr}...`);
          const rolloverRes = await generateMonthlyBaselineTransactions(user.uid, planResult, currentMonthStr);
          if (rolloverRes && rolloverRes.success && !rolloverRes.alreadyGenerated) {
            // Re-fetch transactions and updated salary plan containing the new lastGeneratedMonth
            const [updatedTxResult, updatedPlanResult] = await Promise.all([
              getTransactions(user.uid),
              getSalaryPlan(user.uid)
            ]);
            if (updatedTxResult.success) {
              finalTxs = updatedTxResult.data;
            }
            if (updatedPlanResult) {
              finalPlan = updatedPlanResult;
            }
          }
        } else if (planResult.lastGeneratedMonth !== currentMonthStr && hasBaselineInDb) {
          // Silent self-healing: if baseline is already in database, silently sync lastGeneratedMonth field
          console.debug(`[ROLLOVER] Baselines already present in DB for ${currentMonthStr}. Syncing profile lastGeneratedMonth.`);
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { 'salary.lastGeneratedMonth': currentMonthStr });
          if (finalPlan) {
            finalPlan.lastGeneratedMonth = currentMonthStr;
          }
        }
      }

      setTransactions(finalTxs);
      if (finalPlan) {
        setSalaryPlan(finalPlan);
      } else {
        setSalaryPlan(null);
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
      const txDate = new Date(tx.date || tx.createdAt);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  // Aggregated Monthly Income (Transactions only - for display)
  const currentMonthIncomeTransactions = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => ['income', 'loan', 'collection'].includes(tx.type))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [currentMonthTransactions]);

  // Aggregated Monthly Expense (Transactions only - for display)
  const currentMonthExpenseTransactions = React.useMemo(() => {
    return currentMonthTransactions
      .filter(tx => ['expense', 'credit', 'repayment'].includes(tx.type))
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

  // Check if baseline transactions have already been logged to the database for the current month
  const hasBaselineBeenWritten = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.some(tx => {
      if (tx.source !== 'salary-plan-baseline') return false;
      const txDate = new Date(tx.date || tx.createdAt);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  // Fixed Monthly Values from Plan
  const monthlyFixedIncome = React.useMemo(() => {
    // If baseline has already been logged to the database, do NOT inject it in memory (prevent double-counting)
    if (hasBaselineBeenWritten || !salaryPlan?.plan) return 0;
    return salaryPlan.plan.totalIncome || 0;
  }, [salaryPlan, hasBaselineBeenWritten]);

  const monthlyFixedExpense = React.useMemo(() => {
    // If baseline has already been logged to the database, do NOT inject it in memory (prevent double-counting)
    if (hasBaselineBeenWritten || !salaryPlan?.plan) return 0;
    // For display (the 'Expended' card), we only count actual living costs (Rent, Bills, etc.)
    // We EXCLUDE Loans (EMI), Savings, and Goals as they are transfers/investments, not lifestyle costs.
    return (salaryPlan.plan.totalFixedCosts || 0);
  }, [salaryPlan, hasBaselineBeenWritten]);

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