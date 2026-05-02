import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { calculateBudgetStatus, getCurrentMonthSpending, formatCurrency } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { getSalaryPlan } from '../../services/salaryService';

const BudgetProgress = () => {
    const { userProfile, user } = useAuth();
    const { transactions, loading: transactionLoading } = useTransactions();
    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState(null);

    const fetchPlan = useCallback(async () => {
        if (!user?.uid) return;
        try {
            const data = await getSalaryPlan(user.uid);
            setPlanData(data?.plan || null);
        } catch (err) {
            console.error("BudgetProgress: Failed to fetch salary plan", err);
        }
    }, [user?.uid]);

    useEffect(() => {
        setLoading(transactionLoading || !transactions);
        if (user?.uid) {
            fetchPlan();
        }

        const handleUpdate = () => fetchPlan();
        window.addEventListener('salary-plan-updated', handleUpdate);
        return () => window.removeEventListener('salary-plan-updated', handleUpdate);
    }, [transactionLoading, transactions, user?.uid, fetchPlan]);

    const hasData = transactions && transactions.length > 0;
    if (loading && !hasData) {
        return (
            <div className="w-full">
                <BudgetSkeleton />
            </div>
        );
    }

    // Hide if no salary plan is available
    if (!planData) {
        return null;
    }

    // Auto-calculate budget limit from Salary Plan
    // Formula: Limit = Income - Savings - Goal - Loans (as requested)
    const budgetLimit = (planData.totalIncome - planData.actualSavings - planData.monthlyForGoal - planData.totalEMI);

    // Include fixed expenses (Rent/Bills) from salary plan if available
    const transactionSpending = getCurrentMonthSpending(transactions);
    // Rent and Bills are part of the 'Lifestyle' budget, so we add them to the actual spending
    const fixedSpending = (planData?.rent || 0) + (planData?.bills || 0) + (planData?.transport || 0) + (planData?.familySend || 0);
    const currentSpending = transactionSpending + fixedSpending;

    const budgetStatus = calculateBudgetStatus(budgetLimit, currentSpending);

    if (!budgetStatus.hasValidBudget) {
        return null;
    }

    const getStatusColors = (warningLevel) => {
        switch (warningLevel) {
            case 'danger':
                return {
                    bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/30',
                    border: 'border-red-200 dark:border-red-800',
                    progressBg: 'bg-red-100 dark:bg-red-900/30',
                    progressFill: 'bg-red-600',
                    textColor: 'text-red-700 dark:text-red-200',
                    icon: AlertTriangle,
                    iconColor: 'text-red-600'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/10 dark:to-yellow-900/30',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    progressBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    progressFill: 'bg-yellow-500',
                    textColor: 'text-yellow-700 dark:text-yellow-200',
                    icon: AlertTriangle,
                    iconColor: 'text-yellow-600'
                };
            case 'caution':
                return {
                    bg: 'bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/10 dark:to-cyan-900/24',
                    border: 'border-sky-200 dark:border-sky-800',
                    progressBg: 'bg-sky-100 dark:bg-sky-900/30',
                    progressFill: 'bg-sky-500',
                    textColor: 'text-sky-700 dark:text-sky-200',
                    icon: TrendingUp,
                    iconColor: 'text-sky-500'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/8 dark:to-emerald-900/28',
                    border: 'border-emerald-200 dark:border-emerald-800',
                    progressBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    progressFill: 'bg-emerald-500',
                    textColor: 'text-emerald-700 dark:text-emerald-200',
                    icon: CheckCircle,
                    iconColor: 'text-emerald-500'
                };
        }
    };

    const colors = getStatusColors(budgetStatus.warningLevel);
    const IconComponent = colors.icon;
    const currency = userProfile?.currency || 'BDT';
    const percentage = Math.max(0, Math.min(100, Math.round(budgetStatus.percentage)));
    const spent = budgetStatus.spending || 0;
    const remaining = Math.max(0, (budgetStatus.budget || 0) - spent);

    return (
        <div className={`rounded-2xl p-3 bg-white dark:bg-gray-800 border ${colors.border} shadow-sm`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${colors.bg}`}>
                        <IconComponent className={`w-5 h-5 ${colors.iconColor}`} />
                    </div>
                    <div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${colors.textColor}`}>
                            {budgetStatus.status}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            Limit: <span className="font-bold">{formatCurrency(budgetLimit, currency)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className={`text-sm font-bold ${colors.textColor}`}>{percentage}%</div>
                </div>
            </div>

            <div className={`w-full h-1.5 ${colors.progressBg} rounded-full overflow-hidden`}>
                <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.progressFill}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className={`mt-2 flex items-center justify-between text-[11px] font-bold ${colors.textColor}`}>
                <div className="flex flex-col">
                    <span>{formatCurrency(currentSpending, currency)} spent</span>
                    {fixedSpending > 0 && (
                        <span className="text-[9px] opacity-70 font-medium">Includes {formatCurrency(fixedSpending, currency)} fixed costs</span>
                    )}
                </div>
                <div className="text-right">{budgetStatus.exceeded ? `Exceeded by ${formatCurrency(currentSpending - (budgetStatus.budget || 0), currency)}` : `${formatCurrency(remaining, currency)} available`}</div>
            </div>
        </div>
    );
};

export default BudgetProgress;