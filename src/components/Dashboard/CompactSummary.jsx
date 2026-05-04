import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSummaryStats } from '../../hooks/useSummaryStats';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { formatCurrencyWithUser } from '../../utils/helpers';
import AddTransactionModal from './AddTransactionModal';
import LoanCreditModal from './LoanCreditModal';
import MonthlyBreakdownModal from './MonthlyBreakdownModal';
import { CompactSummarySkeleton } from '../UI/SkeletonLoader';
import IconBox from '../UI/base/IconBox';

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
      color: 'primary'
    },
    {
      label: 'Expended',
      value: formatCurrencyWithUser(stats.thisMonthExpense, userProfile),
      icon: TrendingDown,
      color: 'error'
    },
    {
      label: 'Credit',
      value: formatCurrencyWithUser(stats.creditDue || 0, userProfile),
      total: formatCurrencyWithUser(stats.allTimeCreditGiven || 0, userProfile),
      icon: Wallet,
      color: 'info',
      onClick: () => setShowCreditModal(true),
      isClickable: true
    },
    {
      label: 'Loans',
      value: formatCurrencyWithUser(stats.loanDue || 0, userProfile),
      total: formatCurrencyWithUser(stats.allTimeLoanTaken || 0, userProfile),
      icon: DollarSign,
      color: 'warning',
      onClick: () => setShowLoanModal(true),
      isClickable: true
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
            className="p-2 hover:bg-paper-100 dark:hover:bg-white/10 rounded-2xl text-ink-400 hover:text-ink-900 dark:hover:text-white transition-all border border-transparent hover:border-paper-200/50 dark:hover:border-white/10"
            title="Breakdown"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 hover:bg-paper-100 dark:hover:bg-white/10 rounded-2xl text-ink-400 hover:text-ink-900 dark:hover:text-white transition-all border border-transparent hover:border-paper-200/50 dark:hover:border-white/10 disabled:opacity-30"
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
            const isDebt = card.label === 'Credit' || card.label === 'Loans';
            const importance = isDebt ? 'medium' : 'high';

            return (
              <GlassCard
                key={index}
                onClick={card.onClick}
                hover={card.isClickable}
                padding="p-3.5"
                backgroundIcon={card.icon}
                iconColor={card.color}
                className="group relative overflow-hidden hover:bg-paper-100/50 dark:hover:bg-white/[0.04] transition-all border-paper-200/50 dark:border-white/5"
              >
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <IconBox
                      icon={card.icon}
                      size="xs"
                      color={card.color}
                      variant={importance === 'high' ? 'glass' : 'soft'}
                      className={`group-hover:scale-110 transition-transform ${importance === 'medium' ? 'opacity-60' : 'opacity-90'}`}
                    />
                    {card.onClick && (
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center rounded-lg bg-ink-900/5 dark:bg-white/5 text-paper-400 group-hover:text-primary-500 transition-colors">
                        <Eye className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-overline opacity-40 uppercase tracking-widest mb-1 ">
                      {card.label}
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                      <span className={`text-h5 font-bold tracking-tight ${card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                        card.color === 'error' ? 'text-red-600 dark:text-red-400' :
                          card.color === 'info' ? 'text-blue-600 dark:text-blue-400' :
                            'text-amber-600 dark:text-amber-400'
                        }`}>
                        {card.value}
                      </span>
                      {card.total && (
                        <span className="text-nano opacity-30  truncate">
                          / {card.total}
                        </span>
                      )}
                    </div>
                  </div>
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
