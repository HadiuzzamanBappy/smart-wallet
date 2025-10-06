import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTransactions } from '../../services/transactionService';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw, Plus } from 'lucide-react';
import { isCreditCategory, isLoanCategory } from '../../utils/aiTransactionParser';
import AddTransactionModal from '../Transaction/AddTransactionModal';

const CompactSummary = ({ refreshTrigger, onRefresh }) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [stats, setStats] = useState({
    balance: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    thisWeekChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const formatCurrency = (amount) => {
    const currency = userProfile?.currency || 'BDT';
    const currencyLocales = {
      BDT: 'en-BD',
      USD: 'en-US',
      EUR: 'en-DE',
      GBP: 'en-GB',
      INR: 'en-IN'
    };

    const locale = currencyLocales[currency] || 'en-BD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'BDT' ? 0 : 2
    }).format(amount || 0);
  };

  const refreshData = async () => {
    if (!user || refreshing) return;
    
    if (onRefresh) {
      // Use the parent's refresh handler to sync header loading state
      await onRefresh();
    } else {
      // Fallback to local refresh
      setRefreshing(true);
      try {
        await loadData();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const calculateStats = useCallback((transactions, profile) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let monthIncome = 0;
    let monthExpense = 0;
    let monthCreditGiven = 0;
    let monthLoanTaken = 0;
    let weekBalance = 0;

    transactions.forEach(transaction => {
      const transDate = new Date(transaction.date);
      const amount = parseFloat(transaction.amount) || 0;

      // Normalize transaction type for credit/loan detection
      const transactionType = (transaction.type || '').toString().toLowerCase().trim();

      // This month calculations
      if (transDate >= thisMonth) {
        if (transaction.type === 'income') {
          monthIncome += amount;
        } else if (transaction.type === 'expense') {
          monthExpense += amount;
        }

        // detect credit given and loans taken using centralized helpers
        if (isCreditCategory(transactionType)) {
          monthCreditGiven += amount;
        }

        if (isLoanCategory(transactionType)) {
          monthLoanTaken += amount;
        }
      }

      // Last week change
      if (transDate >= lastWeek) {
        if (transaction.type === 'income') {
          weekBalance += amount;
        } else {
          weekBalance -= amount;
        }
      }
    });

    setStats({
      balance: profile?.balance || userProfile?.balance || 0,
      thisMonthIncome: monthIncome,
      thisMonthExpense: monthExpense,
      thisWeekChange: weekBalance,
      thisMonthCreditGiven: monthCreditGiven,
      thisMonthLoanTaken: monthLoanTaken
    });
  }, [userProfile]);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch updated user profile
      const profileResult = await refreshUserProfile();

      // Fetch recent transactions for stats
      const transactionsResult = await getTransactions(user.uid, { limit: 100 });
      if (transactionsResult.success && profileResult) {
        calculateStats(transactionsResult.data, profileResult);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, refreshUserProfile, calculateStats]);

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only depend on user ID to avoid infinite loop

  // Refresh when refreshTrigger changes (for real-time updates)
  useEffect(() => {
    if (refreshTrigger && user?.uid) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, user?.uid]);

  // Initialize stats with existing userProfile data if available
  useEffect(() => {
    if (userProfile && stats.balance === 0) {
      setStats(prev => ({
        ...prev,
        balance: userProfile.balance || 0
      }));
    }
  }, [userProfile, stats.balance]);

  // Listen for transaction updates from other components
  useEffect(() => {
    const handleTransactionUpdate = () => {
      console.log('CompactSummary: Refreshing due to transaction update');
      loadData();
    };

    // Add event listeners
    window.addEventListener('wallet:transaction-added', handleTransactionUpdate);
    window.addEventListener('wallet:transaction-edited', handleTransactionUpdate);
    window.addEventListener('wallet:transaction-deleted', handleTransactionUpdate);

    return () => {
      window.removeEventListener('wallet:transaction-added', handleTransactionUpdate);
      window.removeEventListener('wallet:transaction-edited', handleTransactionUpdate);
      window.removeEventListener('wallet:transaction-deleted', handleTransactionUpdate);
    };
  }, [loadData]);

  if (loading) {
    return (
      <div className="w-full">
        {/* header skeleton: greeting + small action */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* compact grid skeleton: 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 bg-white/5 dark:bg-gray-800/40 text-sm"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="min-w-0 w-full">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Earned',
      value: formatCurrency(stats.thisMonthIncome),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Expended',
      value: formatCurrency(stats.thisMonthExpense),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      label: 'Given Credit',
      value: formatCurrency(stats.thisMonthCreditGiven || 0),
      icon: Wallet,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      label: 'Took Loan',
      value: formatCurrency(stats.thisMonthLoanTaken || 0),
      icon: DollarSign,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Welcome back, {userProfile?.displayName?.split(' ')[0] || 'User'}</div>
          <div className="text-xs text-gray-400">Quick snapshot of this month</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-8 h-8 text-sm rounded-md bg-white/5 dark:bg-gray-800/40 hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh summary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
            title="Add Custom Transaction"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {summaryCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div key={index} className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${card.bgColor} ${card.color} text-sm`}> 
                  <div className={`p-2 rounded-md ${card.bgColor}`}> 
                    <IconComponent className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{card.label}</div>
                    <div className="text-sm font-semibold truncate">{card.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          // Refresh data after successful addition
          await loadData();
        }}
      />
    </div>
  );
};

export default CompactSummary;