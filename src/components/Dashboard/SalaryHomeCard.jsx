import React, { useState, useEffect } from 'react';
import { Edit3, BarChart2 } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';
import { useTransactions } from '../../hooks/useTransactions';
import { THEME } from '../../config/theme';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';

const SalaryHomeCard = ({ userId, onOpen }) => {
  const [planData, setPlanData] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const { loading: transactionLoading } = useTransactions();

  // Combine internal fetch state with global transaction refresh state
  const loading = internalLoading || transactionLoading;

  const fetchPlan = React.useCallback(async (silent = false) => {
    if (!userId) {
      setInternalLoading(false);
      return;
    }

    if (!silent) setInternalLoading(true);
    try {
      const plan = await getSalaryPlan(userId);
      setPlanData(plan ? plan.plan : null);
    } catch (e) {
      console.error("Error checking salary plan", e);
    } finally {
      if (!silent) {
        setTimeout(() => {
          setInternalLoading(false);
        }, 500);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchPlan();

    const handleUpdate = (e) => {
      if (
        e?.type === 'salary-plan-updated' ||
        e?.detail?.erased ||
        e?.detail?.source === 'header-refresh'
      ) {
        fetchPlan(true); // silent refresh
      }
    };

    window.addEventListener('salary-plan-updated', handleUpdate);
    window.addEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleUpdate);

    return () => {
      window.removeEventListener('salary-plan-updated', handleUpdate);
      window.removeEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleUpdate);
    };
  }, [userId, fetchPlan]);

  const hasPlan = !!planData;
  const hasData = hasPlan;

  if (loading && !hasData) {
    return (
      <div className="w-full">
        <BudgetSkeleton />
      </div>
    );
  }

  let totalNeeds = 0, totalSavings = 0, totalWants = 0, needsPct = 0, wantsPct = 0, savePct = 0, dailyLimit = 0, totalSurplus = 0;
  let runway = 0, totalAssets = 0;

  if (hasPlan) {
    totalNeeds = planData.totalFixed || 0;
    totalSavings = planData.actualSavings || 0;
    totalWants = Math.max(0, planData.totalIncome - totalNeeds - totalSavings);

    needsPct = Math.round((totalNeeds / planData.totalIncome) * 100) || 0;
    savePct = Math.round((totalSavings / planData.totalIncome) * 100) || 0;
    wantsPct = Math.max(0, 100 - needsPct - savePct);

    totalSurplus = planData.netBalance ?? 0;
    dailyLimit = Math.max(0, totalSurplus) / 30;

    runway = planData.runwayMonths || 0;
    totalAssets = planData.totalAssets || 0;
  }

  if (!hasPlan) {
    return (
      <GlassCard
        padding="p-5"
        className="cursor-pointer group hover:border-primary-500/30 transition-all duration-500"
        onClick={() => onOpen('wizard')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-primary-500/5 border border-primary-500/10 text-primary-600 dark:text-primary-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Financial Intelligence</h3>
              <p className={`${THEME.typography.label} mt-1.5 opacity-60`}>Setup 50/30/20 & Daily Limits</p>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-primary-500 transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="relative group/card w-full">
      <GlassCard
        padding="p-5"
        className="cursor-pointer transition-all active:scale-[0.99] hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-500"
        onClick={() => onOpen('result')}
      >
        <div className="flex items-start justify-between gap-2 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-primary-500/5 border border-primary-500/10 text-primary-600 dark:text-primary-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className={`${THEME.typography.label} text-primary-600 dark:text-primary-400 leading-tight mb-1.5`}>Intelligence Suite</div>
              <div className="flex items-center gap-2.5">
                <div className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
                  {planData.currencySymbol}{Math.round(totalAssets).toLocaleString()}
                  <span className={`${THEME.typography.label} ml-2 opacity-50`}>Assets</span>
                </div>
                {runway > 0 && (
                  <Badge color="amber">
                    {runway.toFixed(1)}m Runway
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Needs', pct: needsPct, val: totalNeeds, color: 'text-gray-400' },
            { label: 'Wants', pct: wantsPct, val: totalWants, color: 'text-gray-400' },
            { label: 'Saving', pct: savePct, val: totalSavings, color: 'text-primary-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white/50 dark:bg-white/[0.01] py-3 px-2 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <span className={`${THEME.typography.label} opacity-60 mb-2 leading-none`}>{item.label}</span>
              <div className={`text-[12px] font-bold ${item.color} mb-1.5`}>{item.pct}%</div>
              <span className="text-[11px] font-bold text-gray-900 dark:text-white/70 tracking-tight leading-none">
                {planData.currencySymbol}{Math.round(item.val).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-[2] bg-primary-500/5 dark:bg-primary-500/[0.02] rounded-xl py-3 px-3 flex flex-col items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-500/10 hover:bg-primary-500/10 transition-colors">
            <span className={`${THEME.typography.label} opacity-60 mb-1 leading-none`}>Net Surplus</span>
            <span className="text-xs font-bold tracking-tight leading-none">{planData.currencySymbol}{Math.round(totalSurplus).toLocaleString()}</span>
          </div>
          <div className="flex-[3] bg-gray-50/50 dark:bg-white/[0.01] rounded-xl py-3 px-4 border border-gray-100 dark:border-white/5 flex justify-between items-center group/limit hover:bg-white dark:hover:bg-white/[0.04] transition-colors">
            <span className={THEME.typography.label}>Daily Ops</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none">{planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>

      {/* Settings Button - Always visible as requested */}
      <div className="absolute top-5 right-5 z-10 transition-all">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
          className="p-2 bg-white/50 dark:bg-white/[0.05] backdrop-blur-md rounded-xl text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-gray-100 dark:border-white/10 shadow-sm"
          title="Configuration"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SalaryHomeCard;
