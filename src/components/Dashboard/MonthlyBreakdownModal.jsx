import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../UI/base/Modal';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { formatCurrencyWithUser } from '../../utils/helpers';
import { LoadingSpinner } from '../UI/LoadingOverlay';
import { computeTransactionEffects } from '../../utils/transactionHelpers';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Select from '../UI/base/Select';
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';

const MonthlyBreakdownModal = ({ open, onClose }) => {
  const { userProfile } = useAuth();
  const { transactions, salaryPlan, loading } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState('');

  // Group transactions by month (YYYY-MM) and calculate totals
  const monthlyData = useMemo(() => {
    const grouped = {};
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Ensure the current month always exists in the grouped map if we have a salary plan
    if (salaryPlan?.plan) {
      grouped[currentMonthKey] = {
        month: currentMonthKey,
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
        transactions: []
      };
    }

    transactions.forEach(tx => {
      // Inflow includes income, loans, and collections. Outflow includes expenses, credits, and repayments.
      if (!tx || !['income', 'expense', 'loan', 'credit', 'repayment', 'collection'].includes(tx.type)) return;

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

      if (['income', 'loan', 'collection'].includes(tx.type)) {
        grouped[monthKey].income += amount;
        grouped[monthKey].incomeCount++;
      } else if (['expense', 'credit', 'repayment'].includes(tx.type)) {
        grouped[monthKey].expense += amount;
        grouped[monthKey].expenseCount++;
      }

      grouped[monthKey].transactions.push(tx);
    });

    // Check if baseline has already been logged to the database for the current month
    const hasBaselineBeenWritten = transactions.some(tx => {
      if (tx.source !== 'salary-plan-baseline') return false;
      const txDate = new Date(tx.date || tx.createdAt);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    // Inject in-memory baseline plan for the current month if not yet written
    if (!hasBaselineBeenWritten && salaryPlan?.plan) {
      const fixedIncome = salaryPlan.plan.totalIncome || 0;
      const fixedExpense = salaryPlan.plan.totalFixedCosts || 0;

      if (!grouped[currentMonthKey]) {
        grouped[currentMonthKey] = {
          month: currentMonthKey,
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0,
          transactions: []
        };
      }

      grouped[currentMonthKey].income += fixedIncome;
      grouped[currentMonthKey].expense += fixedExpense;
    }

    const getBalanceEffect = (tx) => {
      try {
        const eff = computeTransactionEffects(tx);
        return eff.balance || 0;
      } catch {
        const amount = parseFloat(tx.amount) || 0;
        if (tx.type === 'income') return amount;
        if (tx.type === 'expense') return -amount;
        if (tx.type === 'credit') return -amount;
        if (tx.type === 'loan') return amount;
        if (tx.type === 'repayment') return -amount;
        if (tx.type === 'collection') return amount;
        return -amount;
      }
    };

    // Calculate cash in hand at the end of each month
    const initialCashInHand = parseFloat(salaryPlan?.plan?.cashInHand) || 0;

    Object.keys(grouped).forEach(monthKey => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-indexed
      // End of this month (23:59:59.999)
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      // Sum balance effects of all transactions up to the end of this month
      let cumulativeBalance = 0;
      transactions.forEach(tx => {
        const txDate = new Date(tx.date || tx.createdAt);
        if (txDate <= endOfMonth) {
          cumulativeBalance += getBalanceEffect(tx);
        }
      });

      grouped[monthKey].cashInHandAtEnd = initialCashInHand + cumulativeBalance;
    });

    // Convert to array and sort by month descending
    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions, salaryPlan]);

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
            <IconBox icon={Calendar} size="lg" color="ink" variant="soft" className="mb-6 opacity-40" />
            <h3 className="text-overline mb-2 uppercase">No Reports Available</h3>
            <p className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 max-w-[200px] leading-relaxed">
              Generate transactions to activate your intelligence suite.
            </p>
          </div>
        ) : (
          <>
            {/* Month Selector */}
            <div className="px-1">
              <label className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 mb-2.5 px-1 block uppercase">Select Reporting Period</label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="!rounded-2xl"
                options={monthlyData.map(m => ({
                  value: m.month,
                  label: formatMonthLabel(m.month)
                }))}
              />
            </div>

            {!selectedData ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <IconBox icon={Calendar} size="lg" color="ink" variant="soft" className="mb-6 opacity-40" />
                <h3 className="text-overline uppercase">No Records Found</h3>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Summary Cards */}
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard padding="p-4" className="!bg-primary-500/5 dark:!bg-primary-500/[0.02] !border-primary-500/10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <IconBox icon={TrendingUp} size="xs" color="primary" variant="soft" />
                      <span className="text-overline text-primary-600 dark:text-primary-400 uppercase">Inflow</span>
                    </div>
                    <div className="text-h4 text-stone-800 dark:text-stone-200 mb-2">
                      {formatCurrencyWithUser(selectedData.income, userProfile)}
                    </div>
                    <div className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 opacity-60 leading-none">
                      {selectedData.incomeCount} Audit Logs
                    </div>
                  </GlassCard>

                  <GlassCard padding="p-4" className="!bg-error-500/5 dark:!bg-error-500/[0.02] !border-error-500/10">
                    <div className="flex items-center gap-2.5 mb-3">
                      <IconBox icon={TrendingDown} size="xs" color="error" variant="soft" />
                      <span className="text-overline text-error-600 dark:text-error-400 uppercase">Outflow</span>
                    </div>
                    <div className="text-h4 text-stone-800 dark:text-stone-200 mb-2">
                      {formatCurrencyWithUser(selectedData.expense, userProfile)}
                    </div>
                    <div className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 opacity-60 leading-none">
                      {selectedData.expenseCount} Audit Logs
                    </div>
                  </GlassCard>
                </div>

                {/* Net Change & Month End Cash in Hand */}
                <div className="space-y-3">
                  <div className="p-4 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 uppercase">Net Surplus / Deficit</span>
                    <Badge
                      color={selectedData.income - selectedData.expense >= 0 ? 'success' : 'error'}
                      variant="soft"
                      size="md"
                    >
                      {selectedData.income - selectedData.expense >= 0 ? '+' : ''}
                      {formatCurrencyWithUser(selectedData.income - selectedData.expense, userProfile)}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 uppercase">Cash in Hand (Month End)</span>
                    <Badge
                      color={selectedData.cashInHandAtEnd >= 0 ? 'primary' : 'error'}
                      variant="filled"
                      size="md"
                    >
                      {formatCurrencyWithUser(selectedData.cashInHandAtEnd, userProfile)}
                    </Badge>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <h4 className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 px-1 uppercase">Detailed Ledger ({selectedData.transactions.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedData.transactions
                      .filter(tx => ['income', 'expense', 'loan', 'credit', 'repayment', 'collection'].includes(tx.type))
                      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                      .map(tx => {
                        const isInflow = ['income', 'loan', 'collection'].includes(tx.type);
                        return (
                          <div key={tx.id} className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:bg-stone-800 transition-all group">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-label text-stone-800 dark:text-stone-200 truncate mb-1">
                                  {tx.description}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 opacity-60">
                                    {new Date(tx.date || tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="w-1 h-1 rounded-full bg-stone-200 dark:bg-stone-700" />
                                  <span className="text-overline text-stone-600 dark:text-stone-500 dark:text-stone-400 opacity-60">
                                    {tx.category}
                                  </span>
                                </div>
                              </div>
                              <div className={`text-label whitespace-nowrap ${isInflow ? 'text-primary-600 dark:text-primary-400' : 'text-stone-800 dark:text-stone-200'}`}>
                                {isInflow ? '+' : '-'}{formatCurrencyWithUser(tx.amount, userProfile)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
