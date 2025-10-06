import React, { useState, useEffect } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import Modal from '../UI/Modal';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            name="type"
            value={editData.type}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="credit">Credit Given</option>
            <option value="loan">Loan Taken</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (BDT)
            </label>
            <input
              type="number"
              name="amount"
              value={editData.amount}
              onChange={handleInputChange}
              className="input-field"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={editData.date}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            name="description"
            value={editData.description}
            onChange={handleInputChange}
            className="input-field"
            placeholder="What was this transaction for?"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            name="category"
            value={editData.category}
            onChange={handleInputChange}
            className="input-field"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Original Message (if from chat) */}
        {transaction.originalMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Original Message:
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              "{transaction.originalMessage}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={loading || !editData.amount || !editData.description}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditParsedModal;