import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import Modal from '../UI/Modal';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';

const BalanceModal = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!userProfile) return null;

  const {
    balance = 0,
    totalIncome = 0,
    totalExpense = 0,
    totalCreditGiven = 0,
    totalLoanTaken = 0,
    currency = 'BDT'
  } = userProfile;

  const netLending = totalCreditGiven - totalLoanTaken;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Balance Details" size="md">
      <div className="space-y-6">
        {/* Current Balance */}
        <div className="text-center p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Balance</h3>
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {formatCurrency(balance, currency)}
          </div>
        </div>

        {/* Toggle Details */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>
        </div>

        {/* Balance Breakdown */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 dark:text-green-300">Total Income</span>
                <span className="font-semibold text-green-800 dark:text-green-200">
                  +{formatCurrency(totalIncome, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 dark:text-red-300">Total Expenses</span>
                <span className="font-semibold text-red-800 dark:text-red-200">
                  -{formatCurrency(totalExpense, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Credit Given</span>
                <span className="font-semibold text-blue-800 dark:text-blue-200">
                  -{formatCurrency(totalCreditGiven, currency)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700 dark:text-purple-300">Loans Taken</span>
                <span className="font-semibold text-purple-800 dark:text-purple-200">
                  +{formatCurrency(totalLoanTaken, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Net Lending */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Net Lending Position</span>
              <span className={`font-semibold ${
                netLending > 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : netLending < 0
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {netLending > 0 && '+'}
                {formatCurrency(Math.abs(netLending), currency)}
                {netLending > 0 && ' (You lent more)'}
                {netLending < 0 && ' (You borrowed more)'}
                {netLending === 0 && ' (Balanced)'}
              </span>
            </div>
          </div>
        )}

        {/* Balance Formula */}
        {showDetails && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            Balance = Income + Loans Taken - Expenses - Credit Given
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BalanceModal;