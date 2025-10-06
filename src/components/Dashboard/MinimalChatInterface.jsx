import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { parseTransaction, formatTransactionMessage } from '../../utils/aiTransactionParser';
import { addTransaction, getUserProfile, getTransactions } from '../../services/transactionService';
import { checkBudgetAfterTransaction } from '../../services/budgetService';
import Toast from '../UI/Toast';

const MinimalChatInterface = ({ onTransactionAdded }) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [budgetAlert, setBudgetAlert] = useState({ open: false, message: '', type: 'info' });
  const { user, userProfile, setUserProfile } = useAuth();

  // Persist a user/bot chat pair to localStorage (wallet_chat_history), keep max 10
  const persistChatPair = (userPrompt, botReply) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const key = 'wallet_chat_history';
      const raw = localStorage.getItem(key);
      let arr = [];
      if (raw) {
        arr = JSON.parse(raw);
        if (!Array.isArray(arr)) arr = [];
      }

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
        savedAt: Date.now(),
        user: userPrompt,
        bot: botReply
      };

      const combined = [item, ...arr];
      // Dedupe exact pairs (keep newest)
      const deduped = combined.filter((it, idx, self) =>
        idx === self.findIndex(x => x.user === it.user && x.bot === it.bot)
      );
      const sliced = deduped.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(sliced));
      console.log('MinimalChatInterface: persisted chat pair', item);
    } catch (e) {
      console.warn('MinimalChatInterface: failed to persist chat pair', e);
    }
  };

  // Remove predefined suggestions - let users express freely

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      // Parse the transaction with await since it's async
      const parseResult = await parseTransaction(message);
      
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
              source: 'chat-interface'
            };
            // Try to add transaction to Firebase
            const addResult = await addTransaction(user.uid, transactionWithMeta);
        
            if (addResult.success) {
              savedTransactions.push({
                ...transaction,
                id: addResult.id,
                originalMessage: message,
                userId: user.uid
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
          const profileResult = await getUserProfile(user.uid);
          if (profileResult.success) {
            setUserProfile(profileResult.data);
          }

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

          // Show success feedback for multiple transactions
          let feedbackMessage = '';
          let primaryTransaction = savedTransactions[0];
          
          if (savedTransactions.length === 1) {
            // Single transaction - use existing format
            feedbackMessage = formatTransactionMessage(savedTransactions[0]);
          } else {
            // Multiple transactions - create summary
            feedbackMessage = `✅ Added ${savedTransactions.length} transactions:\n\n`;
            savedTransactions.forEach((tx, i) => {
              const emoji = tx.type === 'income' ? '💰' : '💸';
              feedbackMessage += `${i + 1}. ${emoji} ${tx.type === 'income' ? 'Income' : 'Expense'}: ${tx.amount} BDT\n`;
              feedbackMessage += `   📝 ${tx.description}\n`;
              feedbackMessage += `   🏷️ ${tx.category}\n\n`;
            });
          }

          setFeedback({
            type: 'success',
            message: feedbackMessage,
            transaction: primaryTransaction,
            transactions: savedTransactions // Store all transactions
          });

          // Persist the chat pair (user prompt + bot reply) to local storage so ChatWidget can show it
          try {
            persistChatPair(message, feedbackMessage);
          } catch (e) {
            console.warn('MinimalChatInterface: persistChatPair failed', e);
          }

          // Persist all transactions to shared localStorage
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
                source: 'chat-interface'
              }));
              
              // Prepend new transactions and dedupe
              const combined = [...newItems, ...arr];
              const deduped = combined.filter((item, index, self) => 
                index === self.findIndex(t => t.id === item.id)
              );
              const sliced = deduped.slice(0, 10);
              
              localStorage.setItem(key, JSON.stringify(sliced));
              console.log(`MinimalChatInterface: Saved ${savedTransactions.length} transactions to localStorage`);
            }
          } catch (e) {
            console.warn('Failed to persist saved transactions from MinimalChatInterface', e);
          }

          // Call parent callback if provided
          if (onTransactionAdded) {
            onTransactionAdded();
          }
          
          // Dispatch global events for all saved transactions
          try {
            savedTransactions.forEach(tx => {
              window.dispatchEvent(new CustomEvent('wallet:transaction-added', {
                detail: { transactionId: tx.id, transaction: tx }
              }));
            });
            console.log(`MinimalChatInterface: Dispatched ${savedTransactions.length} transaction-added events`);
          } catch (error) {
            console.warn('Failed to dispatch transaction-added events:', error);
          }
        } else {
          setFeedback({
            type: 'error',
            message: `Failed to save ${savedTransactions.length > 0 ? 'some' : 'all'} transactions: ${firstError}`
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
        <div className={`mb-4 p-4 rounded-lg border relative ${
          feedback.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        } animate-in fade-in duration-300`}>
          {/* Close Button */}
          <button
            onClick={() => setFeedback(null)}
            className={`absolute top-3 right-3 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
              feedback.type === 'success'
                ? 'text-green-600 dark:text-green-400 hover:bg-green-600'
                : 'text-red-600 dark:text-red-400 hover:bg-red-600'
            }`}
            aria-label="Close feedback"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-3 pr-8">
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