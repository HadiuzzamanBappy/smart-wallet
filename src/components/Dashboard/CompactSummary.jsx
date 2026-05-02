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
        subtitle="Overview"
        title={userProfile?.displayName || 'Command Center'}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="xsm"
            color="gray"
            onClick={() => setShowMonthlyBreakdown(true)}
            icon={BarChart3}
            title="Breakdown"
          />
          <Button
            variant="icon"
            size="xsm"
            color="gray"
            onClick={refreshData}
            loading={refreshing}
            icon={RefreshCw}
            title="Refresh"
          />
        </div>
      </SectionHeader>

      {showSkeleton ? (
        <CompactSummarySkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {summaryCards.map((card, index) => {
            const spanClass = index >= 2 ? 'col-span-2 md:col-span-1' : '';

            return (
              <GlassCard
                key={index}
                className={`${spanClass} group relative overflow-hidden`}
                onClick={card.onClick}
                hover={card.isClickable}
                border={card.border}
                padding="p-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <IconBox
                    icon={card.icon}
                    variant="glass"
                    colorClass={card.color}
                    size="xs"
                    className="group-hover:scale-110 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
                      {card.label}
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                      <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {card.value}
                      </span>
                      {card.total && (
                        <span className="text-[9px] font-bold text-gray-500 truncate">
                          ({card.total} TOT)
                        </span>
                      )}
                    </div>
                  </div>

                  {card.isClickable && (
                    <IconBox
                      icon={Eye}
                      size="xs"
                      variant="glass"
                      colorClass="text-gray-500 group-hover:text-teal-400"
                      className="shrink-0 transition-colors"
                    />
                  )}
                </div>
                {/* Subtle decorative background glow */}
                <div className={`absolute -bottom-4 -right-4 w-10 h-10 rounded-full blur-2xl opacity-10 ${card.bgColor.replace('/10', '/40')}`} />
              </GlassCard>
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