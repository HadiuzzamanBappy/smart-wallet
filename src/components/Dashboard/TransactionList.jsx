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
import { deleteTransaction, countLinkedRepayments } from '../../services/transactionService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { getCategoryEmoji } from '../../utils/aiTransactionParser';
import EditParsedModal from '../UI/EditParsedModal';
import ConfirmDialog from '../UI/base/ConfirmDialog';
import Modal from '../UI/base/Modal';
import { TransactionListSkeleton } from '../UI/SkeletonLoader';

// Base UI Components
import Button from '../UI/base/Button';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import GlassBadge from '../UI/base/GlassBadge';

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
        <div className="px-5 py-6 space-y-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)] animate-pulse"></span>
              {filteredTransactions.length} of {transactions.length} audit logs
            </div>
          </div>

          {/* Filters Bar - Executive Style */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Audit search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-4 h-9 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-[12px] font-bold tracking-tight text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                size="sm"
                className="!rounded-xl"
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
                className="!rounded-xl"
                options={[
                  { label: 'All Cats', value: 'all' },
                  ...getUniqueCategories().map(c => ({ label: c, value: c }))
                ]}
              />

              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                size="sm"
                className="!rounded-xl"
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
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-center mb-6 opacity-40">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">
                {transactions.length === 0 ? "No Transactions Yet" : "No Matches Found"}
              </p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => {
              const dc = getDisplayCategory(transaction);
              const isPositive = ['income', 'loan', 'collection'].includes(transaction.type);

              return (
                <div key={transaction.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all group border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-5 items-center">
                    {/* Left: Premium Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-center text-xl shadow-sm">
                        <span className="opacity-80 drop-shadow-sm">{getCategoryEmoji(dc)}</span>
                      </div>
                      <div className={`absolute -right-1.5 -bottom-1.5 w-6 h-6 rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-sm ${isPositive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Middle: Executive Typography */}
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-gray-900 dark:text-white truncate mb-2 tracking-tight">{transaction.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10">
                          <span className="text-[10px]">{getCategoryEmoji(dc)}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{dc}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </span>
                        {transaction.source === 'chat' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500/60 shadow-[0_0_8px_rgba(14,165,233,0.3)] animate-pulse" title="AI Audited" />
                        )}
                      </div>
                    </div>

                    {/* Right: Premium Currency & Quick Actions */}
                    <div className="flex flex-col items-end gap-2.5">
                      <div className={`text-sm font-black whitespace-nowrap tracking-tighter ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                        {isPositive ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                      </div>
                      <div className="flex gap-1 sm:gap-1.5 transition-all">
                        {(transaction.type === 'repayment' || transaction.type === 'collection') && (
                          <button
                            onClick={() => { setAdjustmentDetail(transaction); setAdjustmentModalOpen(true); }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {transaction.type !== 'repayment' && transaction.type !== 'collection' && (
                          <button
                            onClick={() => setEditingTransaction(transaction)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrepareDelete(transaction)}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          <div className="py-6 px-5 flex items-center justify-between border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
              Audit Page <span className="text-gray-900 dark:text-white">{page}</span> of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 disabled:opacity-20 hover:bg-white dark:hover:bg-white/10 transition-all"
              >
                Back
              </button>

              <div className="hidden sm:flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${page === i + 1
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                      : 'text-gray-400 dark:text-gray-600 hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 disabled:opacity-20 hover:bg-white dark:hover:bg-white/10 transition-all"
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
            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-2">Net Adjustment</div>
                <div className={`text-3xl font-black tracking-tighter ${adjustmentDetail.type === 'collection' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {adjustmentDetail.type === 'collection' ? '+' : '-'}{formatCurrency(adjustmentDetail.amount, currency)}
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${adjustmentDetail.type === 'repayment' 
                  ? 'bg-rose-500/5 text-rose-600 border-rose-500/10' 
                  : 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10'}`}>
                  {adjustmentDetail.type === 'repayment' ? 'Loan Repay' : 'Credit Collect'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {adjustmentDetail.originalAmount !== undefined && (
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">Original Principal</div>
                  <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(adjustmentDetail.originalAmount, currency)}</div>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">Audit Timestamp</div>
                <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{formatDate(adjustmentDetail.createdAt)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100/50 dark:border-white/5 col-span-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">Reference Entity</div>
                <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">{adjustmentDetail.originalDescription || 'No Reference Found'}</div>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-2.5 px-1">Internal Audit Notes</div>
              <div className="p-5 rounded-2xl bg-gray-100/50 dark:bg-black/20 border border-gray-100 dark:border-white/5 text-[13px] font-bold text-gray-900 dark:text-white leading-relaxed">
                {adjustmentDetail.description || 'No manual notes recorded for this operation.'}
              </div>
            </div>
            
            <Button fullWidth onClick={() => setAdjustmentModalOpen(false)} color="gray" variant="soft">Close Audit</Button>
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