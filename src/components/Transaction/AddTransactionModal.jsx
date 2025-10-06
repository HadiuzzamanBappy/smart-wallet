import React, { useState, useRef } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import Modal from '../UI/Modal';
import { addTransaction } from '../../services/transactionService';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { useAuth } from '../../hooks/useAuth';

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshUserProfile } = useAuth();
  const [mode, setMode] = useState('chat'); // 'chat' or 'manual'
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Chat mode state
  const [chatMessage, setChatMessage] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const chatTextareaRef = useRef(null);
  
  // Manual mode state
  const [manualData, setManualData] = useState({
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

  const handleChatParse = async () => {
    if (!chatMessage.trim()) return;
    
    setAiLoading(true);
    try {
      const result = await parseTransaction(chatMessage);
      if (result.success) {
        setParsedTransactions(result.data);
      } else {
        console.error('Parsing failed:', result.error);
      }
    } catch (error) {
      console.error('Parse error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddParsedTransactions = async () => {
    if (parsedTransactions.length === 0) return;
    
    setLoading(true);
    try {
      for (const transaction of parsedTransactions) {
        const result = await addTransaction(user.uid, {
          ...transaction,
          originalMessage: chatMessage,
          source: 'chat'
        });
        
        if (!result.success) {
          console.error('Transaction add failed:', result.error);
        }
      }
      
      await refreshUserProfile();
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualData.amount || !manualData.description) return;
    
    setLoading(true);
    try {
      const result = await addTransaction(user.uid, {
        ...manualData,
        amount: Number(manualData.amount),
        date: new Date(manualData.date), // Ensure date is properly formatted
        source: 'manual'
      });
      
      if (result.success) {
        await refreshUserProfile();
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        console.error('Transaction add failed:', result.error);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChatMessage('');
    setParsedTransactions([]);
    setManualData({
      type: 'expense',
      amount: '',
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getCategoryEmoji = (category) => {
    return categories.find(cat => cat.value === category)?.emoji || '📦';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Transaction" size="lg">
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              mode === 'chat'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Smart Chat</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              mode === 'manual'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>
        </div>

        {mode === 'chat' ? (
          // Chat Mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe your transaction
              </label>
              <textarea
                ref={chatTextareaRef}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="e.g., I bought groceries for 500 taka today"
                className="input-field min-h-[100px]"
                rows="3"
              />
            </div>

            {/* Quick suggestion templates */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <p className="font-medium mb-2">Try these templates (tap to use):</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">Natural</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">Bought groceries for 500 BDT today</div>
                  </div>
                  <button
                    onClick={() => { setChatMessage('Bought groceries for 500 BDT today'); chatTextareaRef.current?.focus(); }}
                    className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                  >Use</button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">Tokenized</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">type:expense amount:250 currency:BDT category:food note:Lunch</div>
                  </div>
                  <button
                    onClick={() => { setChatMessage('type:expense amount:250 currency:BDT category:food note:Lunch'); chatTextareaRef.current?.focus(); }}
                    className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                  >Use</button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">Multi-line</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">Lunch 250\nTaxi 120\nSalary 50000 2025-10-01</div>
                  </div>
                  <button
                    onClick={() => { setChatMessage('Lunch 250\nTaxi 120\nSalary 50000 2025-10-01'); chatTextareaRef.current?.focus(); }}
                    className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                  >Use</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleChatParse}
              disabled={!chatMessage.trim() || aiLoading}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {aiLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Parse with AI
            </button>

            {/* Parsed Results */}
            {parsedTransactions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parsed Transactions ({parsedTransactions.length})
                </h4>
                {parsedTransactions.map((transaction, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryEmoji(transaction.category)}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {transaction.description}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.category} • {transaction.type}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'income' || transaction.type === 'loan'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                        {transaction.amount} BDT
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleAddParsedTransactions}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Add {parsedTransactions.length} Transaction{parsedTransactions.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Manual Mode
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={manualData.type}
                onChange={(e) => setManualData(prev => ({ ...prev, type: e.target.value }))}
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
                  value={manualData.amount}
                  onChange={(e) => setManualData(prev => ({ ...prev, amount: e.target.value }))}
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
                  value={manualData.date}
                  onChange={(e) => setManualData(prev => ({ ...prev, date: e.target.value }))}
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
                value={manualData.description}
                onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
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
                value={manualData.category}
                onChange={(e) => setManualData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.emoji} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !manualData.amount || !manualData.description}
              className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Add Transaction
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AddTransactionModal;