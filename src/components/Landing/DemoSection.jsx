import React from 'react';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

const DemoSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-6">
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Interface Preview</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
            Effortless Intelligence.<br />
            <span className="opacity-40 italic font-medium px-2">Zero Friction.</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Our natural language engine decodes your financial intent in real-time.
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto group">
          {/* Decorative background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-500">
            {/* Terminal Header */}
            <div className="bg-gray-50 dark:bg-white/[0.03] px-6 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-red-500/30 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-yellow-500/30 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-green-500/30 rounded-full"></div>
                <span className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Neural Workspace v1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">System Active</span>
              </div>
            </div>
            
            <div className="p-8 sm:p-12 space-y-8">
              {/* User Input Bubble */}
              <div className="flex justify-end animate-in slide-in-from-right-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl blur opacity-30"></div>
                  <div className="relative bg-gray-900 text-white px-6 py-4 rounded-3xl rounded-tr-sm text-lg font-medium shadow-xl">
                    "I bought groceries for $75 today"
                  </div>
                </div>
              </div>
              
              {/* AI Response Bubble */}
              <div className="flex justify-start animate-in slide-in-from-left-4 delay-500">
                <div className="w-full max-w-md bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 p-6 rounded-3xl rounded-tl-sm shadow-xl relative overflow-hidden group/card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
                        <Sparkles className="w-5 h-5 text-teal-500" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-1">Entity Extraction</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🍔</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Food & Dining</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Amount</div>
                            <div className="text-sm font-black text-gray-900 dark:text-white">$75.00</div>
                        </div>
                        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</div>
                            <div className="flex items-center gap-1 text-teal-500">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-sm font-black italic">Verified</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle decorative mesh background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -z-10 group-hover/card:bg-teal-500/10 transition-colors"></div>
                </div>
              </div>
            </div>
            
            {/* Terminal Footer */}
            <div className="bg-gray-50/50 dark:bg-white/[0.02] px-8 py-4 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <div className="flex gap-4">
                        <span>Lat: 12ms</span>
                        <span>Confidence: 99.4%</span>
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