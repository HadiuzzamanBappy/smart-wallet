import React from 'react';
import { ArrowRight, Lock, Shield, Sparkles, Zap } from 'lucide-react';

const HeroSection = ({ onGetStarted }) => {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white dark:ring-gray-900">1</div>
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white dark:ring-gray-900">2</div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              New: AI Natural Language Processing
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-[0.95]">
            Master Your Money<br />
            <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-600 bg-clip-text text-transparent italic px-2">
              Privately.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The high-density financial command center that keeps your data encrypted on-device. 
            No tracking. No cloud leaks. Just pure intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-teal-500/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Initialize Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-6 px-6 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AES-256</span>
                </div>
                <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10"></div>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Enabled</span>
                </div>
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview Component */}
        <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] p-4 sm:p-8 relative">
                {/* Simulated Dashboard UI */}
                <div className="flex flex-col h-full gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <div className="w-32 h-4 bg-gray-100 dark:bg-white/5 rounded-full" />
                            <div className="w-24 h-4 bg-gray-100 dark:bg-white/5 rounded-full" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 rounded-2xl bg-teal-500/5 border border-teal-500/10 p-4">
                            <div className="w-12 h-2 bg-teal-500/20 rounded-full mb-3" />
                            <div className="w-20 h-4 bg-teal-500/40 rounded-full" />
                        </div>
                        <div className="h-24 rounded-2xl bg-blue-500/5 border border-blue-500/10 p-4">
                            <div className="w-12 h-2 bg-blue-500/20 rounded-full mb-3" />
                            <div className="w-20 h-4 bg-blue-500/40 rounded-full" />
                        </div>
                        <div className="h-24 rounded-2xl bg-purple-500/5 border border-purple-500/10 p-4">
                            <div className="w-12 h-2 bg-purple-500/20 rounded-full mb-3" />
                            <div className="w-20 h-4 bg-purple-500/40 rounded-full" />
                        </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-6">
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/5" />
                                        <div className="space-y-2">
                                            <div className="w-24 h-2 bg-gray-200 dark:bg-white/10 rounded-full" />
                                            <div className="w-16 h-2 bg-gray-100 dark:bg-white/5 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="w-16 h-3 bg-gray-200 dark:bg-white/10 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Interactive Overlay "Natural Language" Input */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-teal-500/30 p-4 transform translate-y-8 animate-bounce-subtle">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center animate-pulse">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                "Received <span className="text-teal-500 font-bold">50k BDT</span> from project payment"
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