import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Loader2 } from 'lucide-react';
import Modal from './base/Modal';
import { updateTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';

const EditParsedModal = ({ isOpen, onClose, transaction, onSuccess }) => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'food', label: 'Food & Dining', emoji: '🍔' },
    { value: 'transport', label: 'Transportation', emoji: '🚗' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { value: 'bills', label: 'Bills & Utilities', emoji: '📄' },
    { value: 'health', label: 'Healthcare', emoji: '🏥' },
    { value: 'education', label: 'Education', emoji: '📚' },
    { value: 'salary', label: 'Salary', emoji: '💼' },
    { value: 'freelance', label: 'Freelance', emoji: '💻' },
    { value: 'investment', label: 'Investment', emoji: '📈' },
    { value: 'other', label: 'Other', emoji: '📦' }
  ];

  // Update form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditData({
        type: transaction.type || 'expense',
        amount: transaction.amount?.toString() || '',
        description: transaction.description || '',
        category: transaction.category || 'other',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editData.amount || !editData.description || !transaction) return;

    setLoading(true);
    try {
      // Create update data with proper date handling
      const updateData = {
        ...editData,
        amount: Number(editData.amount),
        date: new Date(editData.date), // Convert string to Date object for Firestore
        userId: user.uid,
        updatedAt: new Date() // Add timestamp for when this edit happened
      };

      const result = await updateTransaction(transaction.id, updateData);

      if (result.success) {
        await refreshUserProfile();
        onSuccess?.();
        onClose();
      } else {
        console.error('Transaction update failed:', result.error);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!transaction) return null;

  const formId = 'edit-transaction-form';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Transaction"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 flex items-center justify-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            form={formId}
            disabled={loading || !editData.amount || !editData.description}
            className="flex-1 h-11 flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            Transaction Type
          </label>
          <select
            name="type"
            value={editData.type}
            onChange={handleInputChange}
            className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="credit">Credit Given</option>
            <option value="loan">Loan Taken</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
              Amount (BDT)
            </label>
            <input
              type="number"
              name="amount"
              value={editData.amount}
              onChange={handleInputChange}
              className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={editData.date}
              onChange={handleInputChange}
              className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={editData.description}
            onChange={handleInputChange}
            className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
            placeholder="What was this for?"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            Category
          </label>
          <select
            name="category"
            value={editData.category}
            onChange={handleInputChange}
            className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default EditParsedModal;