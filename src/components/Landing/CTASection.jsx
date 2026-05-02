import React from 'react';
import { Shield, Zap, Github, ArrowRight, Lock } from 'lucide-react';
import Button from '../UI/base/Button';

const CTASection = ({ onGetStarted }) => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-900">
      {/* Decorative background mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/20 rounded-full blur-[80px] sm:blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 sm:mb-8">
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-500" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400">Secure Initialization</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8 tracking-tight leading-tight">
          Ready to Secure Your<br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent italic px-2">Financial Future?</span>
        </h2>
        
        <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-4">
          Join the elite workspace where privacy meets intelligence. Start your sovereign financial journey in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            color="teal"
            className="w-full sm:w-auto !rounded-2xl shadow-2xl shadow-teal-500/20 group"
          >
            <span>Initialize Account</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4 sm:gap-y-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-500">100% Private</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-500">Zero Setup</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;