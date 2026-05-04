import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Loader2 } from 'lucide-react';
import Modal from './base/Modal';
import { updateTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';

// Base UI Components
import Button from './base/Button';
import GlassInput from './base/GlassInput';
import Select from './base/Select';
import IconBox from './base/IconBox';

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
      title="Modify Entry"
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="ghost"
            color="ink"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            form={formId}
            loading={loading}
            disabled={!editData.amount || !editData.description}
            icon={Save}
          >
            Save
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4 px-1">
        {/* Type & Category Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-overline px-1 opacity-50 block">Type</label>
            <Select
              name="type"
              value={editData.type}
              onChange={(e) => handleInputChange({ target: { name: 'type', value: e.target.value } })}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
                { value: 'credit', label: 'Credit Given' },
                { value: 'loan', label: 'Loan Taken' }
              ]}
            />
          </div>
          <div className="space-y-1">
            <label className="text-overline px-1 opacity-50 block">Category</label>
            <Select
              name="category"
              value={editData.category}
              onChange={(e) => handleInputChange({ target: { name: 'category', value: e.target.value } })}
              options={categories.map(c => ({
                value: c.value,
                label: `${c.emoji} ${c.label}`
              }))}
            />
          </div>
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-overline px-1 opacity-50 block">Amount</label>
            <GlassInput
              type="number"
              name="amount"
              value={editData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-overline px-1 opacity-50 block">Date</label>
            <GlassInput
              type="date"
              name="date"
              value={editData.date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-overline px-1 opacity-50 block">Description</label>
          <GlassInput
            type="text"
            name="description"
            value={editData.description}
            onChange={handleInputChange}
            placeholder="What was this for?"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditParsedModal;