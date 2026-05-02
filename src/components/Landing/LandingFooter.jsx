import React from 'react';
import { Wallet, ShieldCheck } from 'lucide-react';

const LandingFooter = () => {
  return (
    <footer className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-[#050b1a] border-t border-gray-200/50 dark:border-white/5 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 md:gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative bg-white dark:bg-slate-900 rounded-xl p-2 border border-gray-200 dark:border-white/10 shadow-sm">
                <img
                    src="/favicon/favicon.svg"
                    alt="Smart Wallet Logo"
                    className="w-7 h-7 dark:opacity-90"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                    }}
                />
                <Wallet className="w-7 h-7 text-teal-500" style={{ display: 'none' }} />
            </div>
            <div className="flex flex-col items-center md:items-start">
                <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-[0.25em] leading-none">Wallet <span className="text-teal-500">Tracker</span></span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mt-2">Sovereign Financial Infrastructure</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-6 sm:gap-5">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-2.5 group cursor-default">
                    <ShieldCheck className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">On-Device Security</span>
                </div>
                <div className="hidden sm:block w-[1px] h-4 bg-gray-200 dark:bg-white/10"></div>
                <div className="flex items-center gap-2.5 group cursor-default">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.4)]"></div>
                    <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Secure Node Active</span>
                </div>
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-gray-400 dark:text-gray-700 uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                &copy; {new Date().getFullYear()} Wallet Tracker. Engineered for Privacy.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;