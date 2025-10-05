import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { parseTransaction, formatTransactionMessage, getCategoryEmoji } from '../../utils/transactionParser';
import { addTransaction, getTransactions } from '../../services/transactionService';
import { checkBudgetAfterTransaction } from '../../services/budgetService';

import ConfirmDialog from '../UI/ConfirmDialog';
import Toast from '../UI/Toast';

const ChatWidget = ({ onTransactionAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, refreshUserProfile } = useAuth();
  const messagesRef = useRef(null);

  const [savedTransactions, setSavedTransactions] = useState([]);
  const [pendingDeleteSavedKey, setPendingDeleteSavedKey] = useState(null);
  const [pendingClear, setPendingClear] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [budgetAlert, setBudgetAlert] = useState({ open: false, message: '', type: 'info' });

  // Handle transaction deletion with user choice
  const handleDeleteTransaction = async (deleteFromDatabase) => {
    console.log('Deleting transaction:', pendingDeleteSavedKey, 'From DB:', deleteFromDatabase);
    
    try {
      let transactionToDelete = null;
      
      // 1. Find the transaction to delete from localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = 'wallet_last_transactions';
        const raw = localStorage.getItem(key);
        let arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) {
          transactionToDelete = arr.find(a => `${a.id ?? a._id}_${a.savedAt ?? ''}` === String(pendingDeleteSavedKey));
        }
      }

      // 2. Delete from Firebase if user chose to delete from database
      if (deleteFromDatabase && transactionToDelete && (transactionToDelete.id || transactionToDelete._id) && user?.uid) {
        const { deleteTransaction } = await import('../../services/transactionService');
        const result = await deleteTransaction(user.uid, transactionToDelete.id || transactionToDelete._id, transactionToDelete);
        
        if (result.success) {
          console.log('Successfully deleted from Firebase');
          // Refresh user profile after successful Firebase deletion  
          try {
            await refreshUserProfile();
          } catch (error) {
            console.error('Error refreshing user profile after deletion:', error);
          }
          // Notify parent component
          if (onTransactionAdded) onTransactionAdded();
        } else {
          throw new Error(result.error || 'Failed to delete from Firebase');
        }
      }

      // 3. Remove from localStorage cache (for both chat-only and database deletion)
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = 'wallet_last_transactions';
        const raw = localStorage.getItem(key);
        let arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) {
          const filtered = arr.filter(a => `${a.id ?? a._id}_${a.savedAt ?? ''}` !== String(pendingDeleteSavedKey));
          localStorage.setItem(key, JSON.stringify(filtered));
          setSavedTransactions(filtered);
          console.log('Updated localStorage cache');
        }
      }

      // 4. Remove from chat messages
      setMessages(prev => prev.filter(m => m.savedKey !== pendingDeleteSavedKey));

      // 5. Dispatch global event only if deleted from database
      if (deleteFromDatabase && transactionToDelete && (transactionToDelete.id || transactionToDelete._id)) {
        try { 
          window.dispatchEvent(new CustomEvent('wallet:transaction-deleted', { 
            detail: { transactionId: transactionToDelete.id || transactionToDelete._id } 
          })); 
        } catch { 
          console.warn('Failed to dispatch transaction-deleted event'); 
        }
      }

      const message = deleteFromDatabase ? 'Transaction deleted from account' : 'Transaction removed from chat';
      setToast({ open: true, message, type: 'info' });
      
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setToast({ open: true, message: 'Failed to delete transaction', type: 'error' });
    }
    
    setPendingDeleteSavedKey(null);
  };

  // Load saved transactions (last-10) from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem('wallet_last_transactions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedTransactions(parsed);
      }
    } catch (e) {
      // non-fatal
      console.warn('Failed to read saved transactions from localStorage', e);
    }
  }, []);

  // Sync localStorage cache with Firebase when chat opens (preserve original messages)
  useEffect(() => {
    const syncCacheWithFirebase = async () => {
      if (!isOpen || !user?.uid) return;
      
      try {
        // Get current cache to preserve originalMessage data
        let currentCache = [];
        try {
          const raw = localStorage.getItem('wallet_last_transactions');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) currentCache = parsed;
          }
        } catch (error) {
          console.warn('Failed to read current cache for sync:', error);
        }

        // Get fresh data from Firebase - only chat-generated transactions
        const { getRecentTransactions } = await import('../../services/transactionService');
        const result = await getRecentTransactions(user.uid, 50); // Get more to filter chat ones
        
        if (result.success && result.data) {
          // Filter for chat-generated transactions only
          const chatTransactions = result.data.filter(tx => 
            tx.source === 'chat-widget' || tx.source === 'chat-interface' || tx.originalMessage
          );
          
          console.log(`Found ${result.data.length} total transactions, ${chatTransactions.length} are chat-generated`);
          
          const firebaseIds = new Set(chatTransactions.map(tx => tx.id));
          
          // Filter out deleted transactions from cache and update existing ones
          const updatedCache = currentCache
            .filter(cachedTx => firebaseIds.has(cachedTx.id)) // Remove deleted transactions
            .map(cachedTx => {
              // Find matching Firebase transaction and merge data
              const firebaseTx = chatTransactions.find(tx => tx.id === cachedTx.id);
              if (firebaseTx) {
                return {
                  ...firebaseTx,
                  // Preserve chat-specific fields
                  savedAt: cachedTx.savedAt || Date.now(),
                  originalMessage: cachedTx.originalMessage || firebaseTx.originalMessage || firebaseTx.description
                };
              }
              return cachedTx;
            });

          // Add new chat transactions not in cache
          chatTransactions.forEach(firebaseTx => {
            const existsInCache = updatedCache.some(cached => cached.id === firebaseTx.id);
            if (!existsInCache) {
              updatedCache.unshift({
                ...firebaseTx,
                savedAt: Date.now(),
                originalMessage: firebaseTx.originalMessage || firebaseTx.description
              });
            }
          });

          // Keep only recent 10 chat transactions
          const finalCache = updatedCache.slice(0, 10);
          
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('wallet_last_transactions', JSON.stringify(finalCache));
            setSavedTransactions(finalCache);
            console.log(`Synced chat cache with ${finalCache.length} chat-generated transactions (preserved original messages)`);
          }
        }
      } catch (error) {
        console.warn('Failed to sync cache with Firebase:', error);
      }
    };
    
    // Only sync when chat opens
    if (isOpen) {
      syncCacheWithFirebase();
    }
  }, [isOpen, user?.uid]); // Only run when chat opens or user changes

  useEffect(() => {
    // Add welcome message when chat opens. If we have saved chat-generated transactions (max 10), 
    // seed them as bot replies so users can see their last few chat conversations in the widget.
    if (isOpen && messages.length === 0) {
      const welcome = {
        id: 1,
        type: 'bot',
        content: `Hi ${userProfile?.displayName || 'there'}! 👋\n\nTell me what you spent or earned — I will parse and save it.`
      };

      // Build paired user->bot messages for each saved transaction so users can see original prompts
      const seeded = [];
      savedTransactions.forEach((t, idx) => {
        const key = `${t.id ?? t._id ?? idx}_${t.savedAt ?? ''}`;
        const userMsg = {
          id: `saved-user-${key}`,
          type: 'user',
          content: t.originalMessage || '',
          savedKey: key
        };
        const botMsg = {
          id: `saved-bot-${key}`,
          type: 'bot',
          content: formatTransactionMessage(t),
          transaction: t,
          savedKey: key
        };
        seeded.push(userMsg, botMsg);
      });

      setMessages([welcome, ...seeded]);
    }
  }, [isOpen, messages.length, userProfile, savedTransactions]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for edits and deletions made elsewhere (TransactionList) and update saved list + messages
  useEffect(() => {
    const handleEdit = (e) => {
      try {
        const updated = e.detail?.transaction;
        if (!updated) return;
        // update savedTransactions
        setSavedTransactions(prev => {
          const next = prev.map(a => (a.id === updated.id || a._id === updated.id) ? { ...a, ...updated } : a);
          try { localStorage.setItem('wallet_last_transactions', JSON.stringify(next)); } catch (e) { console.warn('Failed to persist edited saved transaction', e); }
          return next;
        });

        // update any messages that reference this transaction
        setMessages(prev => prev.map(m => {
          if (m.transaction && (m.transaction.id === updated.id || m.transaction._id === updated.id)) {
            const newTx = { ...m.transaction, ...updated };
            return { ...m, transaction: newTx, content: formatTransactionMessage(newTx) };
          }
          return m;
        }));

        setToast({ open: true, message: 'Transaction updated', type: 'info' });
      } catch { /* ignore */ }
    };

    const handleDelete = (e) => {
      try {
        const transactionId = e.detail?.transactionId;
        if (!transactionId) return;
        
        console.log('Removing deleted transaction from chat cache:', transactionId);
        
        // Remove from savedTransactions
        setSavedTransactions(prev => {
          const filtered = prev.filter(a => a.id !== transactionId && a._id !== transactionId);
          try { localStorage.setItem('wallet_last_transactions', JSON.stringify(filtered)); } catch (e) { console.warn('Failed to update cache after deletion', e); }
          return filtered;
        });

        // Remove from chat messages
        setMessages(prev => prev.filter(m => 
          !m.transaction || (m.transaction.id !== transactionId && m.transaction._id !== transactionId)
        ));

        console.log('Transaction removed from chat cache');
      } catch { /* ignore */ }
    };

    window.addEventListener('wallet:transaction-edited', handleEdit);
    window.addEventListener('wallet:transaction-deleted', handleDelete);
    return () => {
      window.removeEventListener('wallet:transaction-edited', handleEdit);
      window.removeEventListener('wallet:transaction-deleted', handleDelete);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Parse the transaction
    const parseResult = parseTransaction(message);
    let botResponse;

    if (parseResult.success) {
      // Add original message and source to transaction data for Firebase storage
      const transactionWithMeta = {
        ...parseResult.data,
        originalMessage: message,
        source: 'chat-widget'
      };
      const addResult = await addTransaction(user.uid, transactionWithMeta);
      if (addResult.success) {
        // Refresh user profile to get updated balance
        const updatedProfile = await refreshUserProfile();
        
        // Check budget after transaction (only for expenses)
        if (parseResult.data.type === 'expense' && userProfile?.budgetAlerts && userProfile?.monthlyBudget) {
          try {
            const transactionsResult = await getTransactions(user.uid);
            if (transactionsResult.success) {
              const budgetCheck = checkBudgetAfterTransaction(userProfile, transactionsResult.data, parseResult.data);
              if (budgetCheck.needsAlert) {
                setBudgetAlert({ 
                  open: true, 
                  message: budgetCheck.alertMessage, 
                  type: budgetCheck.alertType === 'danger' ? 'error' : budgetCheck.alertType === 'warning' ? 'warning' : 'info' 
                });
              }
            }
          } catch (error) {
            console.warn('Budget check failed:', error);
          }
        }
        
        // Call parent callback to refresh other components
        if (onTransactionAdded) onTransactionAdded();
        
        // Dispatch global event for real-time updates
        try {
          window.dispatchEvent(new CustomEvent('wallet:transaction-added', {
            detail: { transactionId: addResult.id, transaction: parseResult.data }
          }));
          console.log('ChatWidget: Dispatched transaction-added event');
        } catch (error) {
          console.warn('Failed to dispatch transaction-added event:', error);
        }

        // Create transaction object with Firebase ID for proper tracking
        const transactionWithId = { 
          ...parseResult.data, 
          id: addResult.id  // Include Firebase ID from addTransaction result
        };
        
        // Create enhanced transaction message with balance context
        let balanceInfo = '';
        if (updatedProfile) {
          const currency = userProfile?.currency || 'BDT';
          if (transactionWithId.type === 'income') {
            balanceInfo = `\n\n💳 Balance Updated: ${updatedProfile.balance} ${currency}\n📈 Income Added: +${transactionWithId.amount} ${currency}`;
          } else if (transactionWithId.type === 'expense') {
            balanceInfo = `\n\n💳 Balance Updated: ${updatedProfile.balance} ${currency}\n📉 Expense Deducted: -${transactionWithId.amount} ${currency}`;
          } else {
            balanceInfo = `\n\n💳 New Balance: ${updatedProfile.balance} ${currency}`;
          }
        }
        
        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: formatTransactionMessage(transactionWithId) + balanceInfo,
          transaction: { ...transactionWithId, originalMessage: message }
        };
        
        // Persist this transaction to localStorage with Firebase ID for tracking
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = 'wallet_last_transactions';
            const raw = localStorage.getItem(key);
            let arr = [];
            if (raw) {
              arr = JSON.parse(raw);
              if (!Array.isArray(arr)) arr = [];
            }
            // Prepend new transaction with Firebase ID, dedupe by id if present
            const newItem = { 
              ...transactionWithId, 
              savedAt: Date.now(), 
              originalMessage: message,
              source: 'chat-widget'
            };
            const deduped = [newItem, ...arr.filter(a => a.id !== newItem.id && a._id !== newItem._id)];
            const sliced = deduped.slice(0, 10);
            localStorage.setItem(key, JSON.stringify(sliced));
            setSavedTransactions(sliced);
            console.log('Saved transaction with Firebase ID:', newItem.id);
          }
        } catch (e) {
          // non-fatal
          console.warn('Failed to persist saved transaction', e);
        }
      } else {
        botResponse = { id: Date.now() + 1, type: 'bot', content: `Failed to save transaction: ${addResult.error}` };
      }
    } else {
      botResponse = { id: Date.now() + 1, type: 'bot', content: parseResult.error || 'Sorry, I could not understand.' };
    }

    setMessages(prev => [...prev, botResponse]);
    setMessage('');
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mobile: full screen drawer, Desktop: floating card
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-br from-teal-500 to-blue-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:scale-105 transform-gpu transition-transform z-[120]"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    );
  }

  return (
    <div>
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-80 sm:w-96 md:w-[400px] lg:w-[420px] h-[72vh] md:h-[540px] z-[120]">
        <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-sm md:text-base">Wallet Assistant</div>
                  <button onClick={() => setPendingClear(true)} title="Clear recent" className="ml-1 p-1 rounded hover:bg-white/20">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="text-xs opacity-90">Type your transaction in plain language</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsOpen(false); }}
                aria-label="Close chat"
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {/* right-side controls */}
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${msg.type === 'user' ? 'bg-teal-600 text-white rounded-2xl rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-none'} max-w-[85%] p-3 relative`}> 
                  <div className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</div>
                  {msg.transaction && (
                    <div className="mt-2 text-xs opacity-80 flex items-center gap-2 flex-wrap">
                      <span>{getCategoryEmoji(msg.transaction.category)} {msg.transaction.category}</span>
                      <button onClick={() => setPendingDeleteSavedKey(msg.savedKey)} className="text-red-500 text-xs underline">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <div className="text-sm">Processing...</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="e.g. Lunch 250"
                className="flex-1 resize-none px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                aria-label="Type your transaction"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !message.trim()}
                className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-lg p-2 disabled:opacity-50 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Delete Dialog with Options */}
          {pendingDeleteSavedKey && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 shadow-lg ring-1 ring-black/10 mx-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Delete Transaction</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Choose how you want to delete this transaction:
                </p>
                
                <div className="space-y-3 mb-6">
                  <button
                    onClick={async () => {
                      await handleDeleteTransaction(true); // Delete from database
                    }}
                    className="w-full p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="font-medium text-red-700 dark:text-red-400">Delete from Account</div>
                    <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                      Permanently remove from your transaction history and update balance
                    </div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      await handleDeleteTransaction(false); // Delete only from chat
                    }}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-medium text-gray-700 dark:text-gray-300">Remove from Chat Only</div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                      Keep transaction in your account, just hide from this chat
                    </div>
                  </button>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPendingDeleteSavedKey(null)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <ConfirmDialog open={!!pendingClear} title="Clear all recent replies" description="This will remove all saved recent replies from chat only. Transactions remain in your main list unless deleted individually." onConfirm={async () => {
            console.log('Clearing all recent chat replies');
            
            try {
              // Note: This only clears the chat widget's saved replies, not the actual transactions from Firebase
              // Users can still see their transactions in the main transaction list
              // To delete from Firebase, they need to use individual delete buttons
              
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('wallet_last_transactions');
                setSavedTransactions([]);
                setMessages(prev => prev.filter(m => !String(m.id).startsWith('saved-')));
                console.log('Cleared localStorage saved transactions');
              }

              // Dispatch event to notify other components that chat cache was cleared
              window.dispatchEvent(new CustomEvent('wallet:chat-cache-cleared'));

              setToast({ open: true, message: 'Cleared recent chat replies', type: 'info' });
              
            } catch (e) {
              console.error('Failed to clear saved transactions:', e);
              setToast({ open: true, message: 'Failed to clear replies', type: 'error' });
            }
            
            setPendingClear(false);
          }} onCancel={() => setPendingClear(false)} />
          <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
          <Toast open={budgetAlert.open} message={budgetAlert.message} type={budgetAlert.type} onClose={() => setBudgetAlert({ open: false, message: '', type: 'info' })} />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;