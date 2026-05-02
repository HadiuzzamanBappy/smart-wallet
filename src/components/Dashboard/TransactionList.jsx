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

  const getCategoryBadgeColor = (category) => {
    const map = {
      food: 'orange',
      transport: 'blue',
      shopping: 'rose',
      entertainment: 'purple',
      health: 'rose',
      utilities: 'amber',
      salary: 'emerald',
      freelance: 'teal',
      investment: 'cyan',
      gift: 'orange',
      loan: 'rose',
      credit: 'emerald',
      other: 'gray'
    };
    return map[category?.toLowerCase()] || 'gray';
  };

  if (transactionLoading) {
    return <TransactionListSkeleton />;
  }

  return (
    <>
      <div>
        <div className="px-4 py-4 space-y-4 border-b border-white/10 pb-6 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-2">
            <GlassInput
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon={Search}
              className="flex-1"
            />

            <div className="grid grid-cols-3 gap-2">
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
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
                options={[
                  { label: 'All Categories', value: 'all' },
                  ...getUniqueCategories().map(c => ({ label: c, value: c }))
                ]}
              />

              <Select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                options={[
                  { label: 'All Time', value: 'all' },
                  { label: '7 days', value: '7' },
                  { label: '30 days', value: '30' },
                  { label: '3 months', value: '90' },
                  { label: '1 year', value: '365' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-0 px-0">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center opacity-60">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-[11px] font-semibold text-gray-500">
                {transactions.length === 0
                  ? "No transactions yet"
                  : "No matches found"
                }
              </p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => {
              const dc = getDisplayCategory(transaction);
              const isPositive = ['income', 'loan', 'collection'].includes(transaction.type);

              return (
                <div key={transaction.id} className="px-4 py-3 hover:bg-white/[0.02] transition-all border-b border-white/5 last:border-0 group">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                    {/* Left: avatar with trend overlay */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl">
                        <span className="opacity-80">{getCategoryEmoji(dc)}</span>
                      </div>
                      <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-[#0f172a] ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Middle: Content */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/90 truncate mb-1.5">{transaction.description}</p>
                      <div className="flex items-center gap-3">
                        <GlassBadge color={getCategoryBadgeColor(dc)}>
                          <span>{getCategoryEmoji(dc)}</span>
                          <span>{dc}</span>
                        </GlassBadge>
                        <span className="text-[11px] font-medium text-gray-500/80">
                          {formatDate(transaction.createdAt)}
                        </span>
                        {transaction.source === 'chat' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.2)]" title="AI Parsed" />
                        )}
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-sm font-semibold whitespace-nowrap tracking-tighter ${isPositive ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                        {isPositive ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                      </div>
                      <div className="flex gap-1 transition-opacity">
                        {(transaction.type === 'repayment' || transaction.type === 'collection') && (
                          <Button
                            variant="icon"
                            size="xsm"
                            color="gray"
                            onClick={() => { setAdjustmentDetail(transaction); setAdjustmentModalOpen(true); }}
                            icon={Eye}
                            title="View details"
                          />
                        )}
                        {transaction.type !== 'repayment' && transaction.type !== 'collection' && (
                          <Button
                            variant="icon"
                            size="xsm"
                            color="teal"
                            onClick={() => setEditingTransaction(transaction)}
                            icon={Edit3}
                            title="Edit"
                          />
                        )}
                        <Button
                          variant="icon"
                          size="xsm"
                          color="red"
                          onClick={() => handlePrepareDelete(transaction)}
                          icon={Trash2}
                          title="Delete"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > PAGE_SIZE && (
          <div className="py-4 px-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Page {page} <span className="hidden sm:inline">of {totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Prev
              </button>

              {/* Desktop Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-all ${page === i + 1
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!adjustmentModalOpen}
        onClose={() => { setAdjustmentModalOpen(false); setAdjustmentDetail(null); }}
        title="Adjustment Details"
        size="md"
      >
        {adjustmentDetail ? (
          <div className="text-gray-800 dark:text-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Adjustment</div>
                <div className="mt-1 text-2xl font-semibold flex items-center">
                  <span className={`${adjustmentDetail.type === 'collection' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {adjustmentDetail.type === 'collection' ? '+' : '-'}{formatCurrency(adjustmentDetail.amount, currency)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium capitalize">
                  {adjustmentDetail.type === 'repayment' ? 'Loan Repayment' : 'Credit Collection'}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {adjustmentDetail.originalAmount !== undefined && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">Original Amount</div>
                  <div className="mt-1 font-medium">{formatCurrency(adjustmentDetail.originalAmount, currency)}</div>
                </div>
              )}
              {adjustmentDetail.linkedTransactionId && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-xs text-gray-500">Linked To</div>
                  <div className="mt-1 font-medium">{adjustmentDetail.type === 'repayment' ? 'Loan' : 'Credit'} ({adjustmentDetail.linkedTransactionId})</div>
                </div>
              )}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded col-span-1 sm:col-span-2">
                <div className="text-xs text-gray-500">Original Description</div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">{adjustmentDetail.originalDescription || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded col-span-1 sm:col-span-2">
                <div className="text-xs text-gray-500">Recorded At</div>
                <div className="mt-1 font-medium">{formatDate(adjustmentDetail.createdAt)}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Notes</div>
              <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">{adjustmentDetail.description || '—'}</div>
            </div>

            {/* Footer intentionally removed for adjustment details modal — read-only view */}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No details available.</div>
        )}
      </Modal>
      <EditParsedModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={
          preparingDelete
            ? 'Checking for linked repayments...'
            : linkedCount > 0
              ? `Deleting "${deletingTransaction?.description}" will also delete ${linkedCount} linked repayment${linkedCount > 1 ? 's' : ''}. This cannot be undone. Continue?`
              : `Are you sure you want to delete "${deletingTransaction?.description}"? This action cannot be undone.`
        }
        confirmText="Delete"
        type="danger"
        loading={preparingDelete}
      />
    </>
  );
};

export default TransactionList;