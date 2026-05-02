import React from 'react';
import { Lock, Shield, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../UI/base/Button';
import { THEME } from '../../config/theme';

const HeroSection = ({ onGetStarted }) => {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary-500 flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold ring-2 ring-white dark:ring-gray-900">1</div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold ring-2 ring-white dark:ring-gray-900">2</div>
            </div>
            <span className={`${THEME.typography.label} text-gray-500 dark:text-gray-400`}>
              New: AI Natural Language Processing
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 tracking-tight leading-[1.1] sm:leading-[0.95]">
            Master Your Money<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary-500 via-emerald-500 to-blue-600 bg-clip-text text-transparent italic px-2">
              Privately.
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-4">
            The high-density financial command center that keeps your data encrypted on-device.
            No tracking. No cloud leaks. Just pure intelligence.
          </p>

          <div className="flex justify-center mb-12 sm:mb-16">
            <Button
              onClick={onGetStarted}
              size="lg"
              color="teal"
              icon={ArrowRight}
              className="!rounded-2xl sm:!rounded-3xl shadow-2xl shadow-primary-500/20 py-4 px-8 group"
            >
              Initialize Workspace
            </Button>
          </div>

          <div className="flex justify-center items-center px-4">
            <div className="flex items-center gap-4 sm:gap-6 px-5 sm:px-6 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                <span className={THEME.typography.label}>AES-256</span>
              </div>
              <div className="w-[1px] h-3 sm:h-4 bg-gray-200 dark:bg-white/10"></div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                <span className={THEME.typography.label}>AI Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview Component */}
        <div className="relative max-w-5xl mx-auto mt-8 sm:mt-0">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-[1.5rem] sm:rounded-[2.5rem] blur-xl sm:blur-2xl opacity-50 -z-10"></div>
          <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden aspect-[4/3] sm:aspect-[21/9] p-4 sm:p-8 relative">
            {/* Simulated Dashboard UI */}
            <div className="flex flex-col h-full gap-4 sm:gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 sm:gap-4">
                  <div className="w-20 sm:w-32 h-3 sm:h-4 bg-gray-100 dark:bg-white/5 rounded-full" />
                  <div className="w-16 sm:w-24 h-3 sm:h-4 bg-gray-100 dark:bg-white/5 rounded-full" />
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-white/5" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="h-20 sm:h-24 rounded-xl sm:rounded-2xl bg-primary-500/5 border border-primary-500/10 p-3 sm:p-4">
                  <div className="w-10 sm:w-12 h-1.5 sm:h-2 bg-primary-500/20 rounded-full mb-2 sm:mb-3" />
                  <div className="w-16 sm:w-20 h-3 sm:h-4 bg-primary-500/40 rounded-full" />
                </div>
                <div className="h-20 sm:h-24 rounded-xl sm:rounded-2xl bg-blue-500/5 border border-blue-500/10 p-3 sm:p-4">
                  <div className="w-10 sm:w-12 h-1.5 sm:h-2 bg-blue-500/20 rounded-full mb-2 sm:mb-3" />
                  <div className="w-16 sm:w-20 h-3 sm:h-4 bg-blue-500/40 rounded-full" />
                </div>
                <div className="hidden sm:block h-24 rounded-2xl bg-purple-500/5 border border-purple-500/10 p-4">
                  <div className="w-12 h-2 bg-purple-500/20 rounded-full mb-3" />
                  <div className="w-20 h-4 bg-purple-500/40 rounded-full" />
                </div>
              </div>
              <div className="flex-1 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-4 sm:p-6 overflow-hidden">
                <div className="space-y-3 sm:space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-200 dark:bg-white/5" />
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-gray-200 dark:bg-white/10 rounded-full" />
                          <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-gray-100 dark:bg-white/5 rounded-full" />
                        </div>
                      </div>
                      <div className="w-12 sm:w-16 h-2 sm:h-3 bg-gray-200 dark:bg-white/10 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Overlay "Natural Language" Input */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-sm sm:max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-primary-500/30 p-3 sm:p-4 transform translate-y-4 sm:translate-y-8 animate-bounce-subtle">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
                    "Received <span className="text-primary-500 font-bold">50k BDT</span> from project"
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