import React from 'react';
import { HelpCircle, MessageCircle, Zap, BarChart3, Shield } from 'lucide-react';
import Modal from '../UI/Modal';

const HelpModal = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Smart Chat Interface',
      description: 'Simply describe your transaction in natural language like "I bought groceries for 500 taka" and the AI will automatically categorize it.'
    },
    {
      icon: Zap,
      title: 'Real-time Balance',
      description: 'Your balance updates instantly when you add, edit, or delete transactions. All calculations happen automatically.'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'View spending patterns, budget alerts, and detailed transaction history with interactive charts.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'All your data is securely stored with Firebase and only accessible to you. Export your data anytime.'
    }
  ];

  const tips = [
    'Use natural language: "Paid 200 for lunch" works just as well as structured input',
    'Set a monthly budget in your profile to get spending alerts',
    'The balance includes income, expenses, credits given, and loans taken',
    'Edit any transaction by clicking on it in your transaction list',
    'Export your data anytime from the settings menu',
    'Switch between English and Bengali with the language toggle'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Tips" size="lg">
      <div className="space-y-8">
        {/* Features */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Tips
          </h3>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Transaction Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">Income</h4>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                Money you receive (salary, freelance, refunds)
              </p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-200 text-sm">Expense</h4>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Money you spend (food, transport, bills)
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">Credit Given</h4>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Money you lend to others
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">Loan Taken</h4>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                Money you borrow from others
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Need more help? Check the documentation or contact support.
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;