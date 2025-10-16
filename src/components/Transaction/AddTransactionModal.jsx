import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Edit, Trash, Check, X, Loader2 } from 'lucide-react';
import Modal from '../UI/Modal';
import { addTransaction } from '../../services/transactionService';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [mode, setMode] = useState('manual'); // 'chat' or 'manual'
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  
  // Get user's currency preference
  const userCurrency = userProfile?.currency || 'BDT';
  
  // Chat mode state
  const [chatMessage, setChatMessage] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const chatTextareaRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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
      const result = await parseTransaction(chatMessage, userCurrency);
      if (result.success) {
        setParsedTransactions(result.data);
        // do not set a persistent success message here — hide parse-success badge and show the inline preview instead
        setLastResponse(null);
        setIsPreviewOpen(true);
      } else {
        console.error('Parsing failed:', result.error);
        setLastResponse({ type: 'error', message: result.error || 'Parsing failed' });
      }
    } catch (error) {
      console.error('Parse error:', error);
      setLastResponse({ type: 'error', message: 'Parsing error' });
    } finally {
      setAiLoading(false);
    }
  };

  const updateParsedTransaction = (index, patch) => {
    setParsedTransactions(prev => {
      if (!prev) return prev;
      return prev.map((p, i) => i === index ? { ...p, ...patch } : p);
    });
  };

  // If user removes all parsed items, close the preview so suggestions re-appear
  useEffect(() => {
    if (isPreviewOpen && Array.isArray(parsedTransactions) && parsedTransactions.length === 0) {
      setIsPreviewOpen(false);
      setLastResponse(null);
      // keep parsedTransactions as empty array
    }
  }, [parsedTransactions, isPreviewOpen]);

  const removeParsedTransaction = (index) => {
    setParsedTransactions(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  };

  const saveRowEdit = () => {
    // force re-render by creating new array reference
    setParsedTransactions(prev => prev ? [...prev] : prev);
    setEditingIndex(null);
  };

  const humanizeType = (type) => {
    if (!type) return 'Other';
    const t = String(type).toLowerCase();
    if (t === 'income') return 'Income';
    if (t === 'expense') return 'Expense';
    if (t === 'credit') return 'Credit (lent)';
    if (t === 'loan') return 'Loan (borrowed)';
    return 'Other';
  };

  const handleAddParsedTransactions = async () => {
    if (parsedTransactions.length === 0) return;
    
    setLoading(true);
    try {
      const addedIds = [];

      for (const transaction of parsedTransactions) {
        const result = await addTransaction(user.uid, {
          ...transaction,
          amount: Number(transaction.amount),
          date: transaction.date ? new Date(transaction.date) : new Date(),
          source: 'chat'
        });
        
        if (!result.success) {
          console.error('Transaction add failed:', result.error);
          setLastResponse({ type: 'error', message: 'Failed to add some transactions' });
        }
        else {
          addedIds.push(result.id);
        }
      }
      
      await refreshUserProfile();

      // Notify other UI components (analytics/summary) that transactions were added
      try {
        window.dispatchEvent(new CustomEvent('wallet:transaction-added', { detail: { addedIds, count: addedIds.length, source: 'chat' } }));
      } catch {
        // ignore dispatch errors on older browsers
      }

      setLastResponse({ type: 'success', message: `Added ${addedIds.length} transaction${addedIds.length>1?'s':''}` });
      setIsPreviewOpen(false);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding transactions:', error);
      setLastResponse({ type: 'error', message: 'Failed to add transactions' });
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
        // Notify other components
        try {
          window.dispatchEvent(new CustomEvent('wallet:transaction-added', { detail: { addedIds: [result.id], count: 1, source: 'manual' } }));
        } catch {
          // ignore dispatch errors
        }

        setLastResponse({ type: 'success', message: 'Transaction added' });
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        console.error('Transaction add failed:', result.error);
        setLastResponse({ type: 'error', message: 'Failed to add transaction' });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setLastResponse({ type: 'error', message: 'Add transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChatMessage('');
    setParsedTransactions([]);
    setIsPreviewOpen(false);
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

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.value === category)?.label || String(category || 'Other');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Transaction" size="lg">
      <div className="space-y-6">
        {/* Feedback: show errors or save-success only; hide parse-success badge when preview is open */}
        {lastResponse && (lastResponse.type === 'error' || (lastResponse.type === 'success' && parsedTransactions.length === 0)) && (
          <div className={`p-3 rounded-lg ${lastResponse.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
            <p className="text-sm font-medium">{lastResponse.message}</p>
          </div>
        )}
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
                placeholder={`e.g., I bought groceries for ${userCurrency === 'BDT' ? '500 taka' : userCurrency === 'USD' ? '$50' : `50 ${userCurrency}`} today`}
                className="input-field min-h-[100px]"
                rows="3"
              />
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

            {/* Quick suggestion templates */}
            {!isPreviewOpen && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <p className="font-medium mb-2">Try these templates (tap to use):</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">Natural</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">
                      {userCurrency === 'BDT' ? 'Bought groceries for 500 BDT today' : `Bought groceries for ${userCurrency === 'USD' ? '$50' : `50 ${userCurrency}`} today`}
                    </div>
                  </div>
                  <button
                    onClick={() => { 
                      const template = userCurrency === 'BDT' ? 'Bought groceries for 500 BDT today' : `Bought groceries for ${userCurrency === 'USD' ? '$50' : `50 ${userCurrency}`} today`;
                      setChatMessage(template); 
                      chatTextareaRef.current?.focus(); 
                    }}
                    className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                  >Use</button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                  <div className="flex-1 pr-2">
                    <div className="font-medium">Tokenized</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-300">type:expense amount:250 currency:{userCurrency} category:food note:Lunch</div>
                  </div>
                  <button
                    onClick={() => { 
                      setChatMessage(`type:expense amount:250 currency:${userCurrency} category:food note:Lunch`); 
                      chatTextareaRef.current?.focus(); 
                    }}
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
            )}

            {/* Parsed Results */}
            {parsedTransactions.length > 0 && (
              <div className="space-y-3">
                <div className="mb-2 text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ⚠️ AI can make mistakes. Please review and edit the parsed transactions before saving.
                </div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parsed Transactions ({parsedTransactions.length})
                </h4>
                {parsedTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-700/40 rounded min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-50 dark:bg-gray-700">
                      <span className="text-xs">{getCategoryEmoji(transaction.category)}</span>
                    </div>

                    {/* Normal row view */}
                    {editingIndex !== index ? (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{(transaction.description || '').replace(/\s+/g, ' ').trim()}</div>
                          <div className="text-[11px] text-gray-500">{humanizeType(transaction.type)} • {getCategoryLabel(transaction.category)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}{formatCurrency(transaction.amount, userCurrency)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setEditingIndex(index)} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded hover:scale-105 transition-transform" aria-label="Edit">
                            <Edit className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
                          </button>
                          <button onClick={() => removeParsedTransaction(index)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-800 transition-colors" aria-label="Delete">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                      ) : (
                      /* Edit mode for this row (responsive) */
                      <>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={transaction.description || ''}
                            onChange={(e) => updateParsedTransaction(index, { description: e.target.value })}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full"
                            placeholder="Description"
                          />

                          <input
                            type="number"
                            value={transaction.amount ?? ''}
                            onChange={(e) => updateParsedTransaction(index, { amount: e.target.value })}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full "
                            placeholder="Amount"
                          />

                          <select
                            value={transaction.type || 'expense'}
                            onChange={(e) => updateParsedTransaction(index, { type: e.target.value })}
                            className="col-span-1 sm:col-span-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="credit">Credit (lent)</option>
                            <option value="loan">Loan (borrowed)</option>
                          </select>

                          <select
                            value={transaction.category || 'other'}
                            onChange={(e) => updateParsedTransaction(index, { category: e.target.value })}
                            className="col-span-1 sm:col-span-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full"
                          >
                            {categories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          <button onClick={() => setEditingIndex(null)} className="p-2 bg-white dark:bg-gray-800 border rounded hover:scale-95 transition-transform" aria-label="Cancel edit">
                            <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                          </button>
                          <button onClick={saveRowEdit} className="p-2 bg-teal-500 text-white rounded hover:opacity-90 transition-opacity" aria-label="Save edit">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setIsPreviewOpen(false); setParsedTransactions([]); setLastResponse(null); }}
                    className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleAddParsedTransactions}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Add Transaction{parsedTransactions.length > 1 ? 's' : ''}
                  </button>
                </div>
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
                  Amount ({userCurrency})
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