import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, MessageCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { parseTransaction, formatTransactionMessage, getCategoryEmoji } from '../../utils/transactionParser';
import { addTransaction } from '../../services/transactionService';
import EditParsedModal from './EditParsedModal';
import ConfirmDialog from '../UI/ConfirmDialog';
import Toast from '../UI/Toast';

const ChatWidget = ({ onTransactionAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, refreshUserProfile } = useAuth();
  const messagesRef = useRef(null);
  const [editing, setEditing] = useState({ open: false, original: null, parsed: null, idx: null });
  const [savedTransactions, setSavedTransactions] = useState([]);
  const [pendingDeleteSavedKey, setPendingDeleteSavedKey] = useState(null);
  const [pendingClear, setPendingClear] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

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

  useEffect(() => {
    // Add welcome message when chat opens. If we have saved transactions, seed them as bot replies so
    // users always see their last few parsed transactions in the widget.
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

  // Listen for edits made elsewhere (TransactionList) and update saved list + messages
  useEffect(() => {
    const handler = (e) => {
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
    window.addEventListener('wallet:transaction-edited', handler);
    return () => window.removeEventListener('wallet:transaction-edited', handler);
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
      const addResult = await addTransaction(user.uid, parseResult.data);
      if (addResult.success) {
        // Refresh user profile to get updated balance
        const updatedProfile = await refreshUserProfile();
        
        // Call parent callback to refresh other components
        if (onTransactionAdded) onTransactionAdded();

        botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: formatTransactionMessage(parseResult.data) + (updatedProfile ? `\n\n💳 New Balance: ${updatedProfile.balance} BDT` : ''),
          transaction: parseResult.data
        };
        // Persist this parsed transaction to last-10 saved list in localStorage (safe guards)
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const key = 'wallet_last_transactions';
            const raw = localStorage.getItem(key);
            let arr = [];
            if (raw) {
              arr = JSON.parse(raw);
              if (!Array.isArray(arr)) arr = [];
            }
            // Prepend new transaction, dedupe by id if present
            const newItem = { ...parseResult.data, savedAt: Date.now(), originalMessage: message };
            const deduped = [newItem, ...arr.filter(a => a.id !== newItem.id && a._id !== newItem._id)];
            const sliced = deduped.slice(0, 10);
            localStorage.setItem(key, JSON.stringify(sliced));
            setSavedTransactions(sliced);
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
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-80 sm:w-96 h-[72vh] md:h-[540px] z-[120]">
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
                    <div className="mt-2 text-xs opacity-80 flex items-center gap-2">
                      <span>{getCategoryEmoji(msg.transaction.category)} {msg.transaction.category}</span>
                      <button onClick={() => setEditing({ open: true, original: msg.content, parsed: { ...msg.transaction, userId: user?.uid }, idx: msg.id })} className="text-teal-600 text-xs underline">Edit</button>
                      <button onClick={() => setPendingDeleteSavedKey(msg.savedKey)} className="text-red-500 text-xs underline ml-2">Delete</button>
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
          <EditParsedModal open={editing.open} onClose={() => setEditing({ open: false, original: null, parsed: null, idx: null })} originalMessage={editing.original} parsed={editing.parsed} onSave={async (updated) => {
            // EditParsedModal already handles database updates, so we just need to:
            // 1. Refresh user profile to get updated balance
            // 2. Notify parent component about the update
            try {
              if (editing.parsed?.id && user?.uid) {
                // Refresh user profile to get updated balance
                await refreshUserProfile();
                
                // Notify parent component about the transaction update
                if (onTransactionAdded) {
                  onTransactionAdded();
                }
              }
            } catch (error) {
              console.error('Error refreshing after transaction update:', error);
            }

            // Update the chat message content and transaction object when user saves edits.
            setMessages(prev => prev.map(m => {
              // match by the message id stored in editing.idx (this is the message id, e.g., 'saved-bot-...')
              if (m.id === editing.idx) {
                const newTx = m.transaction ? { ...m.transaction, ...updated } : { ...updated };
                return { ...m, transaction: newTx, content: formatTransactionMessage(newTx) };
              }
              // fallback: also match by transaction id if present
              if (m.transaction && (m.transaction.id === editing.parsed?.id || m.transaction._id === editing.parsed?._id)) {
                const newTx = { ...m.transaction, ...updated };
                return { ...m, transaction: newTx, content: formatTransactionMessage(newTx) };
              }
              return m;
            }));

            // Update savedTransactions array and persist to localStorage if this edited item exists there
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                const key = 'wallet_last_transactions';
                const raw = localStorage.getItem(key);
                let arr = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(arr)) arr = [];

                // derive savedKey from editing.idx when it's a seeded saved-bot id
                let savedKey = null;
                if (typeof editing.idx === 'string' && editing.idx.startsWith('saved-bot-')) {
                  savedKey = editing.idx.replace('saved-bot-', '');
                }

                const newArr = arr.map(a => {
                  if ((updated.id && a.id === updated.id) || (a._id && a._id === updated._id) || (savedKey && `${a.id ?? a._id}_${a.savedAt ?? ''}` === savedKey)) {
                    return { ...a, ...updated };
                  }
                  return a;
                });
                localStorage.setItem(key, JSON.stringify(newArr));
                setSavedTransactions(newArr);
              }
            } catch (e) {
              console.warn('Failed to update savedTransactions after edit', e);
            }

            // Show success message if this was a database update
            if (editing.parsed?.id && user?.uid) {
              setToast({ open: true, message: 'Transaction updated successfully!', type: 'info' });
            }
            
            setEditing({ open: false, original: null, parsed: null, idx: null });
          }} />
          <ConfirmDialog open={!!pendingDeleteSavedKey} title="Delete saved reply" description="This will remove the saved bot reply and its original prompt. This action cannot be undone." onConfirm={() => {
            // perform delete
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                const key = 'wallet_last_transactions';
                const raw = localStorage.getItem(key);
                let arr = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(arr)) arr = [];
                const filtered = arr.filter(a => `${a.id ?? a._id}_${a.savedAt ?? ''}` !== String(pendingDeleteSavedKey));
                localStorage.setItem(key, JSON.stringify(filtered));
                setSavedTransactions(filtered);
                setMessages(prev => prev.filter(m => m.savedKey !== pendingDeleteSavedKey));
              }
            } catch (e) {
              console.warn('Failed to delete saved reply', e);
            }
            setPendingDeleteSavedKey(null);
            setToast({ open: true, message: 'Saved reply deleted', type: 'info' });
          }} onCancel={() => setPendingDeleteSavedKey(null)} />
          <ConfirmDialog open={!!pendingClear} title="Clear all recent replies" description="This will remove all saved recent replies. This action cannot be undone." onConfirm={() => {
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('wallet_last_transactions');
                setSavedTransactions([]);
                setMessages(prev => prev.filter(m => !String(m.id).startsWith('saved-')));
              }
            } catch (e) {
              console.warn('Failed to clear saved transactions', e);
            }
            setPendingClear(false);
            setToast({ open: true, message: 'Cleared recent replies', type: 'info' });
          }} onCancel={() => setPendingClear(false)} />
          <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;