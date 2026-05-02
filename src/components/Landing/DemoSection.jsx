import React from 'react';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

const DemoSection = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-8 sm:mb-10">
            <Terminal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">Interface Preview</span>
          </div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-8 sm:mb-10 tracking-tight leading-none">
            Effortless Intelligence.<br className="hidden sm:block" />
            <span className="opacity-30 dark:opacity-40 italic font-medium px-2">Zero Friction.</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Our natural language engine decodes your financial intent in real-time.
          </p>
        </div>
        
        <div className="relative max-w-5xl mx-auto group">
          {/* Decorative background glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-600/20 rounded-[2.5rem] sm:rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-gray-200/50 dark:border-white/10 overflow-hidden transition-all duration-700">
            {/* Terminal Header */}
            <div className="bg-gray-50/50 dark:bg-white/[0.03] px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-3 h-3 bg-rose-500/40 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500/40 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-500/40 rounded-full"></div>
                <span className="ml-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 truncate">Neural Workspace v1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-[10px] sm:text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest hidden xs:block">System Active</span>
              </div>
            </div>
            
            <div className="p-8 sm:p-16 space-y-8 sm:space-y-12">
              {/* User Input Bubble */}
              <div className="flex justify-end animate-in slide-in-from-right-8 duration-700">
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl blur opacity-30"></div>
                  <div className="relative bg-gray-900 text-white px-6 sm:px-10 py-4 sm:py-6 rounded-3xl rounded-tr-sm text-base sm:text-xl font-medium shadow-2xl">
                    "I bought groceries for $75 today"
                  </div>
                </div>
              </div>
              
              {/* AI Response Bubble */}
              <div className="flex justify-start animate-in slide-in-from-left-8 duration-700 delay-500">
                <div className="w-full max-w-md sm:max-w-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/10 p-6 sm:p-10 rounded-3xl rounded-tl-sm shadow-xl relative overflow-hidden group/card">
                  <div className="flex items-start gap-5 sm:gap-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="space-y-5 sm:space-y-6">
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-[0.2em] mb-2">Entity Extraction</div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl sm:text-3xl">🍔</span>
                            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Food & Dining</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white/80 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest mb-1.5">Amount</div>
                            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">$75.00</div>
                        </div>
                        <div className="bg-white/80 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest mb-1.5">Status</div>
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-sm sm:text-base font-black italic">Verified</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle decorative mesh background */}
                  <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-teal-500/5 rounded-full blur-[80px] -z-10 group-hover/card:bg-teal-500/10 transition-colors"></div>
                </div>
              </div>
            </div>
            
            {/* Terminal Footer */}
            <div className="bg-gray-50/50 dark:bg-white/[0.02] px-6 sm:px-10 py-4 sm:py-5 border-t border-gray-200/50 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
                    <div className="flex gap-4 sm:gap-6">
                        <span>Lat: 12ms</span>
                        <span className="hidden xs:block">Confidence: 99.4%</span>
                    </div>
                    <span>Hash: 0x9f4a...2e1c</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;