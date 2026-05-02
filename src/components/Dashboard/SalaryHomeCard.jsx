import React, { useState, useEffect } from 'react';
import { Edit3, BarChart2 } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';
import { useTransactions } from '../../hooks/useTransactions';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Button from '../UI/base/Button';
import GlassBadge from '../UI/base/GlassBadge';
import IconBox from '../UI/base/IconBox';

const SalaryHomeCard = ({ userId, onOpen }) => {
  const [planData, setPlanData] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const { loading: transactionLoading } = useTransactions();

  // Combine internal fetch state with global transaction refresh state
  // This ensures the skeleton triggers immediately with the rest of the dashboard
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
        // Guarantee the skeleton shows for at least 500ms during fast cache reads
        setTimeout(() => {
          setInternalLoading(false);
        }, 500);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchPlan();

    const handleUpdate = (e) => {
      // Refresh on onboarding, data erasure, or manual refresh
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
        className="cursor-pointer group hover:border-teal-500/30"
        onClick={() => onOpen('wizard')}
        padding="p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconBox icon={BarChart2} size="md" colorClass="text-teal-400" bgClass="bg-teal-400/10" />
            <div>
              <h3 className="font-bold text-white text-[12px]">Financial Intelligence</h3>
              <p className="text-[10px] text-gray-500 font-medium">Setup 50/30/20 & Daily Limits</p>
            </div>
          </div>
          <Button
            variant="icon"
            size="xsm"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              onOpen('wizard');
            }}
            icon={Edit3}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="relative group/card w-full">
      <GlassCard
        className="cursor-pointer transition-all active:scale-[0.98] border-white/5"
        onClick={() => onOpen('result')}
        padding="p-3"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <IconBox icon={BarChart2} size="md" colorClass="text-teal-400" bgClass="bg-teal-400/10" />
            <div>
              <div className="text-[11px] font-bold text-teal-400">Financial Intelligence</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-sm font-bold text-white/90 tracking-tighter">
                  {planData.currencySymbol}{Math.round(totalAssets).toLocaleString()}
                  <span className="ml-1.5 text-[10px] text-gray-500 font-semibold">Assets</span>
                </div>
                {runway > 0 && (
                  <GlassBadge color="amber" className="scale-90 origin-left">
                    {runway.toFixed(1)}m Runway
                  </GlassBadge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Needs', pct: needsPct, val: totalNeeds, color: 'gray' },
            { label: 'Wants', pct: wantsPct, val: totalWants, color: 'gray' },
            { label: 'Save', pct: savePct, val: totalSavings, color: 'teal' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 py-2 px-1 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-gray-500 font-semibold mb-1.5">{item.label}</span>
              <GlassBadge color={item.color} className="mb-1 py-0 px-1.5 !text-[10px]">
                {item.pct}%
              </GlassBadge>
              <span className="text-[9px] font-bold text-white/70 tracking-tighter">
                {planData.currencySymbol}{Math.round(item.val).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-[2] bg-teal-500/20 rounded-xl py-2 px-2 flex flex-col items-center justify-center text-teal-400 border border-teal-500/20 hover:bg-teal-500/30 transition-colors">
            <span className="text-[9px] font-semibold opacity-60">Net Surplus</span>
            <span className="text-[10px] font-bold tracking-tighter">{planData.currencySymbol}{Math.round(totalSurplus).toLocaleString()}</span>
          </div>
          <div className="flex-[3] bg-white/5 rounded-xl py-2 px-3 border border-white/5 flex justify-between items-center group/limit hover:bg-white/[0.08] transition-colors">
            <span className="text-[10px] text-gray-500 font-semibold">Daily Limit</span>
            <span className="text-xs font-bold text-white tracking-tighter">{planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>

      {/* Settings Button */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="icon"
          size="xsm"
          color="gray"
          onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
          icon={Edit3}
          title="Settings"
        />
      </div>
    </div>
  );
};

export default SalaryHomeCard;
