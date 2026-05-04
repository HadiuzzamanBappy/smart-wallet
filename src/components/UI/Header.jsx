import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wallet, Plus, RefreshCw, DollarSign, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import useLocalRefresh from '../../hooks/useLocalRefresh';
import { formatCurrency } from '../../utils/helpers';
import UserMenuDropdown from '../User/UserMenuDropdown';
import { getOutstandingCredits, getOutstandingLoans } from '../../services/debtService';
import Skeleton, { HeaderSkeleton } from './SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';

// Base UI Components
import Button from './base/Button';
import Badge from './base/Badge';
import IconBox from './base/IconBox';
import GlassCard from './base/GlassCard';

const Header = ({
    onAddTransaction,
    onOpenProfile,
    onOpenSettings,
    currentLanguage,
    onLanguageToggle,
    isRefreshing = false
}) => {
    const { userProfile, user } = useAuth();
    const { smartBalance: totalWealth, netSurplus: surplus, salaryPlan, monthlyNetFlowTransactions } = useTransactions();
    const cashInHand = salaryPlan?.plan?.cashInHand || 0;
    const monthlySurplus = surplus;
    const balance = totalWealth;

    const [showFloatingBalance, setShowFloatingBalance] = useState(false);
    const [entered, setEntered] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const hideTimerRef = useRef(null);
    const closeTimerRef = useRef(null);
    const [creditDue, setCreditDue] = useState(0);
    const [loanDue, setLoanDue] = useState(0);
    const { isRefreshing: isLocalRefreshing, run: runLocalRefresh } = useLocalRefresh(350);

    const refreshDues = useCallback(async () => {
        try {
            if (!user?.uid) return;
            const [creditsResult, loansResult] = await Promise.all([
                getOutstandingCredits(user.uid),
                getOutstandingLoans(user.uid)
            ]);

            let cDue = 0;
            let lDue = 0;

            if (salaryPlan?.plan?.loanDetails) {
                salaryPlan.plan.loanDetails.forEach(loan => {
                    lDue += Number(loan.totalLeft || 0);
                });
            }

            if (creditsResult.success && Array.isArray(creditsResult.data)) {
                creditsResult.data.forEach(c => {
                    cDue += Number(c.remainingAmount || 0);
                });
            }

            if (loansResult.success && Array.isArray(loansResult.data)) {
                loansResult.data.forEach(l => {
                    lDue += Number(l.remainingAmount || 0);
                });
            }

            setCreditDue(cDue);
            setLoanDue(lDue);
        } catch (err) {
            console.warn('Header: failed to refresh dues', err);
        }
    }, [user?.uid, salaryPlan]);

    const handleBalanceClick = async () => {
        await runLocalRefresh(async () => {
            try {
                await refreshDues();
            } catch (err) {
                console.warn('Header: refreshDues failed', err);
            }
        });

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsClosing(false);
        setShowFloatingBalance(true);
        requestAnimationFrame(() => setEntered(true));
    };

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    useEffect(() => {
        refreshDues();
        const handleTxUpdate = () => refreshDues();
        window.addEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTxUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTxUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTxUpdate);
        window.addEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTxUpdate);
        return () => {
            window.removeEventListener(APP_EVENTS.TRANSACTION_ADDED, handleTxUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTION_EDITED, handleTxUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTION_DELETED, handleTxUpdate);
            window.removeEventListener(APP_EVENTS.TRANSACTIONS_UPDATED, handleTxUpdate);
        };
    }, [refreshDues]);

    const handleFloatingClose = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsClosing(true);
        setEntered(false);
        closeTimerRef.current = setTimeout(() => {
            setShowFloatingBalance(false);
            setIsClosing(false);
            closeTimerRef.current = null;
        }, 300);
    };

    return (
        <>
            <header className="bg-surface-card dark:bg-surface-card-dark backdrop-blur-xl shadow-sm border-b border-paper-100 dark:border-white/5 fixed top-0 left-0 right-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/favicon/favicon.svg"
                                alt="Smart Wallet Logo"
                                className="w-8 h-8 drop-shadow-sm"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <Wallet className="w-6 h-6 text-gray-900 dark:text-white" style={{ display: 'none' }} />
                            <div>
                                <h1 className="text-body font-bold text-ink-900 dark:text-paper-50 tracking-tight">
                                    Smart Wallet
                                </h1>
                                <div className={`flex items-center gap-2 text-label text-gray-400 dark:text-gray-500`}>
                                    {isRefreshing || isLocalRefreshing ? (
                                        <div className="flex items-center gap-2">
                                            <Skeleton width="w-16" height="h-3" />
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 group/balance">
                                            <Badge
                                                variant="glass"
                                                color="primary"
                                                size="sm"
                                                onClick={handleBalanceClick}
                                            >
                                                {formatCurrency(balance, userProfile?.currency || 'BDT')}
                                            </Badge>
                                            <button
                                                onClick={handleBalanceClick}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-teal-500 transition-all active:scale-90 opacity-40 group-hover/balance:opacity-100"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isLocalRefreshing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Add Transaction Button */}
                            <Button
                                onClick={onAddTransaction}
                                color="primary"
                                icon={Plus}
                                size="md"
                                variant="soft"
                                className="!h-10 !px-3 sm:!px-4 !rounded-xl"
                            >
                                <span className="hidden sm:inline">Add</span>
                            </Button>

                            <UserMenuDropdown
                                onOpenProfile={onOpenProfile}
                                onOpenSettings={onOpenSettings}
                                currentLanguage={currentLanguage}
                                onLanguageToggle={onLanguageToggle}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {showFloatingBalance && (
                <div className="fixed top-16 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <div className="pointer-events-auto w-11/12 max-w-lg px-4">
                        <GlassCard
                            variant="flat"
                            padding="p-5"
                            className={`relative !bg-surface-card dark:!bg-surface-card-dark backdrop-blur-2xl text-ink-900 dark:text-paper-50 shadow-2xl border-paper-200 dark:border-white/10 transform transition-all duration-300 ease-out ${entered && !isClosing ? 'opacity-100 translate-y-3' : 'opacity-0 translate-y-0'}`}
                        >
                            <Button
                                variant="icon"
                                size="sm"
                                onClick={handleFloatingClose}
                                className="absolute -top-2 -right-2 bg-paper-50 dark:bg-ink-900 shadow-xl !rounded-xl border border-paper-100 dark:border-white/10"
                            >
                                <X className="w-3 h-3" />
                            </Button>

                            <div className="flex flex-col gap-6 select-none">
                                <div className="flex items-center justify-between px-1">
                                    <div className="space-y-0.5">
                                        <p className="text-overline opacity-30">Vault Total</p>
                                        <h2 className="text-h4 text-ink-900 dark:text-paper-50">
                                            {formatCurrency(totalWealth, userProfile?.currency || 'BDT')}
                                        </h2>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <Badge label="Goal Target" value={formatCurrency(salaryPlan?.plan?.goal || 0, userProfile?.currency || 'BDT')} color="primary" variant="glass" size="sm" />
                                        <Badge label="Monthly Surplus" value={formatCurrency(monthlySurplus, userProfile?.currency || 'BDT')} color="success" variant="glass" size="sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Month Margin', val: formatCurrency(salaryPlan?.plan?.disposable || 0, userProfile?.currency || 'BDT'), color: 'text-primary-500' },
                                        { label: 'Cash In Hand', val: formatCurrency(cashInHand, userProfile?.currency || 'BDT'), color: 'text-amber-500' },
                                        { label: 'Monthly Savings', val: formatCurrency(salaryPlan?.plan?.actualSavings || 0, userProfile?.currency || 'BDT'), color: 'text-teal-600' },
                                        { label: 'Goal Saving', val: formatCurrency(salaryPlan?.plan?.monthlyForGoal || 0, userProfile?.currency || 'BDT'), color: 'text-secondary-500' },
                                        { label: 'Net Flow', val: `${monthlyNetFlowTransactions >= 0 ? '+' : ''}${formatCurrency(monthlyNetFlowTransactions, userProfile?.currency || 'BDT')}`, color: monthlyNetFlowTransactions >= 0 ? 'text-teal-500' : 'text-rose-500' },
                                        { label: 'Total Assets', val: formatCurrency(totalWealth, userProfile?.currency || 'BDT'), color: 'text-ink-900 dark:text-paper-50' }
                                    ].map(item => (
                                        <div key={item.label} className="p-2 rounded-xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5">
                                            <p className="text-nano text-ink-400 dark:text-paper-700 mb-0.5">{item.label}</p>
                                            <p className={`text-label ${item.color}`}>{item.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-1">
                                    <div className={`p-3 rounded-3xl flex items-center justify-between border transition-all duration-500 ${creditDue >= loanDue ? 'bg-success-500/[0.03] dark:bg-success-500/10 border-success-500/20' : 'bg-error-500/[0.03] dark:bg-error-500/10 border-error-500/20'}`}>
                                        <div className="flex items-center gap-2">
                                            <IconBox
                                                icon={creditDue >= loanDue ? TrendingUp : TrendingDown}
                                                color={creditDue >= loanDue ? 'success' : 'error'}
                                                variant="glass"
                                                size="xs"
                                            />
                                            <span className="text-overline opacity-80">
                                                {creditDue >= loanDue ? 'Net Receivable' : 'Net Due'}
                                            </span>
                                        </div>
                                        <span className={`text-label ${creditDue >= loanDue ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                                            {formatCurrency(Math.abs(creditDue - loanDue), userProfile?.currency || 'BDT')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
