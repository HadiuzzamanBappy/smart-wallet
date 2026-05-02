import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSummaryStats } from '../../hooks/useSummaryStats';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { formatCurrencyWithUser } from '../../utils/helpers';
import { THEME } from '../../config/theme';
import AddTransactionModal from './AddTransactionModal';
import LoanCreditModal from './LoanCreditModal';
import MonthlyBreakdownModal from './MonthlyBreakdownModal';
import { CompactSummarySkeleton } from '../UI/SkeletonLoader';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import SectionHeader from '../UI/base/SectionHeader';

const CompactSummary = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const {
    stats,
    loading: showSkeleton,
    refreshing,
    refreshData
  } = useSummaryStats(user, userProfile, refreshUserProfile);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);

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
      color: 'text-brand-teal',
      bgColor: 'bg-brand-teal/10',
      border: 'border-brand-teal/20',
      onClick: () => setShowCreditModal(true),
      isClickable: (stats.creditDue || 0) > 0
    },
    {
      label: 'Loans',
      value: formatCurrencyWithUser(stats.loanDue || 0, userProfile),
      total: formatCurrencyWithUser(stats.allTimeLoanTaken || 0, userProfile),
      icon: DollarSign,
      color: 'text-brand-blue',
      bgColor: 'bg-brand-blue/10',
      border: 'border-brand-blue/20',
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
              <GlassCard
                key={index}
                className={spanClass}
                onClick={card.onClick}
                hover={card.isClickable}
                padding="p-4"
              >
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bgColor} ${card.color} border ${card.border} transition-transform group-hover:scale-110`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`${THEME.typography.label} mb-1`}>
                      {card.label}
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                      <span className={`${THEME.typography.value} truncate`}>
                        {card.value}
                      </span>
                      {card.total && (
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 truncate tracking-tight opacity-60">
                          / {card.total}
                        </span>
                      )}
                    </div>
                  </div>

                  {card.isClickable && (
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100/50 dark:bg-white/5 text-gray-400 group-hover:text-primary-500 transition-colors">
                      <Eye className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddTransactionModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshData}
        />
      )}

      {showLoanModal && <LoanCreditModal open={showLoanModal} onClose={() => setShowLoanModal(false)} type="loans" />}
      {showCreditModal && <LoanCreditModal open={showCreditModal} onClose={() => setShowCreditModal(false)} type="credits" />}
      {showMonthlyBreakdown && <MonthlyBreakdownModal open={showMonthlyBreakdown} onClose={() => setShowMonthlyBreakdown(false)} />}
    </div>
  );
};

export default CompactSummary;