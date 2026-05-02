import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, Edit, Trash, Check, X } from 'lucide-react';
import { parseTransaction } from '../../services/aiService';
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
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-teal-500 to-blue-600 text-white rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transform hover:scale-110 active:scale-95 transition-all duration-500 flex items-center justify-center ${isVisible || isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'
          }`}
        title="Quick Add Transaction"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 animate-in slide-in-from-bottom overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Quick Add Transaction</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 opacity-60">Natural Language Entry</p>
          </div>

          {/* Chat Area */}
          <div className="p-4 space-y-4">
            {/* Last Response or Preview */}
            {lastResponse && (
              <div className={`p-3 rounded-xl border ${lastResponse.type === 'success'
                  ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}>
                <p className="text-[10px] font-black uppercase tracking-wider">{lastResponse.message}</p>
                {/* Show parsed transactions only when non-empty */}
                {Array.isArray(lastResponse.transactions) && lastResponse.transactions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {lastResponse.transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{getCategoryEmoji(transaction.category)}</span>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-gray-900 dark:text-white">{(transaction.description || '').replace(/\s+/g, ' ').trim()}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-60">{humanizeType(transaction.type)}</div>
                          </div>
                        </div>
                        <span className={`font-black ${transaction.type === 'income' || transaction.type === 'loan'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-rose-600 dark:text-rose-400'
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
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl text-[12px] font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 outline-none transition-all focus:ring-1 focus:ring-teal-500/20 focus:border-teal-500/30 resize-none"
                  rows="3"
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5"
                >
                  Close
                </button>
                <button
                  onClick={handleParseMessage}
                  disabled={!message.trim() || loading}
                  className="flex-[1.5] flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-tr from-teal-500 to-teal-600 hover:shadow-lg hover:shadow-teal-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="mb-4 text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/20 flex items-start gap-2">
                  <span className="text-xs">⚠️</span>
                  <span>Verify parsed entries before saving.</span>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Verification Required</p>
                <div className="space-y-2 max-h-56 overflow-auto mb-4 custom-scrollbar">
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs p-2.5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                        <span className="text-xs">{getCategoryEmoji(transaction.category)}</span>
                      </div>

                      {/* Normal row view */}
                      {editingIndex !== index ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold truncate text-[11px] text-gray-900 dark:text-white leading-tight">{transaction.description}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{humanizeType(transaction.type)}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-black text-[11px] ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                              {formatCurrency(transaction.amount, userCurrency)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button onClick={() => setEditingIndex(index)} className="p-1.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg hover:text-teal-500 shadow-sm transition-colors" aria-label="Edit">
                              <Edit className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeParsedTransaction(index)} className="p-1.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-400 hover:text-rose-500 rounded-lg shadow-sm transition-colors" aria-label="Delete">
                              <Trash className="w-3 h-3" />
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
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500/20"
                            />
                            <input
                              type="number"
                              value={transaction.amount ?? ''}
                              onChange={(e) => updateParsedTransaction(index, { amount: e.target.value })}
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500/20"
                            />
                            <select
                              value={transaction.type || 'expense'}
                              onChange={(e) => updateParsedTransaction(index, { type: e.target.value })}
                              className="col-span-2 px-2 py-1 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500/20"
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                              <option value="credit">Credit (lent)</option>
                              <option value="loan">Loan (borrowed)</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button onClick={() => setEditingIndex(null)} className="p-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg" aria-label="Cancel edit">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={saveRowEdit} className="p-1.5 bg-teal-500 text-white rounded-lg shadow-lg shadow-teal-500/20" aria-label="Save edit">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsPreviewOpen(false); setParsedTransactions(null); }}
                    className="flex-1 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={loading}
                    className="flex-[1.5] px-3 py-2 bg-gradient-to-tr from-teal-500 to-teal-600 hover:shadow-lg hover:shadow-teal-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}

            {/* Examples with quick-insert templates */}
            {!lastResponse && !isPreviewOpen && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                <p className="font-black uppercase tracking-widest mb-3 px-1">Templates</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-2.5 rounded-xl group hover:border-teal-500/30 hover:bg-white dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => {
                      const exampleMsg = userCurrency === 'BDT'
                        ? 'Bought groceries for 500 taka today'
                        : `Bought groceries for ${userCurrency === 'USD' ? '50' : userCurrency === 'EUR' ? '45' : userCurrency === 'GBP' ? '40' : '500'} ${userCurrency === 'USD' ? 'dollars' : userCurrency === 'EUR' ? 'euros' : userCurrency === 'GBP' ? 'pounds' : userCurrency === 'INR' ? 'rupees' : 'taka'}`;
                      setMessage(exampleMsg);
                      textareaRef.current?.focus();
                    }}
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {userCurrency === 'BDT'
                          ? 'Bought groceries for 500 taka'
                          : `Bought groceries for ${userCurrency === 'USD' ? '50' : '...'} ${userCurrency === 'USD' ? 'dollars' : '...'}`}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-2.5 rounded-xl group hover:border-teal-500/30 hover:bg-white dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => {
                      const exampleMsg = userCurrency === 'BDT'
                        ? 'লাঞ্চে ২৫০ টাকা খরচ করেছি'
                        : 'type:expense amount:25 category:food note:Lunch';
                      setMessage(exampleMsg);
                      textareaRef.current?.focus();
                    }}
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {userCurrency === 'BDT'
                          ? 'লাঞ্চে ২৫০ টাকা খরচ'
                          : 'Lunch expense: 25'}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </div>
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
          className="fixed inset-0 bg-gray-900/10 dark:bg-black/40 backdrop-blur-[2px] z-30 transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatWidget;