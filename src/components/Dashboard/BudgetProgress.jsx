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
                    color: 'text-rose-400',
                    bg: 'bg-rose-400/10',
                    progressFill: 'bg-rose-500',
                    icon: AlertTriangle
                };
            case 'warning':
                return {
                    color: 'text-amber-400',
                    bg: 'bg-amber-400/10',
                    progressFill: 'bg-amber-500',
                    icon: AlertTriangle
                };
            case 'caution':
                return {
                    color: 'text-sky-400',
                    bg: 'bg-sky-400/10',
                    progressFill: 'bg-sky-500',
                    icon: TrendingUp
                };
            default:
                return {
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-400/10',
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
        <GlassCard padding="p-3" className="border-white/5">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                    <IconBox 
                        icon={colors.icon} 
                        colorClass={colors.color} 
                        bgClass={colors.bg} 
                        size="md"
                    />
                    <div>
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.color} mb-0.5`}>
                            {budgetStatus.status}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <StatBadge label="LIMIT" value={formatCurrency(budgetLimit, currency)} variant="gray" />
                        </div>
                    </div>
                </div>

                <div className={`text-sm font-black tracking-tighter ${colors.color}`}>{percentage}%</div>
            </div>

            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${colors.progressFill}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{formatCurrency(currentSpending, currency)}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Spent</span>
                    </div>
                    {fixedSpending > 0 && (
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tight opacity-60">
                            Incl. {formatCurrency(fixedSpending, currency)} fixed costs
                        </div>
                    )}
                </div>
                
                <div className="text-right">
                    <div className={`text-xs font-black ${budgetStatus.exceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {budgetStatus.exceeded 
                            ? `${formatCurrency(currentSpending - budgetLimit, currency)} OVER` 
                            : `${formatCurrency(remaining, currency)} LEFT`
                        }
                    </div>
                </div>
            </div>
        </GlassCard>
    );
};

export default BudgetProgress;