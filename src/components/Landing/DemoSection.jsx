import React from 'react';

const DemoSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            See it in action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Natural language input makes tracking effortless
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
          <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">Wallet Tracker</span>
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-md max-w-xs">
                  "I bought groceries for $75 today"
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-2xl rounded-tl-md max-w-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🍔</span>
                    <span className="font-medium">Food & Dining</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Amount: $75.00 • Type: Expense • Date: Today
                  </div>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ Transaction added successfully
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;