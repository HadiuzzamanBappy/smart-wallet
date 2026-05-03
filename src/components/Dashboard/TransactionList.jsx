import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Trash2,
  Filter,
  TrendingUp,
  TrendingDown,
  Search,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { deleteTransaction } from '../../services/transactionService';
import { countLinkedRepayments } from '../../services/debtService';
import { formatCurrency, formatDate, getCategoryEmoji } from '../../utils/helpers';
import EditParsedModal from '../UI/EditParsedModal';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import Modal from '../UI/base/Modal';
import { TransactionListSkeleton } from '../UI/SkeletonLoader';

// Base UI Components
import { THEME } from '../../config/theme';
import Button from '../UI/base/Button';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import Badge from '../UI/base/Badge';
import GlassCard from '../UI/base/GlassCard';

const TransactionList = ({ onTransactionChange }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const {
    transactions,
    loading: transactionLoading,
    refreshTransactions,
    removeTransaction
  } = useTransactions();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [linkedCount, setLinkedCount] = useState(0);
  const [preparingDelete, setPreparingDelete] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentDetail, setAdjustmentDetail] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    dateRange: '30' // days
  });

  // Pagination
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  const currency = userProfile?.currency || 'BDT';

  // Transactions are now managed by TransactionContext

  const handleDelete = async () => {
    if (!deletingTransaction) return;

    const targetId = deletingTransaction.id;
    const backupTx = { ...deletingTransaction };

    // We don't removeTransaction instantly anymore to ensure dialog shows loading
    // instead of disappearing instantly.

    setPreparingDelete(true); // Reuse preparingDelete for the actual deletion loading state

    try {
      // 3. Persistent deletion
      const result = await deleteTransaction(user.uid, targetId, backupTx);
      if (result.success) {
        // Now we can remove from UI
        removeTransaction(targetId);

        // Silent refresh of other data (like balance)
        await refreshUserProfile();
        await refreshTransactions(true);
        onTransactionChange?.();

        // Finally close dialog
        setDeletingTransaction(null);
        setLinkedCount(0);
      } else {
        console.error('Delete failed:', result.error);
        // Error handling: keep dialog open or show error
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setPreparingDelete(false);
    }
  };

  const handlePrepareDelete = async (transaction) => {
    // 1. Open dialog instantly
    setDeletingTransaction(transaction);
    setLinkedCount(0);

    if (!user || !user.uid) return;

    // 2. Perform background check while dialog is already visible
    setPreparingDelete(true);
    try {
      const res = await countLinkedRepayments(user.uid, transaction.id);
      if (res && res.success) setLinkedCount(res.count || 0);
    } catch (err) {
      console.warn('Failed to count linked repayments before delete:', err?.message || err);
    } finally {
      setPreparingDelete(false);
    }
  };

  const handleEditSuccess = async () => {
    await refreshUserProfile();
    await refreshTransactions(true); // silent refresh
    onTransactionChange?.();
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!transaction.description.toLowerCase().includes(searchTerm) &&
        !transaction.category.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    // Type filter
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }

    // Category filter
    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }

    // Date range filter (based on creation time)
    if (filters.dateRange !== 'all') {
      const daysAgo = parseInt(filters.dateRange);
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - daysAgo);
      const createdDate = new Date(transaction.createdAt);
      if (createdDate < filterDate) {
        return false;
      }
    }

    return true;
  });

  // Reset page when filters change or transactions update
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.type, filters.category, filters.dateRange, transactions.length]);

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getUniqueCategories = () => {
    const categories = [...new Set(transactions.map(t => t.category))];
    return categories.sort();
  };

  const getDisplayCategory = (transaction) => {
    if (transaction.type === 'repayment') return 'other';
    if (transaction.type === 'collection') return 'other';
    return transaction.category || 'other';
  };


  if (transactionLoading) {
    return <TransactionListSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-4 py-4 space-y-3 border-b border-paper-100 dark:border-white/5 bg-paper-100/10 dark:bg-white/[0.01]">
          {/* Filters Bar - Executive Style Compact */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400" />
              <input
                type="text"
                placeholder="Audit search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-4 h-8 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 text-[9px] font-black uppercase tracking-widest text-ink-900 dark:text-paper-50 placeholder:text-ink-400 dark:placeholder:text-paper-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                size="sm"
                className="!h-8 !text-[9px] !rounded-xl"
                options={[
                  { label: 'All Types', value: 'all' },
                  { label: 'Income', value: 'income' },
                  { label: 'Expense', value: 'expense' },
                  { label: 'Credit', value: 'credit' },
                  { label: 'Loan', value: 'loan' },
                  { label: 'Repayment', value: 'repayment' },
                  { label: 'Collection', value: 'collection' }
                ]}
              />

              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                size="sm"
                className="!h-8 !text-[9px] !rounded-xl"
                options={[
                  { label: 'All Cats', value: 'all' },
                  ...getUniqueCategories().map(c => ({ label: c, value: c }))
                ]}
              />

              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                size="sm"
                className="!h-8 !text-[9px] !rounded-xl"
                options={[
                  { label: 'All Time', value: 'all' },
                  { label: '7 days', value: '7' },
                  { label: '30 days', value: '30' },
                  { label: '90 days', value: '90' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-3xl bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 flex items-center justify-center mb-6 opacity-40">
                <Filter className="w-8 h-8 text-ink-400" />
              </div>
              <p className="text-label text-ink-400 dark:text-paper-700">
                {transactions.length === 0 ? "No Transactions Yet" : "No Matches Found"}
              </p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => {
              const dc = getDisplayCategory(transaction);
              const isPositive = ['income', 'loan', 'collection'].includes(transaction.type);

              return (
                <div key={transaction.id} className="px-4 py-3 hover:bg-paper-100/30 dark:hover:bg-white/[0.02] transition-all group border-b border-paper-100 dark:border-white/5 last:border-0">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                    {/* Left: Premium Avatar Compact */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 flex items-center justify-center text-lg shadow-sm">
                        <span className="opacity-80 drop-shadow-sm">{getCategoryEmoji(dc)}</span>
                      </div>
                      <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-2xl flex items-center justify-center border-2 border-surface-card dark:border-surface-card-dark shadow-sm ${isPositive ? 'bg-success-500 text-white' : 'bg-error-500 text-white'}`}>
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      </div>
                    </div>

                    {/* Middle: Executive Typography */}
                    <div className="min-w-0">
                      <p className="text-label font-bold text-ink-900 dark:text-paper-50 truncate mb-1 tracking-tight">{transaction.description}</p>
                      <div className="flex items-center gap-3">
                        <Badge color="primary" variant="soft" size="sm" className="bg-paper-100/50 dark:bg-white/5 h-4 !px-1.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-ink-400 dark:text-paper-700">{dc}</span>
                        </Badge>
                        <span className="text-[9px] font-bold text-ink-400 dark:text-paper-700">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Premium Currency & Quick Actions */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`text-label font-black whitespace-nowrap tracking-tight ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-ink-900 dark:text-paper-50'}`}>
                        {isPositive ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                      </div>
                      <div className="flex gap-1 transition-all">
                        {(transaction.type === 'repayment' || transaction.type === 'collection') && (
                          <button
                            onClick={() => { setAdjustmentDetail(transaction); setAdjustmentModalOpen(true); }}
                            className="p-1 hover:bg-paper-100 dark:hover:bg-white/10 rounded-xl text-ink-400 hover:text-ink-900 dark:hover:text-white transition-all border border-transparent"
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        {transaction.type !== 'repayment' && transaction.type !== 'collection' && (
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="p-1 hover:bg-warning-500/10 rounded-xl text-warning-500 hover:text-warning-600 dark:hover:text-warning-400 transition-all border border-transparent"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrepareDelete(transaction)}
                          className="p-1 hover:bg-error-500/10 rounded-xl text-ink-400 hover:text-error-600 transition-all border border-transparent"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls - Executive Density */}
        {filteredTransactions.length > PAGE_SIZE && (
          <div className="py-6 px-5 flex items-center justify-between border-t border-paper-100 dark:border-white/5 bg-paper-100/30 dark:bg-white/[0.01]">
            <div className="text-label text-ink-400 dark:text-paper-700">
              Page <span className="text-ink-900 dark:text-paper-50">{page}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-2xl border border-paper-200/50 dark:border-white/10 text-label text-ink-400 dark:text-paper-700 disabled:opacity-20 hover:bg-surface-card dark:hover:bg-white/10 transition-all`}
              >
                Back
              </button>

              <div className="hidden sm:flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-2xl text-overline transition-all ${page === i + 1
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                      : 'text-ink-400 dark:text-paper-700 hover:bg-surface-card dark:hover:bg-white/10 hover:text-ink-900 dark:hover:text-white'
                      }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-2xl border border-paper-200/50 dark:border-white/10 text-label text-ink-400 dark:text-paper-700 disabled:opacity-20 hover:bg-surface-card dark:hover:bg-white/10 transition-all`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment Modal - Executive Details */}
      <Modal
        isOpen={!!adjustmentModalOpen}
        onClose={() => { setAdjustmentModalOpen(false); setAdjustmentDetail(null); }}
        title="Audit Adjustment"
        size="md"
      >
        {adjustmentDetail ? (
          <div className="space-y-6">
            <GlassCard padding="p-5" className="flex items-center justify-between gap-4 !bg-paper-100/30 dark:!bg-white/[0.02]">
              <div>
                <div className="text-overline text-ink-400 dark:text-paper-700 mb-2">Net Adjustment</div>
                <div className={`text-h2 font-black tracking-tighter ${adjustmentDetail.type === 'collection' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                  {adjustmentDetail.type === 'collection' ? '+' : '-'}{formatCurrency(adjustmentDetail.amount, currency)}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  color={adjustmentDetail.type === 'repayment' ? 'error' : 'success'}
                  variant="soft"
                >
                  {adjustmentDetail.type === 'repayment' ? 'Loan Repay' : 'Credit Collect'}
                </Badge>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              {adjustmentDetail.originalAmount !== undefined && (
                <GlassCard padding="p-4" className="!bg-paper-100/30 dark:!bg-white/[0.02]">
                  <div className="text-overline text-ink-400 dark:text-paper-700 mb-2">Original Principal</div>
                  <div className="text-body font-black text-ink-900 dark:text-paper-50 tracking-tight">{formatCurrency(adjustmentDetail.originalAmount, currency)}</div>
                </GlassCard>
              )}
              <GlassCard padding="p-4" className="!bg-paper-100/30 dark:!bg-white/[0.02]">
                <div className="text-overline text-ink-400 dark:text-paper-700 mb-2">Audit Timestamp</div>
                <div className="text-body font-black text-ink-900 dark:text-paper-50 tracking-tight">{formatDate(adjustmentDetail.createdAt)}</div>
              </GlassCard>
              <GlassCard padding="p-4" className="!bg-paper-100/30 dark:!bg-white/[0.02] col-span-2">
                <div className="text-overline text-ink-400 dark:text-paper-700 mb-2">Reference Entity</div>
                <div className="text-body font-black text-ink-900 dark:text-paper-50 tracking-tight truncate">{adjustmentDetail.originalDescription || 'No Reference Found'}</div>
              </GlassCard>
            </div>

            <div>
              <div className="text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">Internal Audit Notes</div>
              <GlassCard padding="p-5" className="!bg-paper-100/30 dark:!bg-black/20 text-body font-bold text-ink-900 dark:text-paper-50 leading-relaxed">
                {adjustmentDetail.description || 'No manual notes recorded for this operation.'}
              </GlassCard>
            </div>

            <Button fullWidth onClick={() => setAdjustmentModalOpen(false)} color="ink" variant="soft">Close Audit</Button>
          </div>
        ) : (
          <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Audit Data Unavailable</div>
        )}
      </Modal>

      <EditParsedModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={
          preparingDelete
            ? 'Accessing audit logs...'
            : linkedCount > 0
              ? `Purging "${deletingTransaction?.description}" will also cascade to ${linkedCount} linked operation${linkedCount > 1 ? 's' : ''}. This operation is final. Proceed?`
              : `Are you sure you want to purge "${deletingTransaction?.description}"? This operation cannot be reversed.`
        }
        confirmText="Confirm Purge"
        type="danger"
        loading={preparingDelete}
      />
    </>
  );
};

export default TransactionList;