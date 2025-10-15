import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Plus, Eye, BarChart3 } from 'lucide-react';
import { isCreditCategory, isLoanCategory } from '../../utils/aiTransactionParser';
import { getOutstandingLoans, getOutstandingCredits } from '../../services/transactionService';
import AddTransactionModal from '../Transaction/AddTransactionModal';
import LoanCreditModal from '../Transaction/LoanCreditModal';
import MonthlyBreakdownModal from './MonthlyBreakdownModal';
import { CompactSummarySkeleton } from '../UI/SkeletonLoader';

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



  const formatCurrency = (amount) => {
    const currency = userProfile?.currency || 'BDT';
    const currencyLocales = {
      BDT: 'en-BD',
      USD: 'en-US',
      EUR: 'en-DE',
      GBP: 'en-GB',
      INR: 'en-IN'
    };

    const locale = currencyLocales[currency] || 'en-BD';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'BDT' ? 0 : 2
    }).format(amount || 0);
  };

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
      console.log('CompactSummary: Refreshing due to transaction update');

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
    window.addEventListener('wallet:transaction-added', handleTransactionUpdate);
    window.addEventListener('wallet:transaction-edited', handleTransactionUpdate);
    window.addEventListener('wallet:transaction-deleted', handleTransactionUpdate);
    window.addEventListener('wallet:transactions-updated', handleTransactionUpdate);

    return () => {
      window.removeEventListener('wallet:transaction-added', handleTransactionUpdate);
      window.removeEventListener('wallet:transaction-edited', handleTransactionUpdate);
      window.removeEventListener('wallet:transaction-deleted', handleTransactionUpdate);
      window.removeEventListener('wallet:transactions-updated', handleTransactionUpdate);
    };
  }, [loadData, stableRefreshUserProfile]);

  // Show skeleton if local loading or global transactions are still loading
  if (loading || refreshing || txLoading) {
    return <CompactSummarySkeleton />;
  }

  const summaryCards = [
    {
      label: 'Earned',
      value: formatCurrency(currentMonthIncome),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      hasAction: false
    },
    {
      label: 'Expended',
      value: formatCurrency(currentMonthExpense),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      hasAction: false
    },
    {
      label: 'Given Credit (Outstanding)',
      // render value and due separately so we can style the due amount
      value: {
        total: formatCurrency(stats.allTimeCreditGiven || 0),
        due: formatCurrency(stats.creditDue || 0),
        rawDue: stats.creditDue || 0
      },
      icon: Wallet,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      hasAction: true,
      actionLabel: 'View Credits',
      onAction: () => setShowCreditModal(true),
      // show button only when there is an outstanding due amount
      hasAmount: (stats.creditDue || 0) > 0
    },
    {
      label: 'Took Loan (Outstanding)',
      value: {
        total: formatCurrency(stats.allTimeLoanTaken || 0),
        due: formatCurrency(stats.loanDue || 0),
        rawDue: stats.loanDue || 0
      },
      icon: DollarSign,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      hasAction: true,
      actionLabel: 'View Loans',
      onAction: () => setShowLoanModal(true),
      // show button only when there is an outstanding due amount
      hasAmount: (stats.loanDue || 0) > 0
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Welcome back, {userProfile?.displayName?.split(' ')[2] || 'Buddy'}</div>
          <div className="text-xs text-gray-400">Quick snapshot of this month</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMonthlyBreakdown(true)}
            className="inline-flex items-center justify-center w-8 h-8 text-sm rounded-md bg-white/5 dark:bg-gray-800/40 hover:bg-white/10 transition-colors z-10"
            title="Monthly Breakdown"
            aria-label="View monthly breakdown"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-8 h-8 text-sm rounded-md bg-white/5 dark:bg-gray-800/40 hover:bg-white/10 transition-colors disabled:opacity-50 z-10"
            title="Refresh"
            aria-label="Refresh summary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {summaryCards.map((card, index) => {
              const IconComponent = card.icon;
              // Make the last two cards span the full width only on mobile,
              // on md+ keep them as regular single-column items
              const spanClass = index >= 2 ? 'col-span-2 md:col-span-1' : '';
              return (
                <div key={index} className={`${spanClass} relative flex items-center gap-2 p-2 sm:p-4 rounded-lg transition-all duration-200 ${card.bgColor} ${card.color} text-sm`}>
                  <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                    <IconComponent className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="text-xs font-medium truncate">{card.label}</div>
                    {/* If card.value is an object, render total and styled due part separately */}
                    {typeof card.value === 'object' ? (
                      <div className="text-sm font-semibold truncate">
                        <span
                          className={`ml-2 text-xs font-medium ${card.value.rawDue > 0 ? 'text-red-500' : 'text-gray-400'} truncate`}
                          title={card.value.rawDue > 0 ? 'Outstanding amount still owed' : 'No outstanding due'}
                          role="tooltip"
                          aria-label={card.value.rawDue > 0 ? 'Outstanding amount still owed' : 'No outstanding due'}
                        >
                          {card.value.due}
                        </span>
                        <span> | {card.value.total}</span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold truncate">{card.value}</div>
                    )}
                  </div>
                  {card.hasAction && card.hasAmount && (
                    <button
                      onClick={card.onAction}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors ${card.color.includes('teal')
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      title={card.actionLabel}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
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