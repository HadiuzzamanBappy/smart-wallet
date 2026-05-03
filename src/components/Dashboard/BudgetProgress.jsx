import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { calculateBudgetStatus, getCurrentMonthSpending, formatCurrency } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { getSalaryPlan } from '../../services/salaryService';
import { THEME } from '../../config/theme';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';

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
    const budgetLimit = (planData.totalIncome - planData.actualSavings - planData.monthlyForGoal - planData.totalEMI);

    // Include fixed expenses (Rent/Bills) from salary plan if available
    const transactionSpending = getCurrentMonthSpending(transactions);
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
                    color: 'error',
                    icon: AlertTriangle
                };
            case 'warning':
                return {
                    color: 'warning',
                    icon: AlertTriangle
                };
            case 'caution':
                return {
                    color: 'info',
                    icon: TrendingUp
                };
            default:
                return {
                    color: 'success',
                    icon: CheckCircle
                };
        }
    };

    const colors = getStatusColors(budgetStatus.warningLevel);
    const currency = userProfile?.currency || 'BDT';
    const percentage = Math.max(0, Math.min(100, Math.round(budgetStatus.percentage)));
    const remaining = Math.max(0, (budgetStatus.budget || 0) - currentSpending);

    const progressFills = {
        error: 'bg-rose-500',
        warning: 'bg-amber-500',
        info: 'bg-sky-500',
        success: 'bg-emerald-500'
    };

    return (
        <GlassCard padding="p-4" className="shadow-sm transition-colors duration-500">
            <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-4">
                    <IconBox 
                        icon={colors.icon}
                        variant="glass"
                        color={colors.color}
                        size="md"
                        className={`!rounded-xl border ${colors.color === 'error' ? 'border-rose-500/30' : 'border-gray-200/50 dark:border-white/10'}`}
                    />
                    <div>
                        <div className={`${THEME.typography.label} mb-1.5 opacity-80 uppercase tracking-widest`}>
                            {budgetStatus.status}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={THEME.typography.label}>Limit:</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(budgetLimit, currency)}</span>
                        </div>
                    </div>
                </div>

                <div className={`text-sm font-bold tracking-tight opacity-80`}>{percentage}%</div>
            </div>

            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)] ${progressFills[colors.color] || 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex items-end justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(currentSpending, currency)}</span>
                        <span className={THEME.typography.label}>Spent</span>
                    </div>
                    {fixedSpending > 0 && (
                        <div className={`${THEME.typography.label} opacity-70`}>
                            Incl. <span className="text-gray-600 dark:text-gray-400">{formatCurrency(fixedSpending, currency)}</span> fixed ops
                        </div>
                    )}
                </div>
                
                <div className="text-right">
                    <Badge 
                        color={budgetStatus.exceeded ? 'error' : 'success'}
                        variant="soft"
                        size="md"
                    >
                        {budgetStatus.exceeded 
                            ? `${formatCurrency(currentSpending - budgetLimit, currency)} Over` 
                            : `${formatCurrency(remaining, currency)} Left`
                        }
                    </Badge>
                </div>
            </div>
        </GlassCard>
    );
};

export default BudgetProgress;