import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTransactions } from '../../services/transactionService';
import { Wallet, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { isCreditCategory, isLoanCategory } from '../../utils/transactionParser';

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
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
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

  const loadData = async () => {
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
  };

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

  const calculateStats = (transactions, profile) => {
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
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto md:max-w-4xl w-full">
          {/* Loading greeting strip */}
          <div className="mb-4">
            <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 py-3 px-4 rounded-lg animate-pulse">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                </div>
                <div className="h-9 bg-gray-300 dark:bg-gray-600 rounded-lg w-20"></div>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-600 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 dark:from-teal-400/10 dark:to-emerald-400/10"></div>
            
            <div className="relative z-10 animate-pulse">              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <div className="space-y-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-2/3"></div>
                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto md:max-w-4xl w-full">

        {/* Greeting strip above the summary */}
        <div className="mb-4">
          <div className="w-full text-gray-700 dark:text-gray-200 py-3 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base mb-1">
                  Welcome back, {userProfile?.displayName?.split(' ')[0] || 'User'} 👋
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Have a productive day managing your finances
                </div>
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh balance and stats"
                aria-label="Refresh balance and stats"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 rounded-2xl p-4 sm:p-8 border border-gray-100 dark:border-gray-600 mb-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 dark:from-teal-400/10 dark:to-emerald-400/10"></div>

          <div className="relative z-10">        
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {summaryCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <div key={index} className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-teal-300 dark:hover:border-teal-500">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl shadow-sm ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className={`w-5 h-5 ${card.color}`} />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                          {card.label}
                        </span>
                        <p className={`text-lg sm:text-xl font-bold ${card.color} group-hover:scale-105 transition-transform duration-300`}>
                          {card.value}
                        </p>
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/0 to-emerald-400/0 group-hover:from-teal-400/5 group-hover:to-emerald-400/5 dark:group-hover:from-teal-400/10 dark:group-hover:to-emerald-400/10 transition-all duration-300"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompactSummary;