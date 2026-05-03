import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, Edit, Trash, Check, X } from 'lucide-react';
import { parseTransaction } from '../../services/aiService';
import { addTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

// Base UI Components
import Button from './base/Button';
import SectionHeader from './base/SectionHeader';
import GlassCard from './base/GlassCard';
import Badge from './base/Badge';
import IconBox from './base/IconBox';

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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="filled"
        color="primary"
        size="icon"
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 !rounded-full shadow-lg shadow-primary-500/20 hover:scale-110 active:scale-95 transition-all duration-300 ${isVisible || isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-12 pointer-events-none'}`}
        title="Quick Add Transaction"
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-80 animate-in slide-in-from-bottom duration-300">
          <div className="bg-surface-card dark:bg-surface-card-dark backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-paper-200 dark:border-paper-900/10 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-paper-100 dark:border-white/5 bg-paper-50/50 dark:bg-white/[0.02]">
              <SectionHeader
                title="Assistant"
                subtitle="Natural language entry"
                icon={MessageSquare}
                titleSize="text-h6"
                className="!mb-0"
              />
            </div>

            {/* Chat Area */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar">
              {/* Last Response or Preview */}
              {lastResponse && (
                <div className={`p-3 rounded-2xl border transition-all duration-300 ${lastResponse.type === 'success'
                  ? 'bg-success-500/[0.03] dark:bg-success-500/10 border-success-500/20 text-success-700 dark:text-success-400'
                  : 'bg-error-500/[0.03] dark:bg-error-500/10 border-error-500/20 text-error-700 dark:text-error-400'
                  }`}>
                  <p className="text-overline uppercase tracking-widest">{lastResponse.message}</p>
                  {/* Show parsed transactions only when non-empty */}
                  {Array.isArray(lastResponse.transactions) && lastResponse.transactions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {lastResponse.transactions.map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between text-label group/item">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base">{getCategoryEmoji(transaction.category)}</span>
                            <div className="min-w-0">
                              <div className="text-body truncate text-ink-900 dark:text-white font-medium">{(transaction.description || '').replace(/\s+/g, ' ').trim()}</div>
                              <div className="text-[9px] uppercase tracking-widest text-ink-400 mt-0.5">{humanizeType(transaction.type)}</div>
                            </div>
                          </div>
                          <Badge 
                            variant="soft" 
                            color={transaction.type === 'income' || transaction.type === 'loan' ? 'primary' : 'error'}
                            size="sm"
                          >
                            {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                            {formatCurrency(transaction.amount, userCurrency)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="space-y-2">
                <div className="relative group/input">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      userCurrency === 'BDT'
                        ? "e.g., 'লাঞ্চে ২৫০ টাকা' or 'bought groceries for 500 taka'"
                        : `e.g., 'bought lunch for ${userCurrency === 'USD' ? '$25' : '...'}'`
                    }
                    className="w-full px-4 py-3 bg-paper-100/50 dark:bg-white/[0.02] border border-paper-200 dark:border-white/5 rounded-2xl text-body text-ink-900 dark:text-white placeholder-paper-400 dark:placeholder-paper-700 outline-none transition-all focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500/30 resize-none min-h-[80px]"
                    rows="3"
                    disabled={loading}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    <Button
                      onClick={handleParseMessage}
                      disabled={!message.trim() || loading}
                      loading={loading}
                      variant="filled"
                      color="primary"
                      size="sm"
                      className="!rounded-xl shadow-lg shadow-primary-500/20"
                      icon={Plus}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview / Confirm area */}
              {isPreviewOpen && Array.isArray(parsedTransactions) && parsedTransactions.length > 0 && (
                <div className="pt-3 border-t border-paper-100 dark:border-white/5 space-y-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/[0.03] dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">⚠️</span>
                    <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-400 font-medium">Verify parsed entries before saving to vault</p>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-auto custom-scrollbar">
                    {parsedTransactions.map((transaction, index) => (
                      <GlassCard
                        key={index}
                        variant="flat"
                        padding="p-2"
                        className="!bg-paper-100/30 dark:!bg-white/[0.01] border-paper-200/40 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2 text-label">
                          {/* Normal row view */}
                          {editingIndex !== index ? (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="text-body truncate text-ink-900 dark:text-white font-medium">{transaction.description}</div>
                                <div className="text-overline opacity-40 mt-0.5">{humanizeType(transaction.type)}</div>
                              </div>
                              <div className="text-right mr-1">
                                <p className={`text-label font-bold ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-primary-600 dark:text-primary-400' : 'text-error-600 dark:text-error-400'}`}>
                                  {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                                  {formatCurrency(transaction.amount, userCurrency)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingIndex(index)}
                                  className="p-1.5 rounded-lg hover:bg-paper-100 dark:hover:bg-white/5 transition-colors opacity-40 hover:opacity-100"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeParsedTransaction(index)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-40 hover:opacity-100 text-rose-500"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            /* Edit mode for this row */
                            <div className="w-full space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={transaction.description || ''}
                                  onChange={(e) => updateParsedTransaction(index, { description: e.target.value })}
                                  className="px-2 py-1.5 text-label rounded-xl border border-paper-200 dark:border-white/10 bg-white dark:bg-ink-950 text-ink-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/10"
                                />
                                <input
                                  type="number"
                                  value={transaction.amount ?? ''}
                                  onChange={(e) => updateParsedTransaction(index, { amount: e.target.value })}
                                  className="px-2 py-1.5 text-label rounded-xl border border-paper-200 dark:border-white/10 bg-white dark:bg-ink-950 text-ink-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/10"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <select
                                  value={transaction.type || 'expense'}
                                  onChange={(e) => updateParsedTransaction(index, { type: e.target.value })}
                                  className="flex-1 px-2 py-1.5 text-label rounded-xl border border-paper-200 dark:border-white/10 bg-white dark:bg-ink-950 text-ink-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/10"
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                  <option value="credit">Credit (lent)</option>
                                  <option value="loan">Loan (borrowed)</option>
                                </select>
                                <div className="flex gap-1">
                                  <Button onClick={() => setEditingIndex(null)} variant="soft" color="ink" size="sm" className="!p-1.5">
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button onClick={saveRowEdit} variant="filled" color="primary" size="sm" className="!p-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setIsPreviewOpen(false); setParsedTransactions(null); }}
                      variant="soft"
                      color="ink"
                      fullWidth
                      size="sm"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={handleConfirmSave}
                      disabled={loading}
                      loading={loading}
                      variant="filled"
                      color="primary"
                      fullWidth
                      size="sm"
                      className="flex-[1.5]"
                    >
                      Confirm Entry
                    </Button>
                  </div>
                </div>
              )}

              {/* Examples with quick-insert templates */}
              {!lastResponse && !isPreviewOpen && (
                <div className="space-y-2">
                  <p className="text-overline text-ink-400 px-1 uppercase tracking-widest">Suggestions</p>
                  <div className="space-y-2">
                    {[
                      { 
                        title: userCurrency === 'BDT' ? 'Bought groceries for 500 taka' : 'Groceries for $50',
                        msg: userCurrency === 'BDT' ? 'Bought groceries for 500 taka today' : 'Bought groceries for 50 dollars'
                      },
                      { 
                        title: userCurrency === 'BDT' ? 'লাঞ্চে ২৫০ টাকা খরচ' : 'Lunch for $25',
                        msg: userCurrency === 'BDT' ? 'লাঞ্চে ২৫০ টাকা খরচ করেছি' : 'Lunch expense: 25'
                      }
                    ].map((item, i) => (
                      <GlassCard
                        key={i}
                        variant="flat"
                        hover={true}
                        padding="p-2.5"
                        className="!bg-paper-100/30 dark:!bg-white/[0.03] border-paper-200/50 dark:border-white/5 group/template"
                        onClick={() => {
                          setMessage(item.msg);
                          textareaRef.current?.focus();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-2">
                            <div className="text-label text-ink-900 dark:text-white opacity-40 group-hover/template:opacity-100 transition-all duration-300 transform group-hover/template:translate-x-1">
                              {item.title}
                            </div>
                          </div>
                          <IconBox icon={Plus} variant="glass" size="xs" color="primary" className="opacity-0 group-hover/template:opacity-100 scale-50 group-hover/template:scale-100 transition-all" />
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
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