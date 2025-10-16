import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { calculateBudgetStatus, getCurrentMonthSpending, formatCurrency } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { SummaryCardSkeleton, BudgetSkeleton } from '../UI/SkeletonLoader';

const BudgetProgress = ({ onSettingsClick }) => {
    const { userProfile } = useAuth();
    const { transactions, loading: transactionLoading } = useTransactions();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Transactions are managed by context, just update loading state
        setLoading(transactionLoading || !transactions);
    }, [transactionLoading, transactions]);

    if (loading) {
        // Use the Budget-specific skeleton so width and progress placeholders
        // match the real BudgetProgress card layout.
        return (
            <div className="w-full">
                <BudgetSkeleton />
            </div>
        );
    }

    const currentSpending = getCurrentMonthSpending(transactions);
    const budgetStatus = calculateBudgetStatus(userProfile?.monthlyBudget, currentSpending);

    // Don't show if no budget is set
    if (!budgetStatus.hasValidBudget) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">Set Monthly Budget</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Track your spending against a monthly budget</p>
                        </div>
                    </div>
                    <button
                        onClick={onSettingsClick}
                        title="Open Settings"
                        className="p-2 -m-2 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                        <Settings className="w-4 h-4 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                    </button>
                </div>
            </div>
        );
    }

    // Get appropriate colors and icon based on status
    const getStatusColors = (warningLevel) => {
        switch (warningLevel) {
            case 'danger':
                return {
                    // Light: strong red highlights, Dark: deeper red shades
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
            default: // safe
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

    // show compact monthly budget card (minimal presentation)
    const clampedPct = Math.max(0, Math.min(100, Math.round(budgetStatus.percentage)));
    const spent = budgetStatus.spending || 0;
    const remaining = Math.max(0, (budgetStatus.budget || 0) - spent);

    return (
        <div className={`rounded-md p-3 bg-white dark:bg-gray-800 border ${colors.border}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <IconComponent className={`w-4 h-4 ${colors.iconColor}`} />
                    </div>
                    <div>
                        <div className={`text-xs font-medium ${colors.textColor}`}>{budgetStatus.status}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Monthly budget overview</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`text-sm font-semibold ${colors.textColor}`}>{clampedPct}%</div>
                    <button onClick={onSettingsClick} title="Open settings" className="p-1 rounded hover:bg-white/10 transition-colors">
                        <Settings className={`w-4 h-4 ${colors.textColor}`} />
                    </button>
                </div>
            </div>

            <div className={`w-full h-2 ${colors.progressBg} rounded-full overflow-hidden`}>
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${colors.progressFill}`}
                    style={{ width: `${clampedPct}%` }}
                />
            </div>

            <div className={`mt-2 flex items-center justify-between text-xs ${colors.textColor}`}>
                <div>{formatCurrency(spent, currency)} spent</div>
                <div>{budgetStatus.exceeded ? `Over by ${formatCurrency(spent - (budgetStatus.budget || 0), currency)}` : `${formatCurrency(remaining, currency)} left`}</div>
            </div>
        </div>
    );
};

export default BudgetProgress;