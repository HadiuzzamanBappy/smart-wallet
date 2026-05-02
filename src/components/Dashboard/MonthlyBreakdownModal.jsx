import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../UI/base/Modal';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrencyWithUser } from '../../utils/helpers';
import LoadingSpinner from '../UI/LoadingSpinner';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Select from '../UI/base/Select';
import GlassBadge from '../UI/base/GlassBadge';
import IconBox from '../UI/base/IconBox';

const MonthlyBreakdownModal = ({ open, onClose }) => {
  const { userProfile } = useAuth();
  const { transactions, loading } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState('');

  // Group transactions by month (YYYY-MM) and calculate totals
  const monthlyData = useMemo(() => {
    const grouped = {};

    transactions.forEach(tx => {
      // Only include pure income/expense transactions in the monthly breakdown.
      // Repayments/collections have their own types and should not affect income/expense totals.
      if (!tx || (tx.type !== 'income' && tx.type !== 'expense')) return;

      // Use transaction.date for monthly grouping
      const txDate = new Date(tx.date || tx.createdAt);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0,
          transactions: []
        };
      }

      const amount = parseFloat(tx.amount) || 0;

      if (tx.type === 'income') {
        grouped[monthKey].income += amount;
        grouped[monthKey].incomeCount++;
      } else if (tx.type === 'expense') {
        grouped[monthKey].expense += amount;
        grouped[monthKey].expenseCount++;
      }

      grouped[monthKey].transactions.push(tx);
    });

    // Convert to array and sort by month descending
    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  // Set current month as default selection when modal opens
  useEffect(() => {
    if (open && monthlyData.length > 0 && !selectedMonth) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(currentMonth);
    }
  }, [open, monthlyData, selectedMonth]);

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const selectedData = monthlyData.find(m => m.month === selectedMonth) || null;

  return (
    <Modal isOpen={open} onClose={onClose} title="Monthly Breakdown">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-center mb-6 opacity-40">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 mb-2">No Reports Available</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400/60 max-w-[200px] leading-relaxed">
              Generate transactions to activate your intelligence suite.
            </p>
          </div>
        ) : (
          <>
            {/* Month Selector */}
            <div className="px-1">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 px-1">Select Reporting Period</label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={monthlyData.map(m => ({
                  value: m.month,
                  label: formatMonthLabel(m.month)
                }))}
              />
            </div>

            {!selectedData ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-center mb-6 opacity-40">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">No Records Found</h3>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Total Inflow</span>
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                      {formatCurrencyWithUser(selectedData.income, userProfile)}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-2">
                      {selectedData.incomeCount} Logs
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/[0.02] border border-rose-500/10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Total Outflow</span>
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                      {formatCurrencyWithUser(selectedData.expense, userProfile)}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-2">
                      {selectedData.expenseCount} Logs
                    </div>
                  </div>
                </div>

                {/* Net Change */}
                <div className="p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Net Surplus / Deficit</span>
                  <div className={`px-3 py-1 rounded-lg text-sm font-black tracking-tighter border ${selectedData.income - selectedData.expense >= 0 
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                    {selectedData.income - selectedData.expense >= 0 ? '+' : ''}
                    {formatCurrencyWithUser(selectedData.income - selectedData.expense, userProfile)}
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 px-1">Detailed Ledger ({selectedData.transactions.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedData.transactions
                      .filter(tx => tx.type === 'income' || tx.type === 'expense')
                      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                      .map(tx => (
                        <div key={tx.id} className="p-4 rounded-xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.04] transition-all group">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black text-gray-900 dark:text-white truncate tracking-tight">
                                {tx.description}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                                  {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                                  {tx.category}
                                </span>
                              </div>
                            </div>
                            <div className={`text-sm font-black tracking-tighter whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrencyWithUser(tx.amount, userProfile)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default MonthlyBreakdownModal;
