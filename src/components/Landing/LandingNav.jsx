import React from 'react';
import { Wallet, Github, ArrowRight } from 'lucide-react';
import Button from '../UI/base/Button';
import { THEME } from '../../config/theme';

const LandingNav = ({ onGetStarted }) => {
  return (
    <nav className="fixed top-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-primary-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-lg p-1 sm:p-1.5 border border-gray-100 dark:border-white/10">
                <img
                  src="/favicon/favicon.svg"
                  alt="Smart Wallet Logo"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" style={{ display: 'none' }} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none">Wallet <span className="text-primary-500">Tracker</span></span>
              <div className="hidden xs:flex items-center gap-1.5 mt-0.5 sm:mt-1">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                <span className={THEME.typography.label}>System v1.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              onClick={onGetStarted}
              size="md"
              color="teal"
              icon={ArrowRight}
              className="!rounded-xl sm:!rounded-2xl shadow-xl shadow-primary-500/10"
            >
              Initialize
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;