import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from './useTransactions';
import { APP_EVENTS } from '../config/constants';

/**
 * Hook to calculate and provide summary statistics for the dashboard
 */
export const useSummaryStats = (user, userProfile, refreshUserProfile) => {
    const {
        transactions,
        refreshTransactions,
        loading: txLoading,
        smartBalance,
        currentMonthIncome,
        currentMonthExpense,
        salaryPlan
    } = useTransactions();

    const [stats, setStats] = useState({
        thisMonthIncome: 0,
        thisMonthExpense: 0,
        thisWeekChange: 0,
        allTimeCreditGiven: 0,
        allTimeLoanTaken: 0,
        creditDue: 0,
        loanDue: 0,
        balance: 0
    });
    const [loading, setLoading] = useState(txLoading);
    const [refreshing, setRefreshing] = useState(false);

    const calculateStats = useCallback((transactions) => {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let weekBalance = 0;

        transactions.forEach(transaction => {
            const createdDate = new Date(transaction.createdAt || transaction.date);
            const amount = parseFloat(transaction.amount) || 0;
            if (createdDate >= lastWeek) {
                if (transaction.type === 'income') weekBalance += amount;
                else weekBalance -= amount;
            }
        });

        let allTimeCreditGiven = 0;
        let allTimeCreditDue = 0;
        let allTimeLoanTaken = 0;
        let allTimeLoanDue = 0;

        if (salaryPlan?.plan?.loanDetails) {
            salaryPlan.plan.loanDetails.forEach(loan => {
                allTimeLoanTaken += (loan.totalLeft || 0);
                allTimeLoanDue += (loan.totalLeft || 0);
            });
        }

        transactions.forEach(tx => {
            const type = (tx.type || '').toLowerCase();
            const amount = Number(tx.amount || 0);
            if (type === 'credit') {
                allTimeCreditGiven += amount;
                allTimeCreditDue += amount;
            } else if (type === 'loan') {
                allTimeLoanTaken += amount;
                allTimeLoanDue += amount;
            } else if (type === 'collection') {
                allTimeCreditDue -= amount;
            } else if (type === 'repayment') {
                allTimeLoanDue -= amount;
            }
        });

        allTimeCreditDue = Math.max(0, allTimeCreditDue);
        allTimeLoanDue = Math.max(0, allTimeLoanDue);

        setStats({
            balance: smartBalance,
            thisMonthIncome: currentMonthIncome,
            thisMonthExpense: currentMonthExpense,
            thisWeekChange: weekBalance,
            allTimeCreditGiven: allTimeCreditGiven,
            allTimeLoanTaken: allTimeLoanTaken,
            creditDue: allTimeCreditDue,
            loanDue: allTimeLoanDue
        });
    }, [smartBalance, currentMonthIncome, currentMonthExpense, salaryPlan]);

    const loadData = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        try {
            if (transactions && transactions.length >= 0) {
                await calculateStats(transactions);
            }
        } catch (error) {
            console.error('Error calculating stats:', error);
        } finally {
            setLoading(false);
        }
    }, [user, transactions, calculateStats]);

    const refreshData = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await refreshTransactions();
            await loadData(true);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!txLoading) setLoading(false);
    }, [txLoading]);

    useEffect(() => {
        if (user?.uid && transactions !== null) {
            loadData(true);
        }
    }, [user?.uid, transactions, loadData]);

    useEffect(() => {
        const handleTransactionUpdate = async () => {
            setRefreshing(true);
            try {
                if (refreshUserProfile) {
                    try {
                        await refreshUserProfile();
                    } catch (error) {
                        console.warn('Failed to refresh user profile:', error);
                    }
                }
                await loadData(true);
            } finally {
                setTimeout(() => setRefreshing(false), 300);
            }
        };

        window.addEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTransactionUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTransactionUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTransactionUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTransactionUpdate);

        return () => {
            window.removeEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTransactionUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTransactionUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTransactionUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTransactionUpdate);
        };
    }, [loadData, refreshUserProfile]);

    const hasData = transactions && transactions.length > 0;
    const showSkeleton = refreshing || ((loading || txLoading) && !hasData);

    return {
        stats,
        loading: showSkeleton,
        refreshing,
        refreshData,
        transactions
    };
};
