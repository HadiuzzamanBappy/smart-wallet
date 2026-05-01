import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Plus, Eye, BarChart3 } from 'lucide-react';
import { isCreditCategory, isLoanCategory } from '../../utils/aiTransactionParser';
import { getOutstandingLoans, getOutstandingCredits } from '../../services/transactionService';
import { formatCurrencyWithUser } from '../../utils/helpers';
import AddTransactionModal from '../UI/AddTransactionModal';
import LoanCreditModal from './LoanCreditModal';
import MonthlyBreakdownModal from './MonthlyBreakdownModal';
import { CompactSummarySkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';

const CompactSummary = ({ refreshTrigger, onRefresh }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const {
    transactions,
    currentMonthIncome,
    currentMonthExpense,
    refreshTransactions,
    loading: txLoading
  } = useTransactions();

  const [stats, setStats] = useState({
    thisWeekChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

  const refreshData = async () => {
    if (refreshing) return;

    // Show the local skeleton while parent performs refresh so header and summary
    // both display loading state consistently.
    setRefreshing(true);
    try {
      if (onRefresh) {
        // Use the parent's refresh handler to sync header loading state
        await onRefresh();
        // Parent may have refreshed transactions; reload local summary data
        await loadData();
      } else {
        // Fallback to local refresh
        await refreshTransactions();
        await loadData();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = useCallback(async (transactions, profile) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let monthIncome = 0;
    let monthExpense = 0;
    let weekBalance = 0;

    transactions.forEach(transaction => {
      // Use transaction.date (user-provided date) for monthly calculations so amounts reset properly each month
      const transactionDate = new Date(transaction.date || transaction.createdAt);
      const createdDate = new Date(transaction.createdAt);
      const amount = parseFloat(transaction.amount) || 0;

      // This month calculations for income and expense only (based on transaction date, not when it was created)
      if (transactionDate >= thisMonth) {
        if (transaction.type === 'income') {
          monthIncome += amount;
        } else if (transaction.type === 'expense') {
          monthExpense += amount;
        }
      }

      // Last week change (based on creation time)
      if (createdDate >= lastWeek) {
        if (transaction.type === 'income') {
          weekBalance += amount;
        } else {
          weekBalance -= amount;
        }
      }
    });

    // Fetch actual outstanding credit and loan data from the service layer
    let allTimeCreditGiven = 0;
    let allTimeCreditDue = 0;
    let allTimeLoanTaken = 0;
    let allTimeLoanDue = 0;

    if (user?.uid) {
      try {
        const [creditsResult, loansResult] = await Promise.all([
          getOutstandingCredits(user.uid),
          getOutstandingLoans(user.uid)
        ]);

        if (creditsResult.success && creditsResult.data) {
          creditsResult.data.forEach(credit => {
            allTimeCreditGiven += Number(credit.amount || 0);
            allTimeCreditDue += Number(credit.remainingAmount || 0);
          });
        }

        if (loansResult.success && loansResult.data) {
          loansResult.data.forEach(loan => {
            allTimeLoanTaken += Number(loan.amount || 0);
            allTimeLoanDue += Number(loan.remainingAmount || 0);
          });
        }

        // Also include fully paid credits and loans in total amounts
        transactions.forEach(tx => {
          const transactionType = (tx.type || '').toString().toLowerCase().trim();
          const amount = parseFloat(tx.amount) || 0;

          if (isCreditCategory(transactionType) && tx.isFullyPaid) {
            allTimeCreditGiven += amount;
          }
          if (isLoanCategory(transactionType) && tx.isFullyPaid) {
            allTimeLoanTaken += amount;
          }
        });
      } catch (error) {
        console.error('Error fetching outstanding credits/loans:', error);
      }
    }

    setStats({
      balance: profile?.balance || userProfile?.balance || 0,
      thisMonthIncome: monthIncome,
      thisMonthExpense: monthExpense,
      thisWeekChange: weekBalance,
      allTimeCreditGiven: allTimeCreditGiven,
      allTimeLoanTaken: allTimeLoanTaken,
      creditDue: allTimeCreditDue,
      loanDue: allTimeLoanDue
    });
  }, [userProfile, user]);

  const loadData = useCallback(async () => {
    if (!user || !userProfile) return;

    setLoading(true);
    try {
      // Use shared transaction data from context
      if (transactions && transactions.length >= 0) {
        await calculateStats(transactions, userProfile);
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, transactions, calculateStats]);

  useEffect(() => {
    if (user?.uid && transactions !== null) {
      loadData();
    }
  }, [user?.uid, transactions, loadData]);

  // Refresh when refreshTrigger changes (for real-time updates)
  useEffect(() => {
    if (refreshTrigger && user?.uid) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, user?.uid]);

  // Initialize stats with existing userProfile data if available
  useEffect(() => {
    if (userProfile && stats.balance === 0) {
      setStats(prev => ({
        ...prev,
        balance: userProfile.balance || 0
      }));
    }
  }, [userProfile, stats.balance]);

  // Create stable reference for refreshUserProfile
  const stableRefreshUserProfile = useCallback(refreshUserProfile, [refreshUserProfile]);

  // Listen for transaction updates from other components
  useEffect(() => {
    const handleTransactionUpdate = async () => {
      console.debug('CompactSummary: Refreshing due to transaction update');

      // If this is a repayment/collection event, also refresh user profile
      // to get updated balance since loan/credit repayments affect balance
      // Always attempt to refresh user profile to keep totals/balance in sync
      try {
        await stableRefreshUserProfile();
      } catch (error) {
        console.warn('Failed to refresh user profile after transaction update:', error);
      }

      await loadData();
    };

    // Add event listeners
    window.addEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTransactionUpdate);
    window.addEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTransactionUpdate);
    window.addEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTransactionUpdate);
    window.addEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTransactionUpdate);

    return () => {
      window.removeEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTransactionUpdate);
      window.removeEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTransactionUpdate);
      window.removeEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTransactionUpdate);
      window.removeEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTransactionUpdate);
    };
  }, [loadData, stableRefreshUserProfile]);

  // Show skeleton if local loading or global transactions are still loading
  if (loading || refreshing || txLoading) {
    return <CompactSummarySkeleton />;
  }

  const summaryCards = [
    {
      label: 'Earned',
      value: formatCurrencyWithUser(currentMonthIncome, userProfile),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      hasAction: false
    },
    {
      label: 'Expended',
      value: formatCurrencyWithUser(currentMonthExpense, userProfile),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      border: 'border-red-500/20',
      hasAction: false
    },
    {
      label: 'Credit',
      value: {
        total: formatCurrencyWithUser(stats.allTimeCreditGiven || 0, userProfile),
        due: formatCurrencyWithUser(stats.creditDue || 0, userProfile),
        rawDue: stats.creditDue || 0
      },
      icon: Wallet,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      hasAction: true,
      actionLabel: 'View Credits',
      onAction: () => setShowCreditModal(true),
      hasAmount: (stats.creditDue || 0) > 0
    },
    {
      label: 'Loans',
      value: {
        total: formatCurrencyWithUser(stats.allTimeLoanTaken || 0, userProfile),
        due: formatCurrencyWithUser(stats.loanDue || 0, userProfile),
        rawDue: stats.loanDue || 0
      },
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      hasAction: true,
      actionLabel: 'View Loans',
      onAction: () => setShowLoanModal(true),
      hasAmount: (stats.loanDue || 0) > 0
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Welcome back</div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {userProfile?.displayName || 'User'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMonthlyBreakdown(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 dark:bg-gray-800/40 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            title="Monthly Breakdown"
          >
            <BarChart3 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 dark:bg-gray-800/40 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 active:scale-95"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {summaryCards.map((card, index) => {
              const IconComponent = card.icon;
              const spanClass = index >= 2 ? 'col-span-2 md:col-span-1' : '';
              const isClickable = card.hasAction && card.hasAmount;

              return (
                <div
                  key={index}
                  onClick={isClickable ? card.onAction : undefined}
                  className={`${spanClass} relative flex items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 bg-white/[0.03] dark:bg-gray-800/40 border ${card.border || 'border-white/10'} ${isClickable ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/20 active:scale-[0.98]' : ''} group overflow-hidden`}
                >
                  <div className={`p-1.5 rounded-xl ${card.bgColor} shrink-0 transition-transform group-hover:scale-110`}>
                    <IconComponent className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{card.label}</div>
                    {typeof card.value === 'object' ? (
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                          {card.value.total}
                        </span>
                        <span className={`text-[9px] font-bold ${card.value.rawDue > 0 ? 'text-red-400' : 'text-gray-500'} truncate`}>
                          ({card.value.due} DUE)
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-black text-gray-900 dark:text-white truncate">{card.value}</div>
                    )}
                  </div>

                  {isClickable && (
                    <div
                      className={`absolute top-1.5 right-1.5 p-1 rounded-lg transition-all bg-white/10 text-white`}
                      title={card.actionLabel}
                    >
                      <Eye className="w-3 h-3" />
                    </div>
                  )}

                  {/* Subtle decorative background gradient */}
                  <div className={`absolute -bottom-4 -right-4 w-10 h-10 rounded-full blur-2xl opacity-10 ${card.bgColor.replace('/10', '/30')}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          // Refresh user profile and data after successful addition
          try {
            await stableRefreshUserProfile();
          } catch (err) {
            console.warn('CompactSummary: failed to refresh profile after add', err);
          }
          await loadData();
        }}
      />

      {/* Loan Management Modal */}
      <LoanCreditModal
        open={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        type="loans"
      />

      {/* Credit Management Modal */}
      <LoanCreditModal
        open={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        type="credits"
      />

      {/* Monthly Breakdown Modal */}
      <MonthlyBreakdownModal
        open={showMonthlyBreakdown}
        onClose={() => setShowMonthlyBreakdown(false)}
      />
    </div>
  );
};

export default CompactSummary;