import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTransactions } from '../../services/transactionService';
import { calculateBudgetStatus, getCurrentMonthSpending, formatCurrency } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, DollarSign, TrendingUp, Settings } from 'lucide-react';

const BudgetProgress = ({ onSettingsClick }) => {
    const { user, userProfile } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTransactions = async () => {
            if (!user) return;
            setLoading(true);
            const result = await getTransactions(user.uid);
            if (result.success) {
                setTransactions(result.data);
            }
            setLoading(false);
        };

        loadTransactions();
    }, [user]);

    if (loading) {
        return (
            <div className="rounded-md p-3 bg-gray-800/50 border border-gray-600/30 animate-pulse">
                {/* header skeleton: status text left, pct/action right */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="w-24 h-3 bg-gray-600 rounded" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-gray-600 rounded" />
                        <div className="w-8 h-8 bg-gray-600 rounded-full" />
                    </div>
                </div>

                {/* progress bar skeleton */}
                <div className="w-full h-2 bg-gray-700/40 rounded-full overflow-hidden mb-2">
                    <div className="h-2 rounded-full bg-gray-500 w-1/3" />
                </div>

                {/* bottom labels skeleton */}
                <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="w-24 h-3 bg-gray-600 rounded" />
                    <div className="w-28 h-3 bg-gray-600 rounded" />
                </div>
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
                    bg: 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    progressBg: 'bg-red-100 dark:bg-red-900/30',
                    progressFill: 'bg-red-500',
                    textColor: 'text-red-700 dark:text-red-300',
                    icon: AlertTriangle,
                    iconColor: 'text-red-500'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    progressBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    progressFill: 'bg-yellow-500',
                    textColor: 'text-yellow-700 dark:text-yellow-300',
                    icon: AlertTriangle,
                    iconColor: 'text-yellow-500'
                };
            case 'caution':
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    progressBg: 'bg-blue-100 dark:bg-blue-900/30',
                    progressFill: 'bg-blue-500',
                    textColor: 'text-blue-700 dark:text-blue-300',
                    icon: TrendingUp,
                    iconColor: 'text-blue-500'
                };
            default: // safe
                return {
                    bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    progressBg: 'bg-green-100 dark:bg-green-900/30',
                    progressFill: 'bg-green-500',
                    textColor: 'text-green-700 dark:text-green-300',
                    icon: CheckCircle,
                    iconColor: 'text-green-500'
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
        <div className="rounded-md p-3 bg-gray-800/50">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <div className={`text-xs font-medium ${
                        budgetStatus.warningLevel === 'danger' ? 'text-red-200' :
                        budgetStatus.warningLevel === 'warning' ? 'text-yellow-200' :
                        budgetStatus.warningLevel === 'caution' ? 'text-blue-200' :
                        'text-green-200'
                    }`}>{budgetStatus.status}</div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">{clampedPct}%</div>
                    <button onClick={onSettingsClick} title="Open settings" className="p-1 rounded hover:bg-white/10 transition-colors">
                        <Settings className="w-4 h-4 text-gray-200 hover:text-white" />
                    </button>
                </div>
            </div>

            <div className="w-full h-2 bg-gray-700/40 rounded-full overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                        budgetStatus.warningLevel === 'danger' ? 'bg-red-400' :
                        budgetStatus.warningLevel === 'warning' ? 'bg-yellow-400' :
                        budgetStatus.warningLevel === 'caution' ? 'bg-blue-400' :
                        'bg-green-400'
                    }`}
                    style={{ width: `${clampedPct}%` }}
                />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-100">
                <div>BDT {formatCurrency(spent, currency).replace(/[^0-9.,]/g, '')} spent</div>
                <div>{budgetStatus.exceeded ? `Over by ${formatCurrency(spent - (budgetStatus.budget || 0), currency)}` : `${formatCurrency(remaining, currency)} left`}</div>
            </div>
        </div>
    );
};

export default BudgetProgress;