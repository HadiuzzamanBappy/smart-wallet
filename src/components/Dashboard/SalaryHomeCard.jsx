import React, { useState, useEffect } from 'react';
import { ArrowRight, Settings, BarChart2 } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';

const SalaryHomeCard = ({ userId, onOpen }) => {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    if (!userId) return;
    try {
      const plan = await getSalaryPlan(userId);
      setPlanData(plan ? plan.plan : null);
    } catch (e) {
      console.error("Error checking salary plan", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();

    const handleUpdate = () => fetchPlan();
    window.addEventListener('salary-plan-updated', handleUpdate);
    return () => window.removeEventListener('salary-plan-updated', handleUpdate);
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 mb-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasPlan = !!planData;

  return (
    <div 
      className="bg-gray-800 rounded-xl border border-gray-700/50 p-4 mb-6 hover:bg-gray-750 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">Salary Manager</h3>
              {hasPlan && (
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              )}
            </div>
            {!hasPlan && <p className="text-xs text-gray-400">Set your financial limits</p>}
          </div>
        </div>
        
        {hasPlan ? (
          <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>Needs: <span className="text-gray-200">{planData.currency?.split(' ')[0]}{Math.round(planData.needsBudget/1000)}k</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>Wants: <span className="text-gray-200">{planData.currency?.split(' ')[0]}{Math.round(planData.wantsBudget/1000)}k</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-teal-500/50" />
              <span className="text-teal-500/90">Save: <span>{planData.currency?.split(' ')[0]}{Math.round(planData.savingsTarget/1000)}k</span></span>
            </div>
            <Settings className="w-3.5 h-3.5 ml-1 text-gray-500 group-hover:text-white transition-colors" />
          </div>
        ) : (
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        )}
      </div>
    </div>
  );
};

export default SalaryHomeCard;
