import React, { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Edit, Trash, Check, X, Loader2 } from 'lucide-react';
import Modal from '../UI/Modal';
import { addTransaction } from '../../services/transactionService';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';
import { APP_EVENTS } from '../../config/constants';

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
  window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_ADDED, { detail: { addedIds, count: addedIds.length, source: 'chat' } }));
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
          window.dispatchEvent(new CustomEvent(APP_EVENTS.TRANSACTION_ADDED, { detail: { addedIds: [result.id], count: 1, source: 'manual' } }));
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
      <div className="space-y-4">
        {/* Feedback Messages */}
        {lastResponse && (lastResponse.type === 'error' || (lastResponse.type === 'success' && parsedTransactions.length === 0)) && (
          <div className={`p-3 rounded-2xl ${lastResponse.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'} border border-current/20 animate-in fade-in slide-in-from-top-1`}>
            <p className="text-xs font-black uppercase tracking-widest text-center">{lastResponse.message}</p>
          </div>
        )}

        {/* Mode Toggle - Nexus Style */}
        <div className="flex bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-1">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
              mode === 'chat'
                ? 'bg-white dark:bg-gray-700 text-teal-500 shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold'
            } text-xs uppercase tracking-widest`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Smart Chat</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
              mode === 'manual'
                ? 'bg-white dark:bg-gray-700 text-teal-500 shadow-sm font-black'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold'
            } text-xs uppercase tracking-widest`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {mode === 'chat' ? (
          // Chat Mode
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                Describe your transaction
              </label>
              <textarea
                ref={chatTextareaRef}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`e.g., I bought groceries for ${userCurrency === 'BDT' ? '500 taka' : userCurrency === 'USD' ? '$50' : `50 ${userCurrency}`} today`}
                className="w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all min-h-[120px]"
                rows="3"
              />
            </div>

            <button
              onClick={handleChatParse}
              disabled={!chatMessage.trim() || aiLoading}
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.98]"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
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
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    Parsed Transactions ({parsedTransactions.length})
                  </h4>
                  <div className="text-[9px] font-bold text-yellow-500 animate-pulse">REVIEW REQUIRED</div>
                </div>

                <div className="space-y-2">
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="relative flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 group overflow-hidden">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 shrink-0">
                        <span className="text-lg">{getCategoryEmoji(transaction.category)}</span>
                      </div>

                      {editingIndex !== index ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-gray-900 dark:text-white truncate">
                              {(transaction.description || '').replace(/\s+/g, ' ').trim()}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {humanizeType(transaction.type)} • {getCategoryLabel(transaction.category)}
                            </div>
                          </div>
                          <div className="text-right mr-2">
                            <div className={`text-sm font-black ${transaction.type === 'income' || transaction.type === 'loan' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}{formatCurrency(transaction.amount, userCurrency)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditingIndex(index)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <Edit className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <button onClick={() => removeParsedTransaction(index)} className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                              <Trash className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 grid grid-cols-2 gap-2 pr-2">
                          <input
                            type="text"
                            value={transaction.description || ''}
                            onChange={(e) => updateParsedTransaction(index, { description: e.target.value })}
                            className="col-span-2 px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-black/20 text-white outline-none focus:border-teal-500/50"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={transaction.amount ?? ''}
                            onChange={(e) => updateParsedTransaction(index, { amount: e.target.value })}
                            className="px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-black/20 text-white outline-none focus:border-teal-500/50"
                            placeholder="Amount"
                          />
                          <select
                            value={transaction.type || 'expense'}
                            onChange={(e) => updateParsedTransaction(index, { type: e.target.value })}
                            className="px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-black/20 text-white outline-none focus:border-teal-500/50"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="credit">Credit (lent)</option>
                            <option value="loan">Loan (borrowed)</option>
                          </select>
                          <div className="col-span-2 flex justify-end gap-2 mt-1">
                            <button onClick={() => setEditingIndex(null)} className="p-2 rounded-lg bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
                            <button onClick={saveRowEdit} className="p-2 rounded-lg bg-teal-500 text-white"><Check className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                      {/* Decorative gradient */}
                      <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-10 bg-teal-500" />
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setIsPreviewOpen(false); setParsedTransactions([]); setLastResponse(null); }}
                    className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Discard
                  </button>

                  <button
                    onClick={handleAddParsedTransactions}
                    disabled={loading}
                    className="flex-[2] h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Confirm {parsedTransactions.length > 1 ? 'Transactions' : 'Entry'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Manual Mode
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                Transaction Type
              </label>
              <select
                value={manualData.type}
                onChange={(e) => setManualData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="credit">Credit Given</option>
                <option value="loan">Loan Taken</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Amount ({userCurrency})
                </label>
                <input
                  type="number"
                  value={manualData.amount}
                  onChange={(e) => setManualData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={manualData.date}
                  onChange={(e) => setManualData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                Description
              </label>
              <input
                type="text"
                value={manualData.description}
                onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
                placeholder="What was this for?"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                Category
              </label>
              <select
                value={manualData.category}
                onChange={(e) => setManualData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-11 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/50"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.emoji} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !manualData.amount || !manualData.description}
              className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Transaction
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AddTransactionModal;