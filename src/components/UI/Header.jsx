import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wallet, Plus, RefreshCw, DollarSign, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import useLocalRefresh from '../../hooks/useLocalRefresh';
import { formatCurrency } from '../../utils/helpers';
import UserMenuDropdown from '../User/UserMenuDropdown';
import { getOutstandingCredits, getOutstandingLoans } from '../../services/transactionService';
import Skeleton, { HeaderSkeleton } from './SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';

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
            <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/favicon/favicon.svg"
                                alt="Smart Wallet Logo"
                                className="w-8 h-8"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <Wallet className="w-6 h-6 text-white" style={{ display: 'none' }} />
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Smart Wallet
                                </h1>
                                <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-gray-500">
                                    <Wallet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                    {isRefreshing || isLocalRefreshing ? (
                                        <div className="flex items-center gap-2">
                                            <Skeleton width="w-20" height="h-3" />
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBalanceClick}
                                            className="font-black text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-2 group"
                                        >
                                            {formatCurrency(balance, userProfile?.currency || 'BDT')}
                                            <RefreshCw className="w-3 h-3 opacity-40 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Add Transaction Button */}
                            <div className="flex sm:hidden">
                                <Button
                                    onClick={onAddTransaction}
                                    color="emerald"
                                    icon={Plus}
                                    size="icon"
                                    variant="soft"
                                    className="!rounded-xl"
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
                        <div className={`relative bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 transform transition-all duration-300 ease-out ${entered && !isClosing ? 'opacity-100 translate-y-2' : 'opacity-0 translate-y-0'}`}>
                            <Button
                                variant="icon"
                                size="sm"
                                onClick={handleFloatingClose}
                                className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 shadow-lg !rounded-lg"
                            >
                                <X className="w-3 h-3" />
                            </Button>

                            <div className="flex flex-col gap-4 select-none">
                                <div className="flex items-center justify-between px-1">
                                    <div>
                                        <div className="text-[9px] uppercase font-black tracking-widest text-amber-200 opacity-80 mb-0.5">Total Wealth</div>
                                        <div className="text-xl font-black">{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-teal-300 opacity-80 mb-0.5">Spendable</div>
                                        <div className="text-sm font-black text-teal-400">{formatCurrency(monthlySurplus, userProfile?.currency || 'BDT')}</div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10 space-y-2">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="opacity-50 uppercase font-bold tracking-tight">Month Margin</span>
                                            <span className="font-bold text-gray-200">+{formatCurrency(salaryPlan?.plan?.disposable || 0, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="opacity-50 uppercase font-bold tracking-tight">Cash In Hand</span>
                                            <span className="font-bold text-gray-200">+{formatCurrency(cashInHand, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="opacity-50 uppercase font-bold tracking-tight">Net Flow</span>
                                            <span className={`font-bold ${monthlyNetFlowTransactions >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {monthlyNetFlowTransactions >= 0 ? '+' : ''}{formatCurrency(monthlyNetFlowTransactions, userProfile?.currency || 'BDT')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] pt-0.5">
                                            <span className="opacity-50 uppercase font-bold tracking-tight">Total Assets</span>
                                            <span className="font-black text-white">{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl text-center justify-center border ${creditDue >= loanDue ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        {creditDue >= loanDue ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                        {creditDue >= loanDue ? 'Net Receivable: ' : 'Net Due: '}
                                        <span className="text-sm">{formatCurrency(Math.abs(creditDue - loanDue), userProfile?.currency || 'BDT')}</span>
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
