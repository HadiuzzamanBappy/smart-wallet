import React from 'react';
import { Wallet, ShieldCheck } from 'lucide-react';

const LandingFooter = () => {
  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative bg-white/5 rounded-lg p-1.5 border border-white/10">
                <img
                    src="/favicon/favicon.svg"
                    alt="Smart Wallet Logo"
                    className="w-6 h-6 opacity-80"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                    }}
                />
                <Wallet className="w-6 h-6 text-teal-500" style={{ display: 'none' }} />
            </div>
            <div className="flex flex-col items-center md:items-start">
                <span className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">Wallet <span className="text-teal-500">Tracker</span></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1.5">Sovereign Financial Infrastructure</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-5 sm:gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-500">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                    <span>On-Device Security</span>
                </div>
                <div className="hidden sm:block w-[1px] h-3 bg-white/10"></div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                    <span>Secure Node Active</span>
                </div>
            </div>
            <div className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                &copy; {new Date().getFullYear()} Wallet Tracker. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;