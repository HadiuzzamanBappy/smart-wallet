import React from 'react';
import { Shield, Zap, Github, ArrowRight, Lock } from 'lucide-react';
import Button from '../UI/base/Button';

const CTASection = ({ onGetStarted }) => {
  return (
    <section className="py-16 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-900 dark:bg-[#050b1a] transition-colors duration-500">
      {/* Decorative background mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-teal-500/20 rounded-full blur-[100px] sm:blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-blue-500/20 rounded-full blur-[100px] sm:blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 sm:mb-10">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">Secure Initialization</span>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-8 sm:mb-10 tracking-tight leading-none">
          Ready to Secure Your<br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent italic px-2">Financial Future?</span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-12 sm:mb-16 leading-relaxed px-4 font-medium">
          Join the elite workspace where privacy meets intelligence. Start your sovereign financial journey in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center px-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            color="teal"
            className="w-full sm:w-auto !rounded-2xl shadow-2xl shadow-teal-500/20 group !py-4 sm:!px-10"
          >
            <span className="text-sm font-black uppercase tracking-widest">Initialize Account</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="mt-16 sm:mt-24 flex flex-wrap items-center justify-center gap-x-12 sm:gap-x-16 gap-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">100% Private</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Zero Setup</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;