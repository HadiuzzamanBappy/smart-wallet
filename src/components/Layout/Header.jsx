import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import UserMenuDropdown from '../User/UserMenuDropdown';
import { useAuth } from '../../hooks/useAuth';
import BalanceModal from './BalanceModal';

const Header = ({ isRefreshing = false }) => {
  const { userProfile } = useAuth();
  const [showBalance, setShowBalance] = useState(false);

  const formatCurrencyAmount = (amount) => {
    const currency = userProfile?.currency || 'BDT';
    const currencyLocales = {
      BDT: 'en-BD',
      USD: 'en-US',
      EUR: 'en-DE',
      GBP: 'en-GB',
      INR: 'en-IN'
    };

    const locale = currencyLocales[currency] || 'en-BD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'BDT' ? 0 : 2
    }).format(amount || 0);
  };

  return (
    <>
    <header className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-teal-100 dark:border-gray-700 sticky top-0 z-40 shadow-sm dark:shadow-lg backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto md:max-w-4xl w-full">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          {/* Logo and Website Name */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/favicon/favicon.svg" alt="" width={32} height={32}/>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent truncate">
                Wallet Tracker
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                Smart Financial Management
              </p>
            </div>
          </div>

          {/* Right side - Theme Toggle and User Menu */}
          <div className="flex items-center gap-3 sm:gap-2">
            {/* Balance badge (always visible) */}
            <button
              type="button"
              onClick={() => setShowBalance(true)}
              className={`flex-shrink-0 flex items-center px-2 py-1 rounded-xl text-sm font-medium space-x-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                isRefreshing
                  ? 'bg-white/40 dark:bg-gray-800/40 border border-transparent text-transparent'
                  : 'bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-100'
              }`}
              aria-label="Open balance details"
              aria-live="polite"
              aria-busy={isRefreshing}
            >
              {/* Icon - show subtle skeleton glow when refreshing */}
              {isRefreshing ? (
                <div className="w-4 h-4 rounded bg-teal-200 dark:bg-teal-800 ring-2 ring-teal-200/60 dark:ring-teal-800/40 animate-pulse" aria-hidden="true"></div>
              ) : (
                <Wallet className="w-4 h-4 text-teal-600" />
              )}

              {/* Balance / Placeholder */}
              <div className="flex flex-col">
                {isRefreshing ? (
                  <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700/60 ring-1 ring-teal-200/40 dark:ring-teal-800/30 animate-pulse" aria-hidden="true"></div>
                ) : (
                  <span className="text-sm">{formatCurrencyAmount(userProfile?.balance)}</span>
                )}
              </div>
            </button>
            <UserMenuDropdown />
          </div>
          </div>
        </div>
      </div>
    </header>
    <BalanceModal open={showBalance} onClose={() => setShowBalance(false)} balance={userProfile?.balance} currency={userProfile?.currency} />
    </>
  );
};

export default Header;