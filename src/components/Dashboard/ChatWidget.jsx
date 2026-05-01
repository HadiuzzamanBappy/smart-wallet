import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Edit, Trash, Check, X } from 'lucide-react';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { addTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

const ChatWidget = ({ onTransactionAdded, className = '' }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [parsedTransactions, setParsedTransactions] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const textareaRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  // Visibility logic: On mobile, only show when actively scrolling
  useEffect(() => {
    const handleVisibility = () => {
      const isMobile = window.innerWidth < 768;
      
      if (!isMobile) {
        setIsVisible(true);
        return;
      }

      // Show on scroll
      setIsVisible(true);
      
      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Hide after 2 seconds of inactivity (only if chat is not open)
      hideTimeoutRef.current = setTimeout(() => {
        if (!isOpen) {
          setIsVisible(false);
        }
      }, 2000);
    };

    window.addEventListener('scroll', handleVisibility, { passive: true });
    window.addEventListener('resize', handleVisibility);
    
    // Initial state check
    handleVisibility();

    return () => {
      window.removeEventListener('scroll', handleVisibility);
      window.removeEventListener('resize', handleVisibility);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isOpen]);

  // Get user's currency preference
  const userCurrency = userProfile?.currency || 'BDT';

  // If the user removes all parsed items, automatically close the preview and show suggestions
  useEffect(() => {
    if (isPreviewOpen && Array.isArray(parsedTransactions) && parsedTransactions.length === 0) {
      setIsPreviewOpen(false);
      setParsedTransactions(null);
    }
  }, [parsedTransactions, isPreviewOpen]);

  // Parse-only: produce parsed transactions and open preview
  const handleParseMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setLastResponse(null);
    setParsedTransactions(null);

    try {
      // Pass user's currency to parser for better context
      const parseResult = await parseTransaction(message, userCurrency);

      if (parseResult.success) {
        setParsedTransactions(parseResult.data);
        setIsPreviewOpen(true);
      } else {
        setLastResponse({
          type: 'error',
          message: parseResult.error || 'Could not understand your message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Chat parse error:', error);
      setLastResponse({
        type: 'error',
        message: 'Something went wrong while parsing. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Save the previously parsed transactions to Firestore
  const handleConfirmSave = async () => {
    if (!parsedTransactions || loading) return;

    setLoading(true);
    setLastResponse(null);

    try {
  let added = 0;
  // Use editable copy if available
  const toSave = parsedTransactions.map(t => ({ ...t, amount: Number(t.amount) }));
  for (const transaction of toSave) {
        const addResult = await addTransaction(user.uid, {
          ...transaction,
          // Ensure date is properly formatted as Date object
          date: transaction.date ? new Date(transaction.date) : new Date(),
          source: 'chat'
        });

        if (addResult.success) added += 1;
        else console.error('Failed to add transaction:', addResult.error);
      }

      // Refresh user profile and notify parent
      await refreshUserProfile();
      onTransactionAdded?.();

      setLastResponse({
        type: 'success',
        message: `Successfully added ${added} transaction${added > 1 ? 's' : ''}!`,
        transactions: parsedTransactions
      });

      // Clear message and preview
      setMessage('');
      setParsedTransactions(null);
      setIsPreviewOpen(false);
    } catch (error) {
      console.error('Chat save error:', error);
      setLastResponse({
        type: 'error',
        message: 'Failed to save transactions. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParseMessage();
    }
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      food: '🍔',
      transport: '🚗',
      entertainment: '🎬',
      shopping: '🛍️',
      bills: '📄',
      health: '🏥',
      education: '📚',
      salary: '💼',
      freelance: '💻',
      investment: '📈',
      other: '📦'
    };
    return emojiMap[category] || '📦';
  };

  const humanizeType = (type) => {
    if (!type) return 'Other';
    const t = type.toLowerCase();
    if (t === 'income') return 'Income';
    if (t === 'expense') return 'Expense';
    if (t === 'loan') return 'Loan (borrowed)';
    if (t === 'credit') return 'Credit (lent)';
    return 'Other';
  };

  // categoryOptions removed: edit now focuses on transaction type (income/expense/loan/other)

  const updateParsedTransaction = (index, patch) => {
    setParsedTransactions(prev => {
      if (!prev) return prev;
      const copy = prev.map((p, i) => i === index ? { ...p, ...patch } : p);
      return copy;
    });
  };

  const [editingIndex, setEditingIndex] = useState(null);

  const removeParsedTransaction = (index) => {
    setParsedTransactions(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  };

  const saveRowEdit = () => {
    // Force a shallow copy so React definitely re-renders the list with updated values
    setParsedTransactions(prev => prev ? [...prev] : prev);
    setEditingIndex(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500 flex items-center justify-center ${
          isVisible || isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'
        }`}
        title="Quick Add Transaction"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Add Transaction</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Describe your transaction naturally</p>
          </div>

          {/* Chat Area */}
          <div className="p-4 space-y-4">
            {/* Last Response or Preview */}
            {lastResponse && (
              <div className={`p-3 rounded-lg ${
                lastResponse.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm font-medium">{lastResponse.message}</p>
                {/* Show parsed transactions only when non-empty */}
                {Array.isArray(lastResponse.transactions) && lastResponse.transactions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lastResponse.transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{getCategoryEmoji(transaction.category)}</span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{(transaction.description || '').replace(/\s+/g, ' ').trim()}</div>
                            <div className="text-[11px] text-gray-500">{humanizeType(transaction.type)}</div>
                          </div>
                        </div>
                        <span className={`font-medium ${
                          transaction.type === 'income' || transaction.type === 'loan' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                          {formatCurrency(transaction.amount, userCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-3">
                <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    userCurrency === 'BDT' 
                      ? "e.g., 'লাঞ্চে ২৫০ টাকা' or 'bought groceries for 500 taka'" 
                      : `e.g., 'bought lunch for ${userCurrency === 'USD' ? '$25' : userCurrency === 'EUR' ? '€20' : userCurrency === 'GBP' ? '£18' : '₹200'}'`
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent resize-y"
                  rows="3"
                  disabled={loading}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleParseMessage}
                  disabled={!message.trim() || loading}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Processing...' : 'Parse'}</span>
                </button>
              </div>
            </div>

            {/* Preview / Confirm area */}
            {isPreviewOpen && Array.isArray(parsedTransactions) && parsedTransactions.length > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-2 text-xs text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                  ⚠️ AI can make mistakes. Please review and edit the parsed transactions before saving.
                </div>

                <p className="text-sm font-medium mb-2">Preview parsed transactions</p>
                <div className="space-y-2 max-h-56 overflow-auto mb-3">
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-700/40 rounded">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-50 dark:bg-gray-700">
                        <span className="text-xs">{getCategoryEmoji(transaction.category)}</span>
                      </div>

                      {/* Normal row view */}
                      {editingIndex !== index ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{transaction.description}</div>
                            <div className="text-[11px] text-gray-500">{humanizeType(transaction.type)}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                              {formatCurrency(transaction.amount, userCurrency)}
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
                        /* Edit mode for this row */
                        <>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={transaction.description || ''}
                              onChange={(e) => updateParsedTransaction(index, { description: e.target.value })}
                              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <input
                              type="number"
                              value={transaction.amount ?? ''}
                              onChange={(e) => updateParsedTransaction(index, { amount: e.target.value })}
                              className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <select
                              value={transaction.type || 'expense'}
                              onChange={(e) => updateParsedTransaction(index, { type: e.target.value })}
                              className="col-span-2 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                              <option value="credit">Credit (lent)</option>
                              <option value="loan">Loan (borrowed)</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-2">
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
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => { setIsPreviewOpen(false); setParsedTransactions(null); }}
                    className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Examples with quick-insert templates */}
            {!lastResponse && !isPreviewOpen && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-2">Examples (tap to use):</p>
                <div className="space-y-2">
                  <div className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                    <div className="flex-1 pr-2">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300">
                            {userCurrency === 'BDT' 
                              ? 'Bought groceries for 500 taka today' 
                              : `Bought groceries for ${userCurrency === 'USD' ? '50' : userCurrency === 'EUR' ? '45' : userCurrency === 'GBP' ? '40' : '500'} ${userCurrency === 'USD' ? 'dollars' : userCurrency === 'EUR' ? 'euros' : userCurrency === 'GBP' ? 'pounds' : userCurrency === 'INR' ? 'rupees' : 'taka'}`}
                          </div>
                        </div>
                    <button
                      onClick={() => { 
                        const exampleMsg = userCurrency === 'BDT' 
                          ? 'Bought groceries for 500 taka today' 
                          : `Bought groceries for ${userCurrency === 'USD' ? '50' : userCurrency === 'EUR' ? '45' : userCurrency === 'GBP' ? '40' : '500'} ${userCurrency === 'USD' ? 'dollars' : userCurrency === 'EUR' ? 'euros' : userCurrency === 'GBP' ? 'pounds' : userCurrency === 'INR' ? 'rupees' : 'taka'}`;
                        setMessage(exampleMsg); 
                        textareaRef.current?.focus(); 
                      }}
                      className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                    >Use</button>
                  </div>

                  <div className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                    <div className="flex-1 pr-2">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300">
                            {userCurrency === 'BDT' 
                              ? 'লাঞ্চে ২৫০ টাকা খরচ করেছি' 
                              : 'type:expense amount:25 category:food note:Lunch'}
                          </div>
                        </div>
                    <button
                      onClick={() => { 
                        const exampleMsg = userCurrency === 'BDT' 
                          ? 'লাঞ্চে ২৫০ টাকা খরচ করেছি' 
                          : 'type:expense amount:25 category:food note:Lunch';
                        setMessage(exampleMsg); 
                        textareaRef.current?.focus(); 
                      }}
                      className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                    >Use</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatWidget;