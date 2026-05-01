import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../UI/base/Modal';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrencyWithUser } from '../../utils/helpers';
import LoadingSpinner from '../UI/LoadingSpinner';

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
        {/* Month Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
          >
            {monthlyData.map(m => (
              <option key={m.month} value={m.month}>
                {formatMonthLabel(m.month)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !selectedData ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No data for selected month</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Income</span>
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrencyWithUser(selectedData.income, userProfile)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedData.incomeCount} transaction{selectedData.incomeCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Expense</span>
                </div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {formatCurrencyWithUser(selectedData.expense, userProfile)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedData.expenseCount} transaction{selectedData.expenseCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Net Change */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Change</span>
                <span className={`text-lg font-semibold ${selectedData.income - selectedData.expense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedData.income - selectedData.expense >= 0 ? '+' : ''}
                  {formatCurrencyWithUser(selectedData.income - selectedData.expense, userProfile)}
                </span>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Transactions ({selectedData.transactions.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedData.transactions
                  .filter(tx => tx.type === 'income' || tx.type === 'expense')
                  .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                  .map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {tx.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {tx.category}
                        </div>
                      </div>
                      <div className={`font-semibold ml-2 whitespace-nowrap ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrencyWithUser(tx.amount, userProfile)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MonthlyBreakdownModal;
