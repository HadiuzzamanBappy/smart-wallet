import React, { useState, useEffect } from 'react';
import { Edit3, BarChart2 } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';
import { useTransactions } from '../../hooks/useTransactions';

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
      <div
        className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800 cursor-pointer transition-colors hover:border-teal-300 dark:hover:border-teal-700"
        onClick={() => onOpen('wizard')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Financial Intelligence</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Calculate 50/30/20 & Daily Limits</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen('wizard');
            }}
            className="p-2 -m-2 rounded-md hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
            title="Modify Financial Plan"
          >
            <Edit3 className="w-4 h-4 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group/card w-full">
      <div
        className="w-full text-left rounded-2xl p-3 bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-all hover:shadow-md active:scale-[0.98]"
        onClick={() => onOpen('result')}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/30">
              <BarChart2 className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-200">Financial Intelligence</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {planData.currencySymbol}{Math.round(totalAssets).toLocaleString()}
                  <span className="ml-1 text-[9px] uppercase opacity-40 font-black">Assets</span>
                </div>
                {runway > 0 && (
                  <div className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-600 dark:text-amber-400">
                    {runway.toFixed(1)}m Runway
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Spacer for absolute button */}
          <div className="w-6 h-6 shrink-0" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-gray-50 dark:bg-gray-900/50 py-2 px-1 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Needs</span>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">{needsPct}%</span>
            <span className="text-[9px] font-bold text-gray-500">{planData.currencySymbol}{Math.round(totalNeeds).toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 py-2 px-1 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Wants</span>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">{wantsPct}%</span>
            <span className="text-[9px] font-bold text-gray-500">{planData.currencySymbol}{Math.round(totalWants).toLocaleString()}</span>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 py-2 px-1 rounded-xl border border-teal-100 dark:border-teal-800/50 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] text-teal-600 dark:text-teal-400 uppercase font-black tracking-widest mb-0.5">Save</span>
            <span className="text-xs font-black text-teal-700 dark:text-teal-300">{savePct}%</span>
            <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400">{planData.currencySymbol}{Math.round(totalSavings).toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <div className="flex-[2] bg-teal-500/40 dark:bg-teal-600/40 rounded-xl py-2 px-2 flex flex-col items-center justify-center text-white shadow-sm hover:bg-teal-600 transition-colors">
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Income</span>
            <span className="text-[10px] font-black">{planData.currencySymbol}{Math.round(totalSurplus).toLocaleString()}</span>
          </div>
          <div className="flex-[3] bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-800/40 rounded-xl py-2 px-3 border border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Daily Limit</span>
            <span className="text-xs font-black text-gray-900 dark:text-white">{planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Settings Button - Positioned absolutely to prevent parent scaling on click */}
      <button
        title="Modify Financial Plan"
        onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
        className="absolute top-3 right-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
      >
        <Edit3 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-teal-500" />
      </button>
    </div>
  );
};

export default SalaryHomeCard;
