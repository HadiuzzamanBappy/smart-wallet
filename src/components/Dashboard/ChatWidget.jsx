import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { parseTransaction } from '../../utils/aiTransactionParser';
import { addTransaction } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';

const ChatWidget = ({ onTransactionAdded, className = '' }) => {
  const { user, refreshUserProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setLastResponse(null);

    try {
      // Parse the message
      const parseResult = await parseTransaction(message);
      
      if (parseResult.success) {
        // Add transactions to database
        for (const transaction of parseResult.data) {
          const addResult = await addTransaction(user.uid, {
            ...transaction,
            originalMessage: message,
            source: 'chat'
          });
          
          if (!addResult.success) {
            console.error('Failed to add transaction:', addResult.error);
          }
        }

        // Refresh user profile and notify parent
        await refreshUserProfile();
        onTransactionAdded?.();

        // Show success response
        setLastResponse({
          type: 'success',
          message: `Successfully added ${parseResult.data.length} transaction${parseResult.data.length > 1 ? 's' : ''}!`,
          transactions: parseResult.data
        });

        setMessage('');
      } else {
        setLastResponse({
          type: 'error',
          message: parseResult.error || 'Could not understand your message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setLastResponse({
        type: 'error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            {/* Last Response */}
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., 'I bought groceries for 500 taka today'"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent resize-none"
                  rows="2"
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
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Processing...' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Examples */}
            {!lastResponse && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-1">Examples:</p>
                <ul className="space-y-0.5">
                  <li>• "Lunch at restaurant 250 taka"</li>
                  <li>• "Got salary 50000 BDT"</li>
                  <li>• "Lent 1000 to friend"</li>
                </ul>
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