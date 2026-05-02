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
import { THEME } from '../../config/theme';

// Base UI Components
import Button from './base/Button';
import StatBadge from './base/StatBadge';

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
            <header className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-white/5 fixed top-0 left-0 right-0 w-full z-50">
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
                                <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                                    Smart Wallet
                                </h1>
                                <div className={`flex items-center gap-2 ${THEME.typography.label} text-gray-400 dark:text-gray-500`}>
                                    <Wallet className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                                    {isRefreshing || isLocalRefreshing ? (
                                        <div className="flex items-center gap-2">
                                            <Skeleton width="w-16" height="h-3" />
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBalanceClick}
                                            className="font-black text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-2 group"
                                        >
                                            {formatCurrency(balance, userProfile?.currency || 'BDT')}
                                            <RefreshCw className="w-2.5 h-2.5 opacity-40 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Add Transaction Button */}
                            <div className="flex sm:hidden">
                                <Button
                                    onClick={onAddTransaction}
                                    color="emerald"
                                    icon={Plus}
                                    size="icon"
                                    variant="soft"
                                    className="!w-10 !h-10 !rounded-xl shadow-lg shadow-emerald-500/10"
                                />
                            </div>
                            <div className="hidden sm:flex">
                                <Button
                                    onClick={onAddTransaction}
                                    color="emerald"
                                    icon={Plus}
                                    size="md"
                                    variant="soft"
                                >
                                    Add
                                </Button>
                            </div>

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
                        <div className={`relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl text-gray-900 dark:text-white rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5 transform transition-all duration-300 ease-out ${entered && !isClosing ? 'opacity-100 translate-y-3' : 'opacity-0 translate-y-0'}`}>
                            <Button
                                variant="icon"
                                size="sm"
                                onClick={handleFloatingClose}
                                className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 shadow-xl !rounded-xl border border-gray-100 dark:border-white/10"
                            >
                                <X className="w-3 h-3" />
                            </Button>

                            <div className="flex flex-col gap-5 select-none">
                                <div className="flex items-center justify-between px-1">
                                    <div>
                                        <div className="text-[9px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-200 opacity-80 mb-1">Total Wealth</div>
                                        <div className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-teal-600 dark:text-teal-400 opacity-80 mb-1">Monthly Surplus</div>
                                        <div className="text-sm font-black text-teal-700 dark:text-teal-400 tracking-tighter">{formatCurrency(monthlySurplus, userProfile?.currency || 'BDT')}</div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-3">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Month Margin</span>
                                            <span className="font-black text-gray-700 dark:text-gray-200">+{formatCurrency(salaryPlan?.plan?.disposable || 0, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Cash In Hand</span>
                                            <span className="font-black text-gray-700 dark:text-gray-200">+{formatCurrency(cashInHand, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Net Flow</span>
                                            <span className={`font-black ${monthlyNetFlowTransactions >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {monthlyNetFlowTransactions >= 0 ? '+' : ''}{formatCurrency(monthlyNetFlowTransactions, userProfile?.currency || 'BDT')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Total Assets</span>
                                            <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-center justify-center border transition-colors ${creditDue >= loanDue ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                                    <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {creditDue >= loanDue ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {creditDue >= loanDue ? 'Net Receivable' : 'Net Due'}
                                        <span className="text-sm font-black tracking-tighter ml-1">{formatCurrency(Math.abs(creditDue - loanDue), userProfile?.currency || 'BDT')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
