import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Trash2,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { deleteTransaction, countLinkedRepayments } from '../../services/transactionService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { getCategoryEmoji, getCategoryColor } from '../../utils/aiTransactionParser';
import EditParsedModal from '../UI/EditParsedModal';
import ConfirmDialog from '../UI/ConfirmDialog';
import Modal from '../UI/base/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';
import { TransactionListSkeleton } from '../UI/SkeletonLoader';

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

  const getAmountColor = (type) => {
    switch (type) {
      case 'income':
      case 'loan':
      case 'collection':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
      case 'credit':
      case 'repayment':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getDisplayCategory = (transaction) => transaction.category;
  const getDisplayCategoryLabel = (transaction) => {
    return transaction.category;
  };

  if (transactionLoading) {
    return <TransactionListSkeleton />;
  }

  return (
    <>
      <div>
        <div className="px-4 border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search - Full width on all screens */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter dropdowns - Single row on mobile, grid on larger screens */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent text-xs sm:text-sm truncate"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="credit">Credit</option>
                <option value="loan">Loan</option>
                <option value="repayment">Repayment</option>
                <option value="collection">Collection</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent text-xs sm:text-sm truncate"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>
                    {getCategoryEmoji(category)} {category}
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent text-xs sm:text-sm truncate"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <Filter className="w-12 h-12 mx-auto mb-4" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {transactions.length === 0
                  ? "No transactions yet. Add your first transaction to get started!"
                  : "No transactions match your current filters."
                }
              </p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => {
              const dc = getDisplayCategory(transaction);
              const dcl = getDisplayCategoryLabel(transaction);
              return (
                <div key={transaction.id} className="px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150 border-b border-gray-100 dark:border-gray-700/30 last:border-0">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start sm:items-center">
                    {/* Left: avatar with soft bg and small status indicator */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
                        {getCategoryEmoji(dc)}
                      </div>
                      {/* small status badge (up/down) */}
                      <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${['income', 'loan', 'collection'].includes(transaction.type) ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'}`}>
                        {['income', 'loan', 'collection'].includes(transaction.type) ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    {/* Middle: description, date, badges */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{transaction.description}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getCategoryColor(dc)}`}>{dcl}</span>
                            <span>{formatDate(transaction.createdAt)}</span>
                            <span className="hidden sm:inline">• {transaction.type}</span>
                            {transaction.source === 'chat' && (<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">AI</span>)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: amount and CTA (single row on desktop, stacked on mobile) */}
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className={`text-sm font-semibold whitespace-nowrap ${getAmountColor(transaction.type)}`}>{['income', 'loan', 'collection'].includes(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount, currency)}</div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {(transaction.type === 'repayment' || transaction.type === 'collection') && (
                          <button type="button" onClick={() => { setAdjustmentDetail(transaction); setAdjustmentModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="View details"><Eye className="w-4 h-4" /></button>
                        )}
                        {transaction.type !== 'repayment' && transaction.type !== 'collection' && (
                          <button onClick={() => setEditingTransaction(transaction)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handlePrepareDelete(transaction)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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