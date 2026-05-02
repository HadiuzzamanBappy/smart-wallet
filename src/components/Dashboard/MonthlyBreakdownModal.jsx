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
            <IconBox icon={Calendar} size="lg" colorClass="text-gray-500" bgClass="bg-white/5" className="mb-4 opacity-40" />
            <h3 className="text-sm font-bold text-white/80 mb-1">No transaction history</h3>
            <p className="text-[11px] text-gray-500 font-medium max-w-[200px]">
              We need at least one income or expense entry to generate your monthly report.
            </p>
          </div>
        ) : (
          <>
            {/* Month Selector */}
            <div className="px-1">
              <label className="block text-[11px] font-semibold text-gray-500 mb-2 px-1">Select Reporting Month</label>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconBox icon={Calendar} size="lg" colorClass="text-gray-500" bgClass="bg-white/5" className="mb-4 opacity-40" />
                <h3 className="text-sm font-bold text-white/80 mb-1">No monthly records</h3>
                <p className="text-[11px] text-gray-500 font-medium">No income or expense data found for this period.</p>
              </div>
            ) : (
              <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard border="border-emerald-500/10" padding="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <IconBox icon={TrendingUp} size="sm" colorClass="text-emerald-400" bgClass="bg-emerald-500/10" />
                  <span className="text-[10px] font-semibold text-emerald-400/80">Monthly Income</span>
                </div>
                <div className="text-lg font-bold text-white tracking-tighter">
                  {formatCurrencyWithUser(selectedData.income, userProfile)}
                </div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">
                  {selectedData.incomeCount} transactions
                </div>
              </GlassCard>

              <GlassCard border="border-rose-500/10" padding="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <IconBox icon={TrendingDown} size="sm" colorClass="text-rose-400" bgClass="bg-rose-500/10" />
                  <span className="text-[10px] font-semibold text-rose-400/80">Monthly Expense</span>
                </div>
                <div className="text-lg font-bold text-white tracking-tighter">
                  {formatCurrencyWithUser(selectedData.expense, userProfile)}
                </div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">
                  {selectedData.expenseCount} transactions
                </div>
              </GlassCard>
            </div>

            {/* Net Change */}
            <GlassCard padding="p-3" border="border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Net Balance Shift</span>
                <span className={`text-sm font-bold tracking-tighter ${selectedData.income - selectedData.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedData.income - selectedData.expense >= 0 ? '+' : ''}
                  {formatCurrencyWithUser(selectedData.income - selectedData.expense, userProfile)}
                </span>
              </div>
            </GlassCard>

            {/* Transaction Details */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-gray-500 px-1">Detailed Ledger ({selectedData.transactions.length})</h4>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {selectedData.transactions
                  .filter(tx => tx.type === 'income' || tx.type === 'expense')
                  .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                  .map(tx => (
                    <GlassCard key={tx.id} padding="p-2" border="border-white/5" className="group hover:bg-white/[0.04]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white/90 truncate">
                            {tx.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-gray-500/80">
                              {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                            <span className="text-[10px] font-medium text-gray-500/80">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                        <div className={`text-xs font-bold tracking-tighter whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrencyWithUser(tx.amount, userProfile)}
                        </div>
                      </div>
                    </GlassCard>
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
