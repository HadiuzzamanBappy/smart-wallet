import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Edit, Trash, Check, X, Loader2 } from 'lucide-react';
import Modal from '../UI/base/Modal';
import { addTransaction } from '../../services/transactionService';
import { parseTransaction } from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';
import { APP_EVENTS } from '../../config/constants';

// Base UI Components
import Button from '../UI/base/Button';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import IconBox from '../UI/base/IconBox';
import GlassCard from '../UI/base/GlassCard';
import Badge from '../UI/base/Badge';

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

  const saveChatTransactions = async () => {
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
        window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'chat-add' } }));
      } catch {
        // ignore dispatch errors on older browsers
      }

      setLastResponse({ type: 'success', message: `Added ${addedIds.length} transaction${addedIds.length > 1 ? 's' : ''}` });
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
          window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTIONS_UPDATED, { detail: { source: 'manual-add' } }));
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

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualData(prev => ({
      ...prev,
      [name]: value
    }));
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
        {/* Feedback Messages */}
        {lastResponse && (lastResponse.type === 'error' || (lastResponse.type === 'success' && parsedTransactions.length === 0)) && (
          <div className={`p-4 rounded-2xl ${lastResponse.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'} border animate-in fade-in slide-in-from-top-1`}>
            <p className="text-nano uppercase text-center">{lastResponse.message}</p>
          </div>
        )}

        {/* Modern Glass Mode Toggle */}
        <div className="flex bg-paper-100/30 dark:bg-white/5 p-1 rounded-2xl border border-paper-100 dark:border-white/5 mx-1">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-overline transition-all duration-300 ${mode === 'chat'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'text-ink-400 dark:text-paper-700 hover:text-ink-900 dark:hover:text-paper-50'
              }`}
          >
            <MessageSquare className="w-3 h-3" />
            AI Assistant
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-overline transition-all duration-300 ${mode === 'manual'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'text-ink-400 dark:text-paper-700 hover:text-ink-900 dark:hover:text-paper-50'
              }`}
          >
            <Edit className="w-3 h-3" />
            Manual Entry
          </button>
        </div>

        {mode === 'chat' ? (
          <div className="space-y-5">
            <div className="relative group">
              <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                Natural Language Description
              </label>
              <textarea
                ref={chatTextareaRef}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`e.g., I bought groceries for ${userCurrency === 'BDT' ? '500 taka' : '50'} today`}
                className="w-full h-28 bg-paper-100/30 dark:bg-white/[0.01] border border-paper-100 dark:border-white/5 rounded-2xl p-4 text-label text-ink-900 dark:text-paper-50 placeholder:text-ink-400 dark:placeholder:text-paper-700 outline-none transition-all focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/20 resize-none font-medium"
                rows="3"
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  color="primary"
                  size="sm"
                  onClick={handleChatParse}
                  loading={aiLoading}
                  disabled={!chatMessage.trim()}
                  icon={Plus}
                >
                  Parse Entry
                </Button>
              </div>
            </div>

            {/* Smart Templates */}
            {!isPreviewOpen && !aiLoading && (
              <div className="space-y-3 px-1">
                <div className="text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest leading-none">
                  Quick Templates
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    `Bought groceries for ${userCurrency === 'BDT' ? '500 taka' : '50'} today`,
                    'লাঞ্চে ২৫০ টাকা খরচ করেছি'
                  ].map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => setChatMessage(msg)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-paper-100/30 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 hover:border-primary-500/30 hover:bg-white dark:hover:bg-white/[0.04] transition-all group"
                    >
                      <span className="text-nano text-ink-400 dark:text-paper-700 group-hover:text-ink-900 dark:group-hover:text-paper-50 transition-colors">"{msg}"</span>
                      <Plus className="w-3 h-3 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed Results Preview */}
            {isPreviewOpen && Array.isArray(parsedTransactions) && parsedTransactions.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="text-overline text-ink-400 dark:text-paper-700 font-black uppercase tracking-widest leading-none">
                    Entry Preview ({parsedTransactions.length})
                  </div>
                  <Badge color="info" variant="soft" size="sm" className="mb-2">New Entry</Badge>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-auto px-1 custom-scrollbar">
                  {parsedTransactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-surface-card dark:bg-surface-card-dark border border-paper-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.03] transition-all"
                    >
                      {editingIndex === idx ? (
                        <div className="space-y-4">
                          <GlassInput
                            value={tx.description}
                            onChange={(e) => updateParsedTransaction(idx, { description: e.target.value })}
                            placeholder="Description"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <GlassInput
                              type="number"
                              value={tx.amount}
                              onChange={(e) => updateParsedTransaction(idx, { amount: e.target.value })}
                              placeholder="Amount"
                            />
                            <Select
                              value={tx.category}
                              onChange={(e) => updateParsedTransaction(idx, { category: e.target.value })}
                              options={categories.map(c => ({ value: c.value, label: `${c.emoji} ${c.label}` }))}
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" color="primary" fullWidth onClick={saveRowEdit} icon={Check}>
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl text-lg ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-paper-100/30 dark:bg-white/5 border border-paper-100 dark:border-white/5'}`}>
                              {getCategoryEmoji(tx.category)}
                            </div>
                            <div>
                              <div className="text-label text-ink-900 dark:text-paper-50 truncate leading-tight">{tx.description}</div>
                              <div className="text-overline text-ink-400 dark:text-paper-700 mt-1">{humanizeType(tx.type)} • {getCategoryLabel(tx.category)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-label ${tx.type === 'income' ? 'text-primary-600 dark:text-primary-400' : 'text-ink-900 dark:text-paper-50'}`}>
                              {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount, userCurrency)}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingIndex(idx)} className="p-1.5 hover:bg-paper-100 dark:hover:bg-white/10 rounded-xl text-ink-400 hover:text-ink-900 dark:hover:text-white transition-all border border-transparent">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button onClick={() => removeParsedTransaction(idx)} className="p-1.5 hover:bg-error-500/10 rounded-xl text-ink-400 hover:text-error-600 transition-all border border-transparent">
                                <Trash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-paper-100 dark:border-white/5">
                  <Button
                    color="primary"
                    fullWidth
                    size="lg"
                    onClick={saveChatTransactions}
                    loading={loading}
                    icon={Check}
                  >
                    Confirm & Save All
                  </Button>
                  <Button
                    variant="ghost"
                    color="ink"
                    fullWidth
                    className="mt-2 text-overline"
                    onClick={() => {
                      setParsedTransactions([]);
                      setIsPreviewOpen(false);
                    }}
                  >
                    Discard Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-6 px-1">
            {/* Manual Entry Form */}
            <div>
              <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                Transaction Type
              </label>
              <Select
                name="type"
                value={manualData.type}
                onChange={(e) => setManualData(prev => ({ ...prev, type: e.target.value }))}
                className="!rounded-2xl"
                options={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                  { value: 'credit', label: 'Credit Given' },
                  { value: 'loan', label: 'Loan Taken' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                  Amount ({userCurrency})
                </label>
                <GlassInput
                  type="number"
                  name="amount"
                  value={manualData.amount}
                  onChange={handleManualInputChange}
                  placeholder="0.00"
                  className="!rounded-2xl"
                  required
                />
              </div>

              <div>
                <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                  Date
                </label>
                <GlassInput
                  type="date"
                  name="date"
                  value={manualData.date}
                  onChange={handleManualInputChange}
                  className="!rounded-2xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                Description
              </label>
              <GlassInput
                type="text"
                name="description"
                value={manualData.description}
                onChange={handleManualInputChange}
                placeholder="What was this for?"
                className="!rounded-2xl"
                required
              />
            </div>

            <div>
              <label className="block text-overline text-ink-400 dark:text-paper-700 mb-2.5 px-1">
                Category
              </label>
              <Select
                name="category"
                value={manualData.category}
                onChange={(e) => setManualData(prev => ({ ...prev, category: e.target.value }))}
                className="!rounded-2xl"
                options={categories.map(c => ({
                  value: c.value,
                  label: `${c.emoji} ${c.label}`
                }))}
              />
            </div>

            <div className="pt-4">
              <Button
                color="primary"
                fullWidth
                size="lg"
                onClick={handleManualSubmit}
                loading={loading}
                disabled={!manualData.amount || !manualData.description}
                icon={Plus}
              >
                Save Transaction
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AddTransactionModal;