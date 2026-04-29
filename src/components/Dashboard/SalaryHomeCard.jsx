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
      className="bg-gray-800/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 mb-6 hover:bg-gray-800/60 transition-all cursor-pointer group shadow-xl shadow-black/20"
      onClick={onOpen}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 flex items-center justify-center shrink-0 border border-teal-500/20 group-hover:scale-105 transition-transform">
            <BarChart2 className="w-5 h-5 text-teal-400" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Salary Manager</h3>
              {hasPlan && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {hasPlan ? 'Financial limits active' : 'Set your smart budget'}
            </p>
          </div>
        </div>
        
        {hasPlan ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* Needs Badge */}
            <div className="flex items-center bg-gray-900/60 rounded-full px-3 py-1.5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-1 h-1 rounded-full bg-blue-500 mr-2 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-2">Needs</span>
              <span className="text-xs text-white font-black">{planData.currency?.split(' ')[0]}{Math.round(planData.needsBudget/1000)}k</span>
            </div>
            
            {/* Wants Badge */}
            <div className="flex items-center bg-gray-900/60 rounded-full px-3 py-1.5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-1 h-1 rounded-full bg-purple-500 mr-2 shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-2">Wants</span>
              <span className="text-xs text-white font-black">{planData.currency?.split(' ')[0]}{Math.round(planData.wantsBudget/1000)}k</span>
            </div>
            
            {/* Savings Badge */}
            <div className="flex items-center bg-teal-500/10 rounded-full px-3 py-1.5 border border-teal-500/20 hover:border-teal-500/30 transition-colors">
              <div className="w-1 h-1 rounded-full bg-teal-400 mr-2 shadow-[0_0_5px_rgba(45,212,191,0.5)]" />
              <span className="text-[10px] text-teal-500/70 font-bold uppercase tracking-wider mr-2">Save</span>
              <span className="text-xs text-teal-400 font-black">{planData.currency?.split(' ')[0]}{Math.round(planData.savingsTarget/1000)}k</span>
            </div>

            <div className="ml-1 p-1.5 rounded-lg bg-gray-700/0 group-hover:bg-gray-700/50 transition-all text-gray-500 group-hover:text-white">
              <Settings className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="bg-teal-500 text-white p-2 rounded-xl shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryHomeCard;
