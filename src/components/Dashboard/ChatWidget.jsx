import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { parseTransaction, formatTransactionMessage, getCategoryEmoji } from '../../utils/aiTransactionParser';
import { addTransaction, getTransactions } from '../../services/transactionService';
import { checkBudgetAfterTransaction } from '../../services/budgetService';

import Toast from '../UI/Toast';

const ChatWidget = ({ onTransactionAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, refreshUserProfile } = useAuth();
  const messagesRef = useRef(null);

  const [savedTransactions, setSavedTransactions] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [budgetAlert, setBudgetAlert] = useState({ open: false, message: '', type: 'info' });



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

  // Load saved chat history (user prompt + bot reply) from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem('wallet_chat_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Ensure chats are stored in chronological order (oldest first)
          const ordered = parsed.slice().sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
          setSavedChats(ordered);
        }
      }
    } catch (e) {
      console.warn('Failed to read chat history from localStorage', e);
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
      // Build paired user->bot messages for each saved chat (from local storage)
      const seeded = [];
      // Ensure chats are shown oldest-first so last added appears last
      const ordered = savedChats.slice().sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      ordered.forEach((c, idx) => {
        const key = `${c.id ?? idx}_${c.savedAt ?? ''}`;
        const userMsg = {
          id: `saved-user-${key}`,
          type: 'user',
          content: c.user || '',
          savedKey: key
        };
        const botMsg = {
          id: `saved-bot-${key}`,
          type: 'bot',
          content: c.bot || '',
          savedKey: key
        };
        seeded.push(userMsg, botMsg);
      });

      setMessages([welcome, ...seeded]);
    }
  }, [isOpen, messages.length, userProfile, savedTransactions, savedChats]);

  // Save a chat pair (user prompt + bot reply) to localStorage (max 10 newest)
  const persistChatPair = (userPrompt, botReply) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const key = 'wallet_chat_history';
      const raw = localStorage.getItem(key);
      let arr = [];
      if (raw) {
        arr = JSON.parse(raw);
        if (!Array.isArray(arr)) arr = [];
      }

      const newItem = { id: Date.now(), savedAt: Date.now(), user: userPrompt, bot: botReply };
      const combined = [...arr, newItem]; // append to keep arr oldest-first
      // Sort oldest-first just in case
      const ordered = combined.slice().sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      const sliced = ordered.slice(-10); // keep last 10 (newest) but ordered oldest-first
      localStorage.setItem(key, JSON.stringify(sliced));
      setSavedChats(sliced);
    } catch (err) {
      console.warn('Failed to persist chat pair', err);
    }
  };

  // Clear local chat history (remove from localStorage)
  const clearLocalChatHistory = () => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem('wallet_chat_history');
      setSavedChats([]);
      // also clear any cached savedTransactions? we keep them separate
      setToast({ open: true, message: 'Local chat history cleared', type: 'info' });
    } catch (err) {
      console.warn('Failed to clear chat history', err);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);



  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Parse the transaction with await since it's async
    const parseResult = await parseTransaction(message);
    let botResponse;

    if (parseResult.success) {
      // Handle array of transactions from AI parser
      const transactions = Array.isArray(parseResult.data) ? parseResult.data : [parseResult.data];
      
      // Save all transactions to Firebase
      const savedTransactions = [];
      let allSuccessful = true;
      let firstError = null;
      
      for (const transaction of transactions) {
        try {
          // Add original message and source to transaction data for Firebase storage
          const transactionWithMeta = {
            ...transaction,
            originalMessage: message,
            source: 'chat-widget'
          };
          const addResult = await addTransaction(user.uid, transactionWithMeta);
          
          if (addResult.success) {
            savedTransactions.push({
              ...transaction,
              id: addResult.id,
              originalMessage: message
            });
          } else {
            allSuccessful = false;
            if (!firstError) firstError = addResult.error;
          }
        } catch (error) {
          allSuccessful = false;
          if (!firstError) firstError = error.message;
        }
      }
      
      if (allSuccessful && savedTransactions.length > 0) {
        // Refresh user profile to get updated balance
        const updatedProfile = await refreshUserProfile();
        
        // Check budget after transactions (only for expenses)
        const expenseTransactions = savedTransactions.filter(tx => tx.type === 'expense');
        if (expenseTransactions.length > 0 && userProfile?.budgetAlerts && userProfile?.monthlyBudget) {
          try {
            const transactionsResult = await getTransactions(user.uid);
            if (transactionsResult.success) {
              for (const expenseTx of expenseTransactions) {
                const budgetCheck = checkBudgetAfterTransaction(userProfile, transactionsResult.data, expenseTx);
                if (budgetCheck.needsAlert) {
                  setBudgetAlert({ 
                    open: true, 
                    message: budgetCheck.alertMessage, 
                    type: budgetCheck.alertType === 'danger' ? 'error' : budgetCheck.alertType === 'warning' ? 'warning' : 'info' 
                  });
                  break; // Show only first budget alert
                }
              }
            }
          } catch (error) {
            console.warn('Budget check failed:', error);
          }
        }
        
        // Call parent callback to refresh other components
        if (onTransactionAdded) onTransactionAdded();
        
        // Dispatch global events for all saved transactions
        try {
          savedTransactions.forEach(tx => {
            window.dispatchEvent(new CustomEvent('wallet:transaction-added', {
              detail: { transactionId: tx.id, transaction: tx }
            }));
          });
          console.log(`ChatWidget: Dispatched ${savedTransactions.length} transaction-added events`);
        } catch (error) {
          console.warn('Failed to dispatch transaction-added events:', error);
        }

        // Create bot response message for multiple transactions
        let responseContent = '';
        let balanceInfo = '';
        
        if (savedTransactions.length === 1) {
          // Single transaction - use existing format
          const tx = savedTransactions[0];
          responseContent = formatTransactionMessage(tx);
        } else {
          // Multiple transactions - create summary
          responseContent = `✅ Added ${savedTransactions.length} transactions:\n\n`;
          savedTransactions.forEach((tx, i) => {
            const emoji = tx.type === 'income' ? '💰' : '💸';
            responseContent += `${i + 1}. ${emoji} ${tx.type === 'income' ? 'Income' : 'Expense'}: ${tx.amount} BDT\n`;
            responseContent += `   📝 ${tx.description}\n`;
            responseContent += `   🏷️ ${tx.category}\n\n`;
          });
        }
        
        // Add balance info
        if (updatedProfile) {
          const currency = userProfile?.currency || 'BDT';
          const totalIncome = savedTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
          const totalExpense = savedTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
          
          balanceInfo = `\n💳 Balance Updated: ${updatedProfile.balance} ${currency}`;
          if (totalIncome > 0) balanceInfo += `\n� Income Added: +${totalIncome} ${currency}`;
          if (totalExpense > 0) balanceInfo += `\n� Expense Deducted: -${totalExpense} ${currency}`;
        }
        
        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: responseContent + balanceInfo,
          transaction: savedTransactions[0], // For compatibility, store first transaction
          transactions: savedTransactions // Store all transactions
        };

        // Persist chat pair to localStorage (user message and bot response summary)
        try {
          persistChatPair(message, responseContent + balanceInfo);
        } catch (err) {
          console.warn('Failed to persist chat pair:', err);
        }
        
        // Persist all transactions to localStorage
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = 'wallet_last_transactions';
            const raw = localStorage.getItem(key);
            let arr = [];
            if (raw) {
              arr = JSON.parse(raw);
              if (!Array.isArray(arr)) arr = [];
            }
            
            // Add all saved transactions to localStorage
            const newItems = savedTransactions.map(tx => ({
              ...tx,
              savedAt: Date.now(),
              originalMessage: message,
              source: 'chat-widget'
            }));
            
            // Prepend new transactions and dedupe
            const combined = [...newItems, ...arr];
            const deduped = combined.filter((item, index, self) => 
              index === self.findIndex(t => t.id === item.id)
            );
            const sliced = deduped.slice(0, 10);
            
            localStorage.setItem(key, JSON.stringify(sliced));
            setSavedTransactions(sliced);
            console.log(`Saved ${savedTransactions.length} transactions to localStorage`);
          }
        } catch (e) {
          console.warn('Failed to persist saved transactions', e);
        }
      } else {
        botResponse = { 
          id: Date.now() + 1, 
          type: 'bot', 
          content: `Failed to save ${savedTransactions.length > 0 ? 'some' : 'all'} transactions: ${firstError}` 
        };
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
              <button
                onClick={clearLocalChatHistory}
                title="Clear local chat history"
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
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


          <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
          <Toast open={budgetAlert.open} message={budgetAlert.message} type={budgetAlert.type} onClose={() => setBudgetAlert({ open: false, message: '', type: 'info' })} />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;