import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { formatCurrencyWithUser } from '../../utils/helpers';
import AddTransactionModal from './AddTransactionModal';
import LoanCreditModal from './LoanCreditModal';
import MonthlyBreakdownModal from './MonthlyBreakdownModal';
import { CompactSummarySkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import SectionHeader from '../UI/base/SectionHeader';
import IconBox from '../UI/base/IconBox';
import StatBadge from '../UI/base/StatBadge';

const CompactSummary = ({ refreshTrigger, onRefresh }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const {
    transactions,
    refreshTransactions,
    loading: txLoading,
    smartBalance,
    currentMonthIncome,
    currentMonthExpense,
    salaryPlan
  } = useTransactions();

  const [stats, setStats] = useState({
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    thisWeekChange: 0,
    allTimeCreditGiven: 0,
    allTimeLoanTaken: 0,
    creditDue: 0,
    loanDue: 0,
    balance: 0
  });
  const [loading, setLoading] = useState(txLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

  const refreshData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
        await loadData();
      } else {
        await refreshTransactions();
        await loadData();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = useCallback((transactions) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let weekBalance = 0;

    transactions.forEach(transaction => {
      const createdDate = new Date(transaction.createdAt);
      const amount = parseFloat(transaction.amount) || 0;
      if (createdDate >= lastWeek) {
        if (transaction.type === 'income') weekBalance += amount;
        else weekBalance -= amount;
      }
    });

    let allTimeCreditGiven = 0;
    let allTimeCreditDue = 0;
    let allTimeLoanTaken = 0;
    let allTimeLoanDue = 0;

    if (salaryPlan?.plan?.loanDetails) {
      salaryPlan.plan.loanDetails.forEach(loan => {
        allTimeLoanTaken += (loan.totalLeft || 0);
        allTimeLoanDue += (loan.totalLeft || 0);
      });
    }

    transactions.forEach(tx => {
      const type = (tx.type || '').toLowerCase();
      const amount = Number(tx.amount || 0);
      if (type === 'credit') {
        allTimeCreditGiven += amount;
        allTimeCreditDue += amount;
      } else if (type === 'loan') {
        allTimeLoanTaken += amount;
        allTimeLoanDue += amount;
      } else if (type === 'collection') {
        allTimeCreditDue -= amount;
      } else if (type === 'repayment') {
        allTimeLoanDue -= amount;
      }
    });

    allTimeCreditDue = Math.max(0, allTimeCreditDue);
    allTimeLoanDue = Math.max(0, allTimeLoanDue);

    setStats({
      balance: smartBalance,
      thisMonthIncome: currentMonthIncome,
      thisMonthExpense: currentMonthExpense,
      thisWeekChange: weekBalance,
      allTimeCreditGiven: allTimeCreditGiven,
      allTimeLoanTaken: allTimeLoanTaken,
      creditDue: allTimeCreditDue,
      loanDue: allTimeLoanDue
    });
  }, [smartBalance, currentMonthIncome, currentMonthExpense, salaryPlan]);

  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      if (transactions && transactions.length >= 0) {
        await calculateStats(transactions);
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, transactions, calculateStats]);

  useEffect(() => {
    if (!txLoading) setLoading(false);
  }, [txLoading]);

  useEffect(() => {
    if (user?.uid && transactions !== null) {
      loadData(true);
    }
  }, [user?.uid, transactions, loadData]);

  useEffect(() => {
    if (refreshTrigger && user?.uid) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, user?.uid]);

  const stableRefreshUserProfile = useCallback(refreshUserProfile, [refreshUserProfile]);

  useEffect(() => {
    const handleTransactionUpdate = async () => {
      setRefreshing(true);
      try {
        try {
          await stableRefreshUserProfile();
        } catch (error) {
          console.warn('Failed to refresh user profile:', error);
        }
        await loadData(true);
      } finally {
        setTimeout(() => setRefreshing(false), 300);
      }
    };

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

  const hasData = transactions && transactions.length > 0;
  const showSkeleton = refreshing || ((loading || txLoading) && !hasData);

  const summaryCards = [
    {
      label: 'Earned',
      value: formatCurrencyWithUser(stats.thisMonthIncome, userProfile),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      label: 'Expended',
      value: formatCurrencyWithUser(stats.thisMonthExpense, userProfile),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      border: 'border-red-500/20'
    },
    {
      label: 'Credit',
      value: formatCurrencyWithUser(stats.creditDue || 0, userProfile),
      total: formatCurrencyWithUser(stats.allTimeCreditGiven || 0, userProfile),
      icon: Wallet,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      onClick: () => setShowCreditModal(true),
      isClickable: (stats.creditDue || 0) > 0
    },
    {
      label: 'Loans',
      value: formatCurrencyWithUser(stats.loanDue || 0, userProfile),
      total: formatCurrencyWithUser(stats.allTimeLoanTaken || 0, userProfile),
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      onClick: () => setShowLoanModal(true),
      isClickable: (stats.loanDue || 0) > 0
    }
  ];

  return (
    <div className="w-full">
      <SectionHeader
        subtitle="Operational Intelligence"
        title={userProfile?.displayName || 'Command Center'}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMonthlyBreakdown(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
            title="Breakdown"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10 disabled:opacity-30"
            title="Refresh Suite"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </SectionHeader>

      {showSkeleton ? (
        <CompactSummarySkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card, index) => {
            const spanClass = index >= 2 ? 'col-span-2 md:col-span-1' : '';

            return (
              <div
                key={index}
                className={`${spanClass} group relative overflow-hidden rounded-2xl p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 transition-all duration-300 ${card.isClickable ? 'cursor-pointer hover:bg-white dark:hover:bg-white/[0.04] active:scale-[0.98]' : ''}`}
                onClick={card.onClick}
              >
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bgColor} ${card.color} border ${card.border} transition-transform group-hover:scale-110`}>
                    <card.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-1 leading-none">
                      {card.label}
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                      <span className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tighter">
                        {card.value}
                      </span>
                      {card.total && (
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 truncate uppercase tracking-tighter opacity-60">
                          / {card.total}
                        </span>
                      )}
                    </div>
                  </div>

                  {card.isClickable && (
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100/50 dark:bg-white/5 text-gray-400 group-hover:text-teal-500 transition-colors">
                      <Eye className="w-3 h-3" />
                    </div>
                  )}
                </div>
                {/* Refined decorative background glow */}
                <div className={`absolute -bottom-8 -right-8 w-16 h-16 rounded-full blur-3xl opacity-[0.05] dark:opacity-[0.1] ${card.bgColor}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          try {
            await stableRefreshUserProfile();
          } catch (err) {
            console.warn('CompactSummary: failed to refresh profile after add', err);
          }
          await loadData();
        }}
      />

      <LoanCreditModal open={showLoanModal} onClose={() => setShowLoanModal(false)} type="loans" />
      <LoanCreditModal open={showCreditModal} onClose={() => setShowCreditModal(false)} type="credits" />
      <MonthlyBreakdownModal open={showMonthlyBreakdown} onClose={() => setShowMonthlyBreakdown(false)} />
    </div>
  );
};

export default CompactSummary;