import React from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import Button from '../UI/base/Button';

const LandingNav = ({ onGetStarted }) => {
  return (
    <nav className="fixed top-0 w-full bg-paper-50/70 dark:bg-ink-950/70 backdrop-blur-2xl border-b border-paper-200 dark:border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative bg-paper-50 dark:bg-ink-900 rounded-xl p-2 border border-paper-100 dark:border-white/10 shadow-lg shadow-ink-950/5">
                <img
                  src="/favicon/favicon.svg"
                  alt="Wallet Tracker Logo"
                  className="w-6 h-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Wallet className="w-6 h-6 text-primary-500" style={{ display: 'none' }} />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-body sm:text-lg font-black text-ink-900 dark:text-paper-50 tracking-tight leading-none">
                Wallet <span className="text-primary-500 italic">Tracker</span>
              </span>
              <div className="hidden xs:flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                <span className="text-overline text-ink-400 dark:text-paper-700 font-black tracking-widest uppercase">System Core v2.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              onClick={onGetStarted}
              size="md"
              color="primary"
              icon={ArrowRight}
            >
              Connect
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
