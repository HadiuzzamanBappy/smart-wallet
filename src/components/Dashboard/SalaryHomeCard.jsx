import React, { useState, useEffect } from 'react';
import { ArrowRight, Settings, BarChart2 } from 'lucide-react';
import { getSalaryPlan } from '../../services/salaryService';

const SalaryHomeCard = ({ userId, onOpen }) => {
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPlan = async () => {
      if (!userId) return;
      try {
        const plan = await getSalaryPlan(userId);
        setHasPlan(!!plan);
      } catch (e) {
        console.error("Error checking salary plan", e);
      } finally {
        setLoading(false);
      }
    };
    checkPlan();
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

  return (
    <div 
      className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 mb-6 hover:bg-gray-750 transition-colors cursor-pointer flex items-center justify-between group"
      onClick={onOpen}
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-teal-500" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-white">Salary Manager</h3>
            {hasPlan && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-teal-500/20 text-teal-400 rounded-full uppercase tracking-wider">
                Plan Active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {hasPlan ? 'Review your financial plan & advice' : 'AI-powered budget planning & savings guide'}
          </p>
        </div>
      </div>
      <div>
        {hasPlan ? (
          <Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        ) : (
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        )}
      </div>
    </div>
  );
};

export default SalaryHomeCard;
