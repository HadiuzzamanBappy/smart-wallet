import React, { useState, useRef } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { addTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';
import { encryptMessageData } from '../../utils/encryption';

const ChatWidget = ({ onTransactionAdded, className = '' }) => {
  const { user, refreshUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [parsedTransactions, setParsedTransactions] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const textareaRef = useRef(null);

  // Parse-only: produce parsed transactions and open preview
  const handleParseMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setLastResponse(null);
    setParsedTransactions(null);

    try {
      const parseResult = await parseTransaction(message);

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
      // Encrypt the original message once and reuse
      const messageData = await encryptMessageData({ originalMessage: message });

      let added = 0;
      for (const transaction of parsedTransactions) {
        const addResult = await addTransaction(user.uid, {
          ...transaction,
          // Ensure date is properly formatted as Date object
          date: transaction.date ? new Date(transaction.date) : new Date(),
          originalMessage_encrypted: messageData.originalMessage_encrypted,
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

  return (
    <div className={`relative ${className}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
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
                
                {/* Show parsed transactions */}
                {lastResponse.transactions && (
                  <div className="mt-2 space-y-1">
                    {lastResponse.transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span>
                          {getCategoryEmoji(transaction.category)} {transaction.description}
                        </span>
                        <span className={`font-medium ${
                          transaction.type === 'income' || transaction.type === 'loan' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}
                          {transaction.amount} BDT
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
                  placeholder="e.g., 'I bought groceries for 500 taka today'"
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
            {isPreviewOpen && parsedTransactions && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium mb-2">Preview parsed transactions</p>
                <div className="space-y-2 max-h-44 overflow-auto mb-3">
                  {parsedTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-700/40 rounded">
                      <span>
                        {getCategoryEmoji(transaction.category)} {transaction.description}
                      </span>
                      <span className={`font-medium ${
                        transaction.type === 'income' || transaction.type === 'loan' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' || transaction.type === 'loan' ? '+' : '-'}{transaction.amount} BDT
                      </span>
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
                          <div className="text-[11px] text-gray-600 dark:text-gray-300">Bought groceries for 500 BDT today</div>
                        </div>
                    <button
                      onClick={() => { setMessage('Bought groceries for 500 BDT today'); textareaRef.current?.focus(); }}
                      className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                    >Use</button>
                  </div>

                  <div className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                    <div className="flex-1 pr-2">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300">type:expense amount:250 currency:BDT category:food note:Lunch</div>
                        </div>
                    <button
                      onClick={() => { setMessage('type:expense amount:250 currency:BDT category:food note:Lunch'); textareaRef.current?.focus(); }}
                      className="ml-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
                    >Use</button>
                  </div>

                  <div className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/40 p-2 rounded">
                    <div className="flex-1 pr-2">
                          <div className="text-[11px] text-gray-600 dark:text-gray-300">Lunch 250\nTaxi 120\nSalary 50000 2025-10-01</div>
                        </div>
                    <button
                      onClick={() => { setMessage('Lunch 250\nTaxi 120\nSalary 50000 2025-10-01'); textareaRef.current?.focus(); }}
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