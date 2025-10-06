import React from 'react';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
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

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center space-x-3">
                        <img
                            src="/favicon/favicon.svg"
                            alt="Wallet Tracker Logo"
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
                                Wallet Tracker
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
                                        onClick={onRefresh || (() => {})}
                                        className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-1 group"
                                        title="Click to refresh balance"
                                    >
                                        {formatCurrency(balance, 'BDT')}
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
    );
};

export default Header;