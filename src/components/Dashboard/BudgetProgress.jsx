import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { calculateBudgetStatus, getCurrentMonthSpending, formatCurrency } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { BudgetSkeleton } from '../UI/SkeletonLoader';
import { getSalaryPlan } from '../../services/salaryService';

// Base UI Components
import GlassCard from '../UI/base/GlassCard';
import StatBadge from '../UI/base/StatBadge';
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
                    color: 'text-rose-600 dark:text-rose-400',
                    bg: 'bg-rose-500/10',
                    progressFill: 'bg-rose-500',
                    icon: AlertTriangle
                };
            case 'warning':
                return {
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-500/10',
                    progressFill: 'bg-amber-500',
                    icon: AlertTriangle
                };
            case 'caution':
                return {
                    color: 'text-sky-600 dark:text-sky-400',
                    bg: 'bg-sky-500/10',
                    progressFill: 'bg-sky-500',
                    icon: TrendingUp
                };
            default:
                return {
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    progressFill: 'bg-emerald-500',
                    icon: CheckCircle
                };
        }
    };

    const colors = getStatusColors(budgetStatus.warningLevel);
    const currency = userProfile?.currency || 'BDT';
    const percentage = Math.max(0, Math.min(100, Math.round(budgetStatus.percentage)));
    const remaining = Math.max(0, (budgetStatus.budget || 0) - currentSpending);

    return (
        <div className="rounded-2xl p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm transition-colors duration-500">
            <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-4">
                    <IconBox 
                        icon={colors.icon}
                        variant="glass"
                        colorClass={colors.color}
                        bgClass={colors.bg}
                        size="md"
                        className={`!rounded-xl border ${budgetStatus.warningLevel === 'danger' ? 'border-rose-500/30' : 'border-gray-200 dark:border-white/20'}`}
                    />
                    <div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.color} mb-1.5`}>
                            {budgetStatus.status}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Limit:</span>
                            <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(budgetLimit, currency)}</span>
                        </div>
                    </div>
                </div>

                <div className={`text-sm font-black tracking-tighter ${colors.color}`}>{percentage}%</div>
            </div>

            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)] ${colors.progressFill}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex items-end justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(currentSpending, currency)}</span>
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Spent</span>
                    </div>
                    {fixedSpending > 0 && (
                        <div className="text-[9px] font-black uppercase tracking-tight text-gray-400 dark:text-gray-600">
                            Incl. <span className="text-gray-600 dark:text-gray-400">{formatCurrency(fixedSpending, currency)}</span> fixed ops
                        </div>
                    )}
                </div>
                
                <div className="text-right">
                    <div className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${budgetStatus.exceeded 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
                        {budgetStatus.exceeded 
                            ? `${formatCurrency(currentSpending - budgetLimit, currency)} Over` 
                            : `${formatCurrency(remaining, currency)} Left`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetProgress;