import React from 'react';
import { Wallet, Github, ArrowRight } from 'lucide-react';

const LandingNav = ({ onGetStarted }) => {
  return (
    <nav className="fixed top-0 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute -inset-1 bg-teal-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-lg p-1.5 border border-gray-100 dark:border-white/10">
                    <img
                        src="/favicon/favicon.svg"
                        alt="Smart Wallet Logo"
                        className="w-6 h-6"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <Wallet className="w-6 h-6 text-teal-500" style={{ display: 'none' }} />
                </div>
            </div>
            
            <div className="flex flex-col">
                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] leading-none">Smart <span className="text-teal-500">Wallet</span></span>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">System v1.0</span>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-teal-500/10"
            >
              <span>Initialize</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;