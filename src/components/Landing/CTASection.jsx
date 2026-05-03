import React from 'react';
import { Shield, Zap, ArrowRight, Lock } from 'lucide-react';
import Button from '../UI/base/Button';
import IconBox from '../UI/base/IconBox';

const CTASection = ({ onGetStarted }) => {
  return (
    <section className="py-24 sm:py-40 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-ink-950 transition-colors duration-500">
      {/* Intense Atmospheric Glow - Nexus Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary-500/[0.08] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary-500/[0.04] rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-10 shadow-2xl">
          <Lock className="w-4 h-4 text-primary-400" />
          <span className="text-overline text-paper-700 font-black tracking-widest uppercase">Identity Protected Authorization</span>
        </div>

        <h2 className="text-h2 sm:text-h1 lg:text-[5rem] font-black text-white mb-10 tracking-tighter leading-[1] max-w-4xl mx-auto">
          Ready to Secure Your<br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary-400 via-emerald-400 to-primary-500 bg-clip-text text-transparent italic px-2">Financial Future?</span>
        </h2>

        <p className="text-body sm:text-lg lg:text-xl text-paper-700 max-w-2xl mx-auto mb-16 leading-relaxed px-4 font-medium opacity-80">
          Join the elite workspace where privacy meets intelligence. Start your sovereign financial journey in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center px-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            color="primary"
            icon={ArrowRight}
          >
            Connect Wallet
          </Button>
        </div>

        <div className="mt-24 sm:mt-32 flex flex-wrap items-center justify-center gap-x-16 sm:gap-x-24 gap-y-10">
          <div className="flex items-center gap-5 group">
            <IconBox icon={Shield} size="lg" variant="glass" color="primary" className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-overline text-white font-black tracking-widest uppercase leading-none mb-1">100% Private</p>
              <p className="text-[10px] text-paper-800 font-bold tracking-tight uppercase">Local Encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-5 group">
            <IconBox icon={Zap} size="lg" variant="glass" color="secondary" className="group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <p className="text-overline text-white font-black tracking-widest uppercase leading-none mb-1">Zero Latency</p>
              <p className="text-[10px] text-paper-800 font-bold tracking-tight uppercase">Edge Processing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
