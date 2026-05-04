import React, { useState, useEffect } from 'react';
import { Edit3, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';
import { useTransactions } from '../../hooks/useTransactions';

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
              <h3 className="text-body text-ink-900 dark:text-paper-50 mb-1.5">Financial Intelligence</h3>
              <p className="text-nano text-ink-400 dark:text-paper-700">Setup 50/30/20 & Daily Limits</p>
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
              <div className="text-nano text-primary-600 dark:text-primary-400 mb-1.5 uppercase">Intelligence Suite</div>
              <div className="flex items-center gap-2.5">
                <div className="text-h5 text-ink-900 dark:text-paper-50">
                  {planData.currencySymbol}{Math.round(totalAssets).toLocaleString()}
                </div>
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
            {
              label: 'Needs',
              pct: needsPct,
              target: 50,
              val: totalNeeds,
              color: needsPct > 50 ? 'text-error-600 dark:text-error-400' : 'text-info-600 dark:text-info-400'
            },
            {
              label: 'Wants',
              pct: wantsPct,
              target: 30,
              val: totalWants,
              color: wantsPct > 30 ? 'text-error-600 dark:text-error-400' : 'text-warning-600 dark:text-warning-400'
            },
            {
              label: 'Saving',
              pct: savePct,
              target: 20,
              val: totalSavings,
              color: savePct < 20 ? 'text-error-600 dark:text-error-400' : 'text-primary-600 dark:text-primary-400'
            },
          ].map((item, i) => (
            <div key={i} className={`bg-paper-100/30 dark:bg-white/[0.01] py-2.5 px-2 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center text-center ${item.color.includes('error') ? 'border-error-500/20 bg-error-500/5' : 'border-paper-100 dark:border-white/5'
              }`}>
              <span className={`text-nano uppercase mb-1 ${item.color.includes('error') ? 'text-error-600/60 dark:text-error-400/60' : 'text-ink-400 dark:text-paper-700'}`}>{item.label}</span>
              <div className="flex items-center justify-center gap-1 mb-1.5 min-w-0">
                <div className={`text-nano font-bold ${item.color} shrink-0`}>{item.pct}%</div>
                <div className="flex items-center gap-0.5 opacity-30 text-[8px] font-black uppercase tracking-tighter shrink-0">
                  {item.pct > item.target ? <ArrowUp size={7} strokeWidth={3} /> : <ArrowDown size={7} strokeWidth={3} />}
                  <span>{item.target}%</span>
                </div>
              </div>
              <span className="text-nano text-ink-900 dark:text-paper-50 font-medium">
                {planData.currencySymbol}{Math.round(item.val).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <div className={`flex-[2] rounded-2xl py-2.5 px-3 flex flex-col items-center justify-center border transition-colors ${totalSurplus >= 0
            ? 'bg-primary-500/5 dark:bg-primary-500/[0.02] text-primary-600 dark:text-primary-400 border-primary-500/10 hover:bg-primary-500/10'
            : 'bg-error-500/5 dark:bg-error-500/[0.02] text-error-600 dark:text-error-400 border-error-500/10 hover:bg-error-500/10'
            }`}>
            <span className="text-nano uppercase opacity-60 mb-1">Net Surplus</span>
            <span className="text-nano font-bold">{planData.currencySymbol}{Math.round(totalSurplus).toLocaleString()}</span>
          </div>
          <div className={`flex-[3] rounded-2xl py-2.5 px-4 border flex justify-between items-center group/limit transition-colors ${totalSurplus >= 0
            ? 'bg-paper-100/30 dark:bg-white/[0.01] border-ink-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.04]'
            : 'bg-error-500/5 dark:bg-error-500/[0.02] border-error-500/10 hover:bg-error-500/10'
            }`}>
            <span className={`text-nano uppercase ${totalSurplus >= 0 ? 'text-ink-400 dark:text-paper-700' : 'text-error-600/60 dark:text-error-400/60'}`}>Daily Ops</span>
            <span className={`text-nano font-bold ${totalSurplus >= 0 ? 'text-ink-900 dark:text-paper-50' : 'text-error-600 dark:text-error-400'}`}>
              {planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}
            </span>
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
