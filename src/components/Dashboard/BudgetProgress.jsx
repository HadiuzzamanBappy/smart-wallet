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


    return (
        <GlassCard padding="p-4" className="shadow-sm transition-colors duration-500">
            <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-4">
                    <IconBox 
                        icon={colors.icon}
                        variant="soft"
                        color={colors.color}
                        size="sm"
                        className="transition-all duration-500 group-hover:scale-110"
                    />
                    <div>
                        <div className="text-overline text-ink-400 dark:text-paper-700 mb-1 leading-none font-black uppercase tracking-widest">
                            {budgetStatus.status}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 dark:text-paper-700 opacity-40">Limit:</span>
                            <span className="text-label font-bold text-ink-900 dark:text-paper-50 tracking-tight leading-none">{formatCurrency(budgetLimit, currency)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-overline font-black text-ink-900 dark:text-paper-50 tracking-widest">{percentage}%</div>
            </div>

            <div className="w-full h-1.5 bg-paper-100/50 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.05)] ${
                        colors.color === 'error' ? 'bg-error-500' : 
                        colors.color === 'warning' ? 'bg-warning-500' : 
                        colors.color === 'info' ? 'bg-info-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-h5 font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-none">{formatCurrency(currentSpending, currency)}</span>
                        <span className="text-overline text-ink-400 dark:text-paper-700 opacity-40 leading-none">Spent</span>
                    </div>
                    {fixedSpending > 0 && (
                        <div className="text-[9px] font-bold text-ink-400 dark:text-paper-700 tracking-tight leading-none">
                            Incl. <span className="text-primary-600 dark:text-primary-400 font-black">{formatCurrency(fixedSpending, currency)}</span> fixed ops
                        </div>
                    )}
                </div>
                
                <div className="text-right">
                    <Badge 
                        color={budgetStatus.exceeded ? 'error' : 'success'}
                        variant="soft"
                        size="md"
                        className="font-black"
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