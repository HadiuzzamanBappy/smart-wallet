import React from 'react';
import { Lock, Shield, Sparkles, ArrowRight, Zap } from 'lucide-react';
import Button from '../UI/base/Button';
import IconBox from '../UI/base/IconBox';

const HeroSection = ({ onGetStarted }) => {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle Atmospheric Glow - Nexus Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary-500/[0.03] dark:bg-primary-500/[0.05] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-secondary-500/[0.02] dark:bg-secondary-500/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-paper-100/50 dark:bg-white/5 backdrop-blur-xl border border-paper-200 dark:border-white/10 rounded-full mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 shadow-xl shadow-ink-950/5">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-paper-50 dark:ring-ink-950">1</div>
              <div className="w-5 h-5 rounded-full bg-secondary-500 flex items-center justify-center text-[10px] text-white font-black ring-2 ring-paper-50 dark:ring-ink-950">2</div>
            </div>
            <span className="text-label text-ink-400 dark:text-paper-700 font-bold tracking-tight">
              v2.0: AI Financial Intelligence Enabled
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-black text-ink-900 dark:text-paper-50 mb-8 sm:mb-10 tracking-tighter leading-[1.1] sm:leading-[0.9] max-w-4xl mx-auto">
            Command Your Capital<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary-500 via-emerald-500 to-primary-600 bg-clip-text text-transparent italic px-2">
              Surgically.
            </span>
          </h1>

          <p className="text-body sm:text-lg lg:text-xl text-ink-400 dark:text-paper-700 max-w-2xl mx-auto mb-12 leading-relaxed font-medium px-4">
            The high-density financial command center that keeps your data encrypted on-device.
            Zero telemetry. Zero tracking. Absolute sovereignty.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 sm:mb-24">
            <Button
              onClick={onGetStarted}
              size="lg"
              color="primary"
              icon={ArrowRight}
            >
              Connect Wallet
            </Button>
          </div>

          <div className="flex justify-center items-center px-4">
            <div className="flex items-center gap-6 sm:gap-8 px-8 py-4 bg-paper-100/30 dark:bg-white/5 backdrop-blur-2xl border border-paper-100 dark:border-white/5 rounded-2xl shadow-lg shadow-ink-950/5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary-500" />
                <span className="text-overline text-ink-400 dark:text-paper-700 font-black tracking-widest">AES-256</span>
              </div>
              <div className="w-px h-4 bg-paper-200 dark:bg-white/10"></div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-overline text-ink-400 dark:text-paper-700 font-black tracking-widest">AI NEURAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview Component - Executive Style */}
        <div className="relative max-w-5xl mx-auto mt-12 sm:mt-0 group">
          <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-r from-primary-500/20 to-secondary-500/10 rounded-[2rem] sm:rounded-[4rem] blur-2xl sm:blur-3xl opacity-40 -z-10 transition-opacity duration-1000 group-hover:opacity-60"></div>
          <div className="bg-paper-50 dark:bg-ink-950 rounded-[2rem] sm:rounded-[3rem] border border-paper-200 dark:border-white/10 shadow-2xl overflow-hidden aspect-[4/3] sm:aspect-[21/9] p-4 sm:p-10 relative">
            {/* Simulated Dashboard UI */}
            <div className="flex flex-col h-full gap-6 sm:gap-8 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <IconBox icon={Zap} size="sm" color="primary" variant="glass" />
                  <div className="w-32 h-2.5 bg-paper-200 dark:bg-white/10 rounded-full" />
                </div>
                <div className="w-10 h-10 rounded-full bg-paper-200 dark:bg-white/10 border border-white/5" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="h-28 rounded-2xl bg-primary-500/5 border border-primary-500/10 p-5">
                  <div className="w-12 h-2 bg-primary-500/20 rounded-full mb-4" />
                  <div className="w-24 h-5 bg-primary-500/30 rounded-full" />
                </div>
                <div className="h-28 rounded-2xl bg-secondary-500/5 border border-secondary-500/10 p-5">
                  <div className="w-12 h-2 bg-secondary-500/20 rounded-full mb-4" />
                  <div className="w-24 h-5 bg-secondary-500/30 rounded-full" />
                </div>
                <div className="hidden sm:block h-28 rounded-2xl bg-ink-100 dark:bg-white/[0.02] border border-paper-200 dark:border-white/5 p-5">
                  <div className="w-12 h-2 bg-ink-300/20 rounded-full mb-4" />
                  <div className="w-24 h-5 bg-ink-300/30 rounded-full" />
                </div>
              </div>

              <div className="flex-1 rounded-2xl bg-paper-100/50 dark:bg-white/[0.02] border border-paper-100 dark:border-white/5 p-6 overflow-hidden">
                <div className="space-y-5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-paper-200 dark:bg-white/5 border border-white/5" />
                        <div className="space-y-2">
                          <div className="w-28 h-2 bg-paper-300 dark:bg-white/10 rounded-full" />
                          <div className="w-16 h-1.5 bg-paper-200 dark:bg-white/5 rounded-full" />
                        </div>
                      </div>
                      <div className="w-20 h-3 bg-paper-300 dark:bg-white/10 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Overlay "Natural Language" Input */}
            <div className="absolute inset-0 flex items-center justify-center p-6 translate-y-8 sm:translate-y-12">
              <div className="w-full max-w-sm sm:max-w-xl bg-paper-50/95 dark:bg-ink-950/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-primary-500/30 p-5 sm:p-6 transform animate-bounce-subtle ring-1 ring-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center animate-pulse shadow-lg shadow-primary-500/40">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-body font-bold text-ink-700 dark:text-paper-400 tracking-tight">
                    "Received <span className="text-primary-500 font-black">50k BDT</span> from project"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
