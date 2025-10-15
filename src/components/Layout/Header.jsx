import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Plus, RefreshCw, DollarSign, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/helpers';
import UserMenuDropdown from '../User/UserMenuDropdown';

const Header = ({
    onAddTransaction,
    onOpenProfile,
    onOpenSettings,
    currentLanguage,
    onLanguageToggle,
    isRefreshing = false,
    onRefresh
}) => {
    const { userProfile } = useAuth();

    const balance = userProfile?.balance || 0;
    // legacy modal state removed; using compact floating panel instead
    const [showFloatingBalance, setShowFloatingBalance] = useState(false);
    const [entered, setEntered] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const hideTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

    const handleBalanceClick = async () => {
        // If a refresh handler is provided, call it first so balance is fresh
        if (onRefresh) {
            try {
                await onRefresh();
            } catch (err) {
                console.warn('Header: onRefresh failed', err);
            }
        }
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

        // start hide timer: begin close animation after 5s
        hideTimerRef.current = setTimeout(() => {
            setIsClosing(true);
            setEntered(false);
            // after animation finishes, remove from DOM
            closeTimerRef.current = setTimeout(() => {
                setShowFloatingBalance(false);
                setIsClosing(false);
                closeTimerRef.current = null;
            }, 300); // match transition duration
        }, 5000);
    };

    // Close floating panel on unmount and clear timers
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

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
                                        <div className="flex items-center gap-2">
                                            <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-20 rounded"></div>
                                            <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBalanceClick}
                                            className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1 group"
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
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm opacity-90">Current Balance</div>
                                    <div className="text-2xl font-bold mt-1">{formatCurrency(balance, userProfile?.currency || 'BDT')}</div>
                                    <div className="text-xs opacity-80 mt-1">Updated just now</div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                                        <span className="text-sm">Net: {formatCurrency(((userProfile?.totalCreditGiven || 0) - (userProfile?.totalLoanTaken || 0)), userProfile?.currency || 'BDT')}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs ${((userProfile?.totalCreditGiven || 0) - (userProfile?.totalLoanTaken || 0)) > 0 ? 'bg-blue-100 text-blue-800' : ((userProfile?.totalCreditGiven || 0) - (userProfile?.totalLoanTaken || 0)) < 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {((userProfile?.totalCreditGiven || 0) - (userProfile?.totalLoanTaken || 0)) > 0 ? 'You lent more' : ((userProfile?.totalCreditGiven || 0) - (userProfile?.totalLoanTaken || 0)) < 0 ? 'You borrowed more' : 'Balanced'}
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