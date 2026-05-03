import React from 'react';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import IconBox from '../UI/base/IconBox';

const DemoSection = () => {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full mb-8 sm:mb-10 shadow-xl shadow-primary-500/5">
            <Terminal className="w-4 h-4" />
            <span className="text-overline font-black tracking-widest uppercase">Intelligence Interface Preview</span>
          </div>
          <h2 className="text-h2 sm:text-h1 font-black text-ink-900 dark:text-paper-50 mb-8 sm:mb-10 tracking-tighter leading-[1.1]">
            Effortless Intelligence.<br className="hidden sm:block" />
            <span className="opacity-30 dark:opacity-40 italic px-2">Zero Friction.</span>
          </h2>
          <p className="text-body sm:text-lg lg:text-xl text-ink-400 dark:text-paper-700 font-medium leading-relaxed max-w-2xl mx-auto">
            Our natural language engine decodes your financial intent in real-time.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto group">
          {/* Decorative background glow */}
          <div className="absolute -inset-8 bg-gradient-to-r from-primary-500/20 to-secondary-500/10 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative bg-paper-50 dark:bg-ink-950 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border border-paper-200/50 dark:border-white/10 overflow-hidden transition-all duration-1000">
            {/* Terminal Header */}
            <div className="bg-paper-100/50 dark:bg-white/[0.03] px-5 sm:px-8 py-4 sm:py-5 border-b border-paper-200/50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-error-500/40 rounded-full"></div>
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-warning-500/40 rounded-full"></div>
                <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-success-500/40 rounded-full"></div>
                <span className="text-[8px] sm:text-overline text-ink-400 dark:text-paper-600 ml-2 sm:ml-4 font-black tracking-widest uppercase">Neural Workspace v2.0</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                <span className="text-[8px] sm:text-overline text-primary-600 dark:text-primary-400 hidden xs:block font-black tracking-widest uppercase">System Active</span>
              </div>
            </div>

            <div className="p-6 sm:p-20 space-y-10 sm:space-y-16">
              {/* User Input Bubble */}
              <div className="flex justify-end animate-in slide-in-from-right-8 sm:slide-in-from-right-12 duration-1000">
                <div className="relative max-w-[85%] sm:max-w-none">
                  <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-ink-900 text-paper-50 px-6 sm:px-12 py-4 sm:py-7 rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-sm text-base sm:text-2xl font-black tracking-tight shadow-2xl">
                    "I bought groceries for $75 today"
                  </div>
                </div>
              </div>

              {/* AI Response Bubble */}
              <div className="flex justify-start animate-in slide-in-from-left-8 sm:slide-in-from-left-12 duration-1000 delay-500">
                <div className="w-full max-w-md sm:max-w-xl bg-paper-100/50 dark:bg-white/[0.03] border border-paper-200/50 dark:border-white/10 p-5 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] rounded-tl-sm shadow-2xl relative overflow-hidden group/card">
                  <div className="flex flex-col xs:flex-row items-start gap-5 sm:gap-8">
                    <IconBox
                      icon={Sparkles}
                      variant="glass"
                      color="primary"
                      size="lg"
                      className="sm:scale-125 shrink-0 shadow-lg shadow-primary-500/10"
                    />
                    <div className="space-y-5 sm:space-y-8 flex-1 w-full">
                      <div>
                        <div className="text-overline text-primary-500 font-black tracking-widest uppercase mb-2 sm:mb-3">Entity Extraction</div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-2xl sm:text-4xl">🍔</span>
                          <span className="text-h5 sm:text-h3 font-black text-ink-900 dark:text-paper-50 tracking-tighter leading-none">Food & Dining</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-8">
                        <div className="bg-paper-50/80 dark:bg-white/[0.02] p-4 sm:p-6 rounded-2xl border border-paper-100 dark:border-white/5 shadow-sm">
                          <div className="text-overline text-ink-300 dark:text-paper-800 font-black tracking-widest uppercase mb-1 sm:mb-2">Amount</div>
                          <div className="text-lg sm:text-2xl font-black text-ink-900 dark:text-paper-50 tracking-tight">$75.00</div>
                        </div>
                        <div className="bg-paper-50/80 dark:bg-white/[0.02] p-4 sm:p-6 rounded-2xl border border-paper-100 dark:border-white/5 shadow-sm">
                          <div className="text-overline text-ink-300 dark:text-paper-800 font-black tracking-widest uppercase mb-1 sm:mb-2">Status</div>
                          <div className="flex items-center gap-2 text-success-600 dark:text-success-400">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            <span className="text-lg sm:text-2xl font-black italic tracking-tight">Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtle decorative mesh background */}
                  <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-primary-500/[0.05] rounded-full blur-[60px] sm:blur-[100px] -z-10 group-hover/card:bg-primary-500/[0.08] transition-all duration-1000"></div>
                </div>
              </div>
            </div>

            {/* Terminal Footer */}
            <div className="bg-paper-100/50 dark:bg-white/[0.02] px-6 sm:px-10 py-4 sm:py-5 border-t border-paper-200/50 dark:border-white/5">
              <div className="flex items-center justify-between text-[8px] sm:text-overline text-ink-300 dark:text-paper-800 font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase">
                <div className="flex gap-4 sm:gap-10">
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