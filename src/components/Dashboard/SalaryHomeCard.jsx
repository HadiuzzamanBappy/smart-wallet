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
        padding="p-4"
        className="cursor-pointer group hover:border-primary-500/30 transition-all duration-500"
        onClick={() => onOpen('wizard')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IconBox icon={BarChart2} size="sm" color="primary" variant="soft" />
            <div>
              <h3 className="text-body font-bold text-ink-900 dark:text-paper-50 tracking-tight leading-none mb-1.5">Financial Intelligence</h3>
              <p className="text-overline text-ink-400 dark:text-paper-700 leading-none">Setup 50/30/20 & Daily Limits</p>
            </div>
          </div>
          <IconBox icon={Edit3} size="xs" color="ink" variant="soft" className="group-hover:text-primary-500" />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="relative group/card w-full">
      <GlassCard
        padding="p-4"
        className="cursor-pointer transition-all active:scale-[0.99] hover:bg-white dark:hover:bg-white/[0.04] transition-all duration-500"
        onClick={() => onOpen('result')}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-4">
            <IconBox icon={BarChart2} size="sm" color="primary" variant="soft" />
            <div>
              <div className="text-overline text-primary-600 dark:text-primary-400 leading-none mb-1.5 font-bold uppercase tracking-widest">Intelligence Suite</div>
              <div className="flex items-center gap-2.5">
                <div className="text-h5 font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-none">
                  {planData.currencySymbol}{Math.round(totalAssets).toLocaleString()}
                </div>
                <Badge color="primary" variant="soft" size="sm" className="opacity-40">
                  <span className="text-[8px] font-black uppercase tracking-widest">Assets</span>
                </Badge>
                {runway > 0 && (
                  <Badge color="warning" variant="soft" size="sm">
                    {runway.toFixed(1)}m Runway
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {[
            { label: 'Needs', pct: needsPct, val: totalNeeds, color: 'text-ink-400' },
            { label: 'Wants', pct: wantsPct, val: totalWants, color: 'text-ink-400' },
            { label: 'Saving', pct: savePct, val: totalSavings, color: 'text-primary-500' },
          ].map((item, i) => (
            <div key={i} className="bg-paper-100/30 dark:bg-white/[0.01] py-2.5 px-2 rounded-2xl border border-paper-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-overline text-ink-400 dark:text-paper-700 opacity-60 mb-1.5 leading-none">{item.label}</span>
              <div className={`text-[11px] font-black tracking-tight ${item.color} mb-1.5 leading-none`}>{item.pct}%</div>
              <span className="text-[10px] font-bold text-ink-900 dark:text-paper-50 tracking-tighter leading-none">
                {planData.currencySymbol}{Math.round(item.val).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <div className="flex-[2] bg-primary-500/5 dark:bg-primary-500/[0.02] rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-500/10 hover:bg-primary-500/10 transition-colors">
            <span className="text-overline opacity-60 mb-1 leading-none uppercase tracking-widest font-black">Net Surplus</span>
            <span className="text-[11px] font-black tracking-tight leading-none">{planData.currencySymbol}{Math.round(totalSurplus).toLocaleString()}</span>
          </div>
          <div className="flex-[3] bg-paper-100/30 dark:bg-white/[0.01] rounded-2xl py-2.5 px-4 border border-paper-100 dark:border-white/5 flex justify-between items-center group/limit hover:bg-white dark:hover:bg-white/[0.04] transition-colors">
            <span className="text-overline text-ink-400 dark:text-paper-700 font-bold uppercase tracking-widest">Daily Ops</span>
            <span className="text-body font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-none">{planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>

      {/* Settings Button - Always visible as requested */}
      <div className="absolute top-4 right-4 z-10 transition-all">
        <IconBox 
          icon={Edit3} 
          size="xs" 
          color="ink" 
          variant="soft" 
          className="!bg-white/50 dark:!bg-white/[0.05] !backdrop-blur-md !border-paper-100 dark:!border-white/10 hover:!text-primary-500 cursor-pointer shadow-sm"
          onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
        />
      </div>
    </div>
  );
};

export default SalaryHomeCard;
