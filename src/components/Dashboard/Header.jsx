import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wallet, Plus, RefreshCw, DollarSign, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import useLocalRefresh from '../../hooks/useLocalRefresh';
import { formatCurrency } from '../../utils/helpers';
import UserMenuDropdown from '../User/UserMenuDropdown';
import { getOutstandingCredits, getOutstandingLoans } from '../../services/transactionService';
import Skeleton, { HeaderSkeleton } from '../UI/SkeletonLoader';
import { APP_EVENTS } from '../../config/constants';

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

    // legacy modal state removed; using compact floating panel instead
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

            // 1. Add Plan-based loans as the baseline
            if (salaryPlan?.plan?.loanDetails) {
                salaryPlan.plan.loanDetails.forEach(loan => {
                    lDue += Number(loan.totalLeft || 0);
                });
            }

            // 2. Add Transaction-based credits
            if (creditsResult.success && Array.isArray(creditsResult.data)) {
                creditsResult.data.forEach(c => {
                    cDue += Number(c.remainingAmount || 0);
                });
            }

            // 3. Add/Adjust with Transaction-based loans
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
        // Only refresh local dues (no global summary refresh) and show floating panel
        await runLocalRefresh(async () => {
            try {
                await refreshDues();
            } catch (err) {
                console.warn('Header: refreshDues failed', err);
            }
        });

        // Show compact floating balance under header and auto-hide
        // Reset any closing state and timers
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsClosing(false);
        setShowFloatingBalance(true);
        // trigger enter animation on next frame
        requestAnimationFrame(() => setEntered(true));
    };

    // Close floating panel on unmount and clear timers
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // Refresh dues on mount and when transactions change elsewhere
    useEffect(() => {
        refreshDues();

        const handleTxUpdate = () => {
            refreshDues();
        };

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
        // cancel any existing timers
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
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3">
                            <img
                                src="/favicon/favicon.svg"
                                alt="Smart Wallet Logo"
                                className="w-8 h-8"
                                onError={(e) => {
                                    // Fallback to Wallet icon if logo fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <Wallet className="w-6 h-6 text-white" style={{ display: 'none' }} />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Smart Wallet
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span>Balance:</span>
                                    {isRefreshing ? (
                                        // global refresh skeleton (provided by parent)
                                        <div className="flex items-center gap-2">
                                            <Skeleton width="w-20" height="h-4" />
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : isLocalRefreshing ? (
                                        // show a compact inline skeleton for the balance while refreshing
                                        <div className="inline-flex items-center gap-2">
                                            <Skeleton width="w-20" height="h-4" />
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBalanceClick}
                                            className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-2 group"
                                            title="Click to refresh balance"
                                        >
                                            {formatCurrency(balance, userProfile?.currency || 'BDT')}
                                            <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Add Transaction Button */}
                            <button
                                onClick={onAddTransaction}
                                className="flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:block">Add</span>
                            </button>

                            {/* User Menu */}
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
            {/* Floating compact balance (appears under header) */}
            {showFloatingBalance && (
                <div className="fixed top-16 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <div className="pointer-events-auto w-11/12 max-w-xl px-4">
                        <div className={`relative bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl shadow-lg p-4 transform transition-all duration-300 ease-out ${entered && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                            {/* top-right close button */}
                            <button
                                onClick={handleFloatingClose}
                                className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-gray-700 dark:bg-gray-800 dark:text-white shadow-md border border-white/20 hover:scale-105 transform transition-transform z-10"
                                aria-label="Close balance panel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col gap-4 select-none">
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1 text-amber-200">Total Wealth</div>
                                            <div className="text-3xl font-black">{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</div>
                                            <div className="text-[9px] mt-1 opacity-70 font-bold">Total Liquid Money + Plan Margin</div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1 text-teal-200">Spendable</div>
                                            <div className="px-3 py-1 bg-white/10 rounded-lg">
                                                <div className="text-sm font-black">{formatCurrency(monthlySurplus, userProfile?.currency || 'BDT')}</div>
                                            </div>
                                            <div className="text-[10px] mt-2 opacity-90 font-bold flex items-center justify-end gap-2 text-amber-200">
                                                <span className="uppercase tracking-tighter text-[9px] opacity-70">Required:</span>
                                                <span className="text-white">{formatCurrency((salaryPlan?.plan?.actualSavings || 0) + (salaryPlan?.plan?.monthlyForGoal || 0), userProfile?.currency || 'BDT')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/10 space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-teal-200 mb-2 flex items-center justify-between">
                                            <span>Breakdown</span>
                                            <span className="text-[9px] opacity-50 lowercase italic font-normal tracking-normal">Running month math</span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-70">Monthly Plan Margin (Income - Fixed)</span>
                                            <span className="font-bold">+{formatCurrency(salaryPlan?.plan?.disposable || 0, userProfile?.currency || 'BDT')}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-70">Initial Cash in Hand</span>
                                            <span className="font-bold">+{formatCurrency(cashInHand, userProfile?.currency || 'BDT')}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="opacity-70">Transaction Net Flow (Repayments/Loans)</span>
                                            <span className={`font-bold ${monthlyNetFlowTransactions >= 0 ? 'text-emerald-300' : 'text-orange-300'}`}>
                                                {monthlyNetFlowTransactions >= 0 ? '+' : ''}{formatCurrency(monthlyNetFlowTransactions, userProfile?.currency || 'BDT')}
                                            </span>
                                        </div>

                                        <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center text-sm font-black text-white">
                                            <span>Total Assets</span>
                                            <span>{formatCurrency(totalWealth, userProfile?.currency || 'BDT')}</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-center justify-center ${creditDue >= loanDue ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {creditDue >= loanDue ? 'Net Receivable: ' : 'Net Due: '}
                                            {formatCurrency(Math.abs(creditDue - loanDue), userProfile?.currency || 'BDT')}
                                        </span>
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