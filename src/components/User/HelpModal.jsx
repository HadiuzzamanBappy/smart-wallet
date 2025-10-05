import React, { useState } from 'react';
import { 
  MessageCircle, 
  Book, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CreditCard,
  PieChart,
  Shield
} from 'lucide-react';

const HelpModal = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I add a transaction?",
      answer: "You can add transactions by typing natural language in the chat input, like 'I spent $50 on groceries' or 'I received $1000 salary'. The AI will automatically parse and categorize your transaction."
    },
    {
      id: 2,
      question: "How does the budget tracking work?",
      answer: "Set your monthly budget in Settings. The app will track your expenses against this budget and show you progress. You'll get alerts when you exceed 80% of your budget."
    },
    {
      id: 3,
      question: "Can I edit or delete transactions?",
      answer: "Yes! Go to the Recent Transactions section, find the transaction you want to modify, and use the edit or delete buttons. Changes are saved automatically."
    },
    {
      id: 4,
      question: "How do I change my currency?",
      answer: "Go to Settings > Currency & Budget and select your preferred currency. All transactions will be displayed in the selected currency."
    },
    {
      id: 5,
      question: "Is my financial data secure?",
      answer: "Yes, all your data is encrypted and stored securely using Firebase. We follow industry-standard security practices and never share your personal financial information."
    },
    {
      id: 6,
      question: "How do I export my data?",
      answer: "You can export your transaction history as CSV or PDF from the Analytics section. This feature helps you with tax preparation or personal record keeping."
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <a
          href="mailto:support@wallettracker.com"
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Email Support</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Get help via email</p>
          </div>
          <ExternalLink className="w-4 h-4 text-blue-400 ml-auto" />
        </a>
      </div>

      {/* Feature Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Key Features
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Natural Language Input</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add transactions by simply describing them in plain English</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Smart Categorization</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatic categorization of expenses and income</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Analytics & Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visual charts and spending analysis</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Secure & Private</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your financial data is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h3>
        
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                {expandedFaq === faq.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-700">
        <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-3">
          Need More Help?
        </h3>
        <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
          Our support team is here to help you get the most out of Wallet Tracker.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 text-sm">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Mail className="w-4 h-4" />
            hbappy79@gmail.com
          </div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Phone className="w-4 h-4" />
            +880-1521-318670
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Wallet Tracker v1.0.0
        </p>
      </div>
    </div>
  );
};

export default HelpModal;