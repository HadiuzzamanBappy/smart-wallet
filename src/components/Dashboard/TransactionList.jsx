import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getRecentTransactions, deleteTransaction } from '../../services/transactionService';
import { getCategoryEmoji } from '../../utils/transactionParser';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { Trash2, Calendar, Tag, DollarSign } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';
import EditParsedModal from './EditParsedModal';
import ConfirmDialog from '../UI/ConfirmDialog';

const TransactionList = ({ onTransactionChange }) => {
  const { user, refreshUserProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState({ open: false, parsed: null });

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await getRecentTransactions(user.uid, 20);
    if (result.success) {
      setTransactions(result.data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDeleteTransaction = async (transactionId, transaction) => {
    // show confirm dialog instead - handled by state in component
    setPendingDelete({ id: transactionId, transaction });
  };

  const [pendingDelete, setPendingDelete] = useState(null);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, transaction } = pendingDelete;
    const result = await deleteTransaction(user.uid, id, transaction);
    if (result.success) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (onTransactionChange) onTransactionChange();
    }
    setPendingDelete(null);
  };

  const cancelDelete = () => setPendingDelete(null);

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  // Pagination
  const ITEMS_PER_PAGE = 5;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const pagedTransactions = filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset to first page whenever the filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Clamp page if filtered results become smaller (e.g., after switching tabs or deletions)
  useEffect(() => {
    const pc = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
    if (page > pc) setPage(pc);
  }, [filteredTransactions.length, page]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Transactions</h2>
        <LoadingSpinner message="Loading transactions..." size="md" />
      </div>
    );
  }

  return (
    <div>
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h2>
        
        {/* Filter Buttons - Responsive */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'income' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'expense' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilter('credit')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'credit' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Credit
          </button>
          <button
            onClick={() => setFilter('loan')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'loan' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Loan
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>No transactions found</p>
          <p className="text-sm mt-2">Start by adding your first transaction using the chat!</p>
        </div>
      ) : (
        <div>
          <div className="space-y-2 sm:space-y-3">
            {pagedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800"
            >
              {/* Mobile Layout - Stacked */}
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="text-xl sm:text-2xl flex-shrink-0">
                  {getCategoryEmoji(transaction.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
                    {transaction.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(transaction.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{transaction.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount and Actions - Mobile responsive */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 mt-2 sm:mt-0">
                <div className="text-left sm:text-right">
                  <p className={`font-semibold text-sm sm:text-base ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {transaction.type}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing({ open: true, parsed: { ...transaction, userId: user?.uid } })} className="p-1.5 sm:p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-xs">Edit</button>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id, transaction)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50">Prev</button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i+1 ? 'bg-teal-600 text-white' : 'bg-gray-50 dark:bg-gray-800'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
      <EditParsedModal open={editing.open} onClose={() => setEditing({ open: false, parsed: null })} originalMessage={editing.parsed?.description} parsed={editing.parsed} onSave={async (updated) => {
        // Update local list
        setTransactions(prev => prev.map(t => t.id === editing.parsed.id ? { ...t, ...updated } : t));
        
        // Refresh user profile to update balance if this was a saved transaction
        if (editing.parsed?.id && user?.uid) {
          try {
            await refreshUserProfile();
          } catch (error) {
            console.error('Error refreshing user profile after transaction update:', error);
          }
        }
        
        setEditing({ open: false, parsed: null });
        if (onTransactionChange) onTransactionChange();

        // Also update shared recent saved list in localStorage if present
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = 'wallet_last_transactions';
            const raw = localStorage.getItem(key);
            let arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) arr = [];
            const newArr = arr.map(a => (a.id === editing.parsed.id || a._id === editing.parsed.id) ? { ...a, ...updated } : a);
            localStorage.setItem(key, JSON.stringify(newArr));
            // notify other components (ChatWidget) about the edit
            try { window.dispatchEvent(new CustomEvent('wallet:transaction-edited', { detail: { transaction: { ...editing.parsed, ...updated } } })); } catch { /* ignore */ }
          }
        } catch (e) {
          console.warn('Failed to update wallet_last_transactions from TransactionList', e);
        }
      }} />
      <ConfirmDialog open={!!pendingDelete} title="Delete transaction" description="This will permanently delete the transaction. This action cannot be undone." onConfirm={confirmDelete} onCancel={cancelDelete} />
    </div>
  );
};

export default TransactionList;