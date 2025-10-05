import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { parseTransaction, formatTransactionMessage, getCategoryEmoji } from '../../utils/transactionParser';
import { addTransaction, getUserProfile, getTransactions } from '../../services/transactionService';
import { checkBudgetAfterTransaction } from '../../services/budgetService';
import EditParsedModal from './EditParsedModal';
import Toast from '../UI/Toast';

const MinimalChatInterface = ({ onTransactionAdded }) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState({ open: false, original: null, parsed: null });
  const [budgetAlert, setBudgetAlert] = useState({ open: false, message: '', type: 'info' });
  const { user, userProfile, setUserProfile, refreshUserProfile } = useAuth();

  // Remove predefined suggestions - let users express freely

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      // Parse the transaction
      const parseResult = parseTransaction(message);
      
      if (parseResult.success) {
        // Add original message and source to transaction data for Firebase storage
        const transactionWithMeta = {
          ...parseResult.data,
          originalMessage: message,
          source: 'chat-interface'
        };
        // Try to add transaction to Firebase
        const addResult = await addTransaction(user.uid, transactionWithMeta);
        
        if (addResult.success) {
          // Refresh user profile to get updated balance
          const profileResult = await getUserProfile(user.uid);
          if (profileResult.success) {
            setUserProfile(profileResult.data);
          }

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

          // Show success feedback
          setFeedback({
            type: 'success',
            message: formatTransactionMessage(parseResult.data),
            transaction: { ...parseResult.data, id: addResult.id, userId: user.uid }
          });

          // Persist to shared last-10 saved transactions so ChatWidget and others can show it
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const key = 'wallet_last_transactions';
              const raw = localStorage.getItem(key);
              let arr = [];
              if (raw) {
                arr = JSON.parse(raw);
                if (!Array.isArray(arr)) arr = [];
              }
              const newItem = { ...parseResult.data, id: addResult.id, userId: user.uid, savedAt: Date.now(), originalMessage: message, source: 'chat-interface' };
              const deduped = [newItem, ...arr.filter(a => a.id !== newItem.id && a._id !== newItem._id)];
              const sliced = deduped.slice(0, 10);
              localStorage.setItem(key, JSON.stringify(sliced));
            }
          } catch (e) {
            // non-fatal
            console.warn('Failed to persist saved transaction from MinimalChatInterface', e);
          }

          // Call parent callback if provided
          if (onTransactionAdded) {
            onTransactionAdded();
          }
          
          // Dispatch global event for real-time updates
          try {
            window.dispatchEvent(new CustomEvent('wallet:transaction-added', {
              detail: { transactionId: addResult.id, transaction: parseResult.data }
            }));
            console.log('MinimalChatInterface: Dispatched transaction-added event');
          } catch (error) {
            console.warn('Failed to dispatch transaction-added event:', error);
          }
        } else {
          setFeedback({
            type: 'error',
            message: `Failed to save transaction: ${addResult.error}`
          });
        }
      } else {
        setFeedback({
          type: 'error',
          message: parseResult.error
        });
      }
    } catch (error) {
      console.error('Transaction processing error:', error);
      setFeedback({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    }

    setMessage('');
    setShowSuggestions(false);
    setLoading(false);

  // Do NOT auto-hide feedback — let user dismiss or edit until a refresh
  // Keep feedback visible until user dismisses or navigates away
  };

  return (
    <div className="w-full hidden md:block">
      {/* Feedback Message */}
      {feedback && (
        <div className={`mb-4 p-4 rounded-lg border ${
          feedback.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        } animate-in fade-in duration-300`}>
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`text-sm whitespace-pre-line ${
                feedback.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {feedback.message}
              </div>
              {feedback.transaction && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                    {getCategoryEmoji(feedback.transaction.category)} {feedback.transaction.category}
                  </span>
                  <button onClick={() => setEditing({ open: true, original: feedback.message, parsed: { ...feedback.transaction, userId: user?.uid } })} className="ml-2 text-sm underline text-teal-600">Edit</button>
                  <button onClick={() => setFeedback(null)} className="ml-2 text-sm text-gray-500 hover:text-gray-700">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Chat Input - Stands Out */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 p-6 border border-dashed border-teal-500/50 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-2 bg-teal-500 dark:bg-teal-600 rounded-full">
            <Sparkles className="w-6 h-6 text-white flex-shrink-0" />
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Describe your transaction naturally... AI will understand!"
            disabled={loading}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 border-0 shadow-none outline-none focus:outline-none focus:ring-0 text-lg font-medium disabled:opacity-50 placeholder:text-base"
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="p-3 bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white rounded-2xl hover:from-teal-600 hover:to-teal-700 dark:hover:from-teal-700 dark:hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      <EditParsedModal open={editing.open} onClose={() => setEditing({ open: false, original: null, parsed: null })} originalMessage={editing.original} parsed={editing.parsed} onSave={async (updated) => {
        // Update feedback transaction locally to reflect corrections
        setFeedback(prev => prev ? { ...prev, transaction: { ...prev.transaction, ...updated }, message: formatTransactionMessage({ ...prev.transaction, ...updated }) } : prev);
        
        // Refresh user profile to update balance if this was a saved transaction
        if (editing.parsed?.id && user?.uid) {
          try {
            await refreshUserProfile();
            if (onTransactionAdded) {
              onTransactionAdded();
            }
          } catch (error) {
            console.error('Error refreshing user profile after transaction update:', error);
          }
        }
      }} />

      {/* Smart AI Help - Only show helpful context */}
      {showSuggestions && !feedback && (
        <div className="mt-6 animate-in fade-in duration-200">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl dark:border-blue-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500 dark:bg-blue-600 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                🤖 Smart AI Assistant Ready
              </p>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p>Just type naturally - I understand context and automatically categorize:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs">
                <div>💸 <strong>Expenses:</strong> "bought groceries 500", "paid rent 15000"</div>
                <div>💰 <strong>Income:</strong> "received salary 50000", "got payment 3000"</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Toast open={budgetAlert.open} message={budgetAlert.message} type={budgetAlert.type} onClose={() => setBudgetAlert({ open: false, message: '', type: 'info' })} />
    </div>
  );
};

export default MinimalChatInterface;