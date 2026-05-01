import React, { useState, useEffect } from 'react';
import { Settings, BarChart2 } from 'lucide-react';
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

  const fetchPlan = async () => {
    if (!userId) {
      setInternalLoading(false);
      return;
    }

    setInternalLoading(true);
    try {
      const plan = await getSalaryPlan(userId);
      setPlanData(plan ? plan.plan : null);
    } catch (e) {
      console.error("Error checking salary plan", e);
    } finally {
      // Guarantee the skeleton shows for at least 500ms during fast cache reads
      // and strictly force it to false to prevent infinite loading
      setTimeout(() => {
        setInternalLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    fetchPlan();

    const handleUpdate = () => fetchPlan();
    window.addEventListener('salary-plan-updated', handleUpdate);
    window.addEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleUpdate);

    return () => {
      window.removeEventListener('salary-plan-updated', handleUpdate);
      window.removeEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleUpdate);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full">
        <BudgetSkeleton />
      </div>
    );
  }

  const hasPlan = !!planData;
  let totalNeeds = 0, totalSavings = 0, needsPct = 0, wantsPct = 0, savePct = 0, dailyLimit = 0;

  if (hasPlan) {
    totalNeeds = planData.totalFixed || 0;
    totalSavings = planData.actualSavings || 0;

    needsPct = Math.round((totalNeeds / planData.totalIncome) * 100) || 0;
    savePct = Math.round((totalSavings / planData.totalIncome) * 100) || 0;
    wantsPct = Math.max(0, 100 - needsPct - savePct);

    const net = planData.netBalance ?? 0;
    dailyLimit = Math.max(0, net) / 30;
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
            title="Open Settings"
            onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
            className="p-2 -m-2 rounded-md hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3 bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 cursor-pointer hover:border-teal-300 dark:hover:border-teal-700 transition-all hover:shadow-md" onClick={() => onOpen('result')}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/30">
            <BarChart2 className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-200">Financial Intelligence</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Smart salary allocation</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            title="Open settings"
            onClick={(e) => { e.stopPropagation(); onOpen('wizard'); }}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-teal-500" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 py-2 px-1 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Needs</span>
          <span className="text-xs font-black text-gray-700 dark:text-gray-300">
            {needsPct}%
          </span>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 py-2 px-1 rounded-xl border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Wants</span>
          <span className="text-xs font-black text-gray-700 dark:text-gray-300">
            {wantsPct}%
          </span>
        </div>
        <div className="flex-1 bg-teal-50 dark:bg-teal-900/20 py-2 px-1 rounded-xl border border-teal-100 dark:border-teal-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-teal-600 dark:text-teal-400 uppercase font-black tracking-widest mb-0.5">Save</span>
          <span className="text-xs font-black text-teal-700 dark:text-teal-300">
            {savePct}%
          </span>
        </div>
      </div>

      <div className="mt-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-800/40 rounded-xl py-2 px-3 border border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Daily Spending Limit</span>
        <span className="text-xs font-black text-gray-900 dark:text-white">{planData.currencySymbol}{Math.round(dailyLimit).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default SalaryHomeCard;
