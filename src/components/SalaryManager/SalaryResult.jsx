import React, { useEffect, useState } from 'react';
import { Sparkles, Printer, Save, RefreshCw, Target, PiggyBank, Home, Heart as WantsIcon, Zap, TrendingUp, AlertTriangle, ShieldCheck, Activity, BarChart3, Globe, Command } from 'lucide-react';
import { useAIAdvice } from '../../hooks/useAIAdvice';
import Modal from '../UI/base/Modal';

export default function SalaryResult({ isOpen, planData, formData, aiAdvice, onSave, onRecalculate, onClose }) {
  const { advice, loading, error, generate } = useAIAdvice();
  const [currentAdvice, setCurrentAdvice] = useState(aiAdvice || '');

  useEffect(() => {
    if (isOpen && !aiAdvice && !advice && !loading && !error) {
      generate(planData, formData).then(res => {
        if (res) setCurrentAdvice(res);
      });
    } else if (advice) {
      setCurrentAdvice(advice);
    }
  }, [isOpen, aiAdvice, advice, loading, error, generate, planData, formData]);

  const sym = planData.currencySymbol || '৳';
  const c = (val) => `${sym}${Math.round(val || 0).toLocaleString()}`;
  const net = planData.netBalance ?? 0;
  const isDeficit = net < 0;
  const hasGoal = planData.goal > 0;
  const monthlyAllowance = Math.max(0, net);
  const dailyLimit = monthlyAllowance / 30;

  const totalNeeds = planData.totalFixed || 0;
  const needsPct = Math.round((totalNeeds / planData.totalIncome) * 100) || 0;
  const totalSavings = planData.actualSavings || 0;
  const savingsPctActual = Math.round((totalSavings / planData.totalIncome) * 100) || 0;
  const totalWants = Math.max(0, planData.totalIncome - totalNeeds - totalSavings);
  const wantsPctActual = Math.max(0, 100 - needsPct - savingsPctActual);

  let score = 100;
  if (isDeficit) score -= 40;
  if (needsPct > 50) score -= (needsPct - 50);
  if (savingsPctActual < 20) score -= (20 - savingsPctActual) * 2;
  const healthScore = Math.max(0, Math.min(score, 100));

  const getHealthStatus = () => {
    if (isDeficit) return { label: 'At Risk', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (healthScore > 85) return { label: 'Excellent', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' };
    if (healthScore > 65) return { label: 'Healthy', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    return { label: 'Stable', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  };
  const status = getHealthStatus();

  const modalFooter = (
    <div className="flex flex-row items-center gap-2 w-full print:hidden">
      <button onClick={onRecalculate} className="flex-1 py-2.5 px-2 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5" /><span>Update</span>
      </button>
      <button onClick={() => window.print()} className="flex-1 py-2.5 px-2 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
        <Printer className="w-3.5 h-3.5" /><span>Print</span>
      </button>
      <button onClick={() => onSave(planData, formData, currentAdvice)} className="flex-[1.5] py-2.5 px-3 bg-teal-500 hover:bg-teal-400 text-[#050b1a] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2">
        <Save className="w-3.5 h-3.5" /><span>Confirm</span>
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Strategic Intelligence" size="xl" disableScroll={true} footer={modalFooter}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* 0. FORCE STRICTLY ONE PAGE */
          html, body { 
            height: 100vh !important; 
            max-height: 100vh !important; 
            overflow: hidden !important; 
          }
          
          /* 1. Hide everything outside, make target visible */
          body * { visibility: hidden; }
          #salary-dashboard-print, #salary-dashboard-print * { visibility: visible; }
          
          /* 2. Anchor to top-left and scale safely */
          #salary-dashboard-print {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 10mm !important;
            margin: 0 !important;
            background-color: white !important;
            zoom: 0.85;
            filter: grayscale(100%) contrast(1.2);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force ALL nested elements to have white background and black text */
          #salary-dashboard-print div, 
          #salary-dashboard-print span, 
          #salary-dashboard-print p, 
          #salary-dashboard-print h3, 
          #salary-dashboard-print h4 {
            background-color: white !important;
            color: black !important;
            border-color: #ddd !important;
            background-image: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* 2.5 Compress vertical spacing to reclaim room for text */
          #salary-dashboard-print .mb-8 { margin-bottom: 15px !important; }
          #salary-dashboard-print .p-8 { padding: 15px !important; }
          #salary-dashboard-print .p-6 { padding: 12px !important; }
          #salary-dashboard-print .py-6, #salary-dashboard-print .sm\\:py-8 { padding-top: 10px !important; padding-bottom: 10px !important; }
          #salary-dashboard-print .gap-8 { gap: 15px !important; }
          
          /* 3. CRITICAL FIX: Destroy fixed heights & scrollbars to prevent overlap */
          #salary-dashboard-print > div,
          #salary-dashboard-print .h-full,
          #salary-dashboard-print .overflow-y-auto {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: relative !important;
          }

          /* 4. Hide UI Noise */
          .modal-overlay, .modal-header, .modal-footer, button, .print-hide, .absolute.top-0.right-0 { 
            display: none !important; 
          }
          
          /* 5. True Black & White Styling */
          .bg-gradient-to-br, .bg-gradient-to-b, .bg-gradient-to-r, .bg-gradient-to-t, .bg-gradient-to-tr, .bg-gradient-to-tl { 
            background-image: none !important; 
            background-color: transparent !important;
          }
          
          /* CRITICAL: Hide all absolute decorative overlays that cover text in print */
          .absolute.inset-0.pointer-events-none,
          .absolute.inset-0.bg-gradient-to-t,
          .absolute.inset-0.bg-gradient-to-b,
          .absolute.top-0.right-0.opacity-10 {
            display: none !important;
          }
          
          /* Force all card backgrounds to white and borders to visible black/gray */
          [class*="bg-white/"], [class*="bg-gray-"], [class*="bg-teal-"], [class*="bg-red-"], [class*="bg-blue-"], [class*="bg-amber-"] {
            background-color: white !important;
            color: black !important;
            border-color: #000 !important;
          }
          
          /* Specialized high-contrast for indicators */
          .bg-teal-500, .bg-red-500, .bg-blue-500, .bg-amber-500 {
            background-color: #333 !important; /* Dark gray for bars in print */
          }
          
          .h-1, .h-1.5, .h-2 {
            background-color: #eee !important; /* Light gray for bar backgrounds */
            border: 1px solid #ccc !important;
          }
          
          /* Force all text and borders to black */
          #salary-dashboard-print * { 
            color: black !important; 
            border-color: #333 !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          
          /* Hide decorative icons that might look messy in B&W print */
          .Sparkles, .Globe, .Zap { opacity: 0.2 !important; }
          
          /* 6. Force Desktop Grids */
          .grid { display: grid !important; gap: 15px !important; }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
          .lg\\:grid-cols-2, .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
          
          /* 7. Kill Browser Headers/Footers */
          @page { size: A4 portrait; margin: 0; }
        }
      ` }} />

      <div id="salary-dashboard-print" className="h-[calc(100vh-160px)] sm:h-[80vh] text-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 pb-12">

          {/* --- TOP HIGH-DENSITY METRICS --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 py-4">
            {/* Health Score */}
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`mb-1.5 px-2 py-0.5 rounded-md ${status.bg} ${status.color} text-[8px] font-black uppercase tracking-widest`}>
                {status.label}
              </div>
              <div className="text-3xl font-black text-white tracking-tighter">
                {healthScore}<span className="text-xs text-gray-600 ml-0.5">/100</span>
              </div>
              <div className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">Health Index</div>
            </div>

            {/* Monthly Surplus */}
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className={`text-xl font-black ${isDeficit ? 'text-red-400' : 'text-teal-400'} tracking-tight`}>
                {isDeficit ? '-' : '+'}{c(Math.abs(net))}
              </div>
              <div className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Monthly Surplus</div>
              <div className="mt-1.5 text-[9px] font-bold text-gray-600 font-mono opacity-80">Daily: {c(dailyLimit)}</div>
            </div>

            {/* Safety Runway */}
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="flex items-center gap-1 mb-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Runway</span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {planData.runwayMonths > 500 ? '∞' : planData.runwayMonths.toFixed(1)}<span className="text-sm text-gray-600 ml-0.5">mo</span>
              </div>
              <div className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">Financial Survival</div>
              {planData.efProgress < 1 && (
                <div className="mt-2 w-full px-4">
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/50" style={{ width: `${planData.efProgress * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Savings Rate */}
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="text-2xl font-black text-blue-400 tracking-tight">{savingsPctActual}%</div>
              <div className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Savings Rate</div>
              <div className="mt-2.5 w-full px-4">
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/50" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* --- LEFT: ALLOCATION MATRIX --- */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white/[0.015] border border-white/10 rounded-[1.5rem] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-3.5 h-3.5 text-teal-500/70" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Allocation Matrix</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Needs */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fixed Ops</div>
                      <div className="text-xl font-black text-white">{needsPct}%</div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${needsPct > 50 ? 'bg-red-500/80' : 'bg-teal-500/80'}`} style={{ width: `${Math.min(needsPct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalNeeds)}</span>
                      <span>MAX 50%</span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Lifestyle</div>
                      <div className="text-xl font-black text-white">{wantsPctActual}%</div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${wantsPctActual > 30 ? 'bg-yellow-500/80' : 'bg-blue-500/80'}`} style={{ width: `${Math.min(wantsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalWants)}</span>
                      <span>MAX 30%</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Retention</div>
                      <div className="text-xl font-black text-teal-400">{savingsPctActual}%</div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${savingsPctActual >= 20 ? 'bg-teal-500/80' : 'bg-amber-500/80'}`} style={{ width: `${Math.min(savingsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalSavings)}</span>
                      <span>MIN 20%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PURCHASE OBJECTIVE */}
              <div className="bg-white/[0.015] border border-white/10 rounded-[1.5rem] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-3.5 h-3.5 text-teal-500/70" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Capital Objective</h3>
                </div>
                {hasGoal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Target Price: {c(planData.goal)}</div>
                      <div className="text-3xl font-black text-white tracking-tighter">{c(planData.monthlyForGoal)}<span className="text-xs text-gray-600 ml-1">/mo extra</span></div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-600 uppercase">Projection</span>
                          <span className="text-xs font-bold text-teal-400">{c(planData.projectedAssets)} Total</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-600 uppercase">Timeline</span>
                          <span className="text-xs font-bold text-white uppercase tracking-tighter">{planData.goalMonths} Months</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${planData.canAffordGoal ? 'bg-teal-500/5 border-teal-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {planData.canAffordGoal ? <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${planData.canAffordGoal ? 'text-teal-400' : 'text-red-400'}`}>
                          {planData.canAffordGoal ? 'Goal Viable' : 'Strategic Deficit'}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                        {planData.canAffordGoal
                          ? `Allocation protocols confirmed. You'll reach ${c(planData.goal)} by saving an additional ${c(planData.monthlyForGoal)}/mo.`
                          : `Funding shortfall: You need ${c(planData.remainingGoal)} more. Increase savings or extend timeline.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-gray-700 font-black uppercase tracking-widest text-[8px]">No strategic objective defined.</div>
                )}
              </div>

              {/* DEBT RADAR */}
              {planData.totalEMI > 0 && (
                <div className="bg-white/[0.015] border border-white/10 rounded-[1.5rem] p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500/70" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Debt Freedom Radar</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {planData.loanDetails && planData.loanDetails.map((loan, idx) => (
                      <div key={idx} className="bg-white/[0.02] border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] font-bold text-white mb-0.5 truncate">{loan.bank}</div>
                          <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-2.5">EMI: {c(loan.emi)}</div>
                        </div>
                        <div className="pt-2.5 border-t border-white/5 flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-gray-600 font-black uppercase">Free In</span>
                            <span className="text-xs font-black text-amber-400">{loan.monthsLeft} Mo</span>
                          </div>
                          <div className="text-[7px] font-mono text-gray-500">{loan.payoffDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* --- RIGHT: AUDIT --- */}
            <div className="lg:col-span-4">
              <div className="bg-white/[0.015] border border-white/10 rounded-[1.5rem] p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Command className="w-3.5 h-3.5 text-teal-500/70" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">System Audit</h3>
                </div>
                <div className="space-y-1.5">
                  {planData.flags && planData.flags.length > 0 ? (
                    planData.flags.map((f, i) => (
                      <div key={i} className="flex gap-2.5 items-start group p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                        <div className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : f.type === 'warn' ? 'bg-yellow-500/80' : 'bg-teal-500/80'}`} />
                        <p className="text-[8px] text-gray-500 font-bold leading-snug uppercase tracking-tight group-hover:text-gray-300 transition-colors">
                          {f.msg}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[8px] text-gray-700 font-black uppercase tracking-widest text-center py-6">All systems nominal.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- AI INTELLIGENCE --- */}
          <div className="mt-4">
            <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/10 rounded-[1.5rem] p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-teal-400/70" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400/70">Strategic Advisory</h3>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-teal-500/50 space-y-3">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">Analyzing Data Streams...</span>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 leading-relaxed font-medium italic opacity-90 max-w-4xl whitespace-pre-line">
                  {currentAdvice || "Neural analysis not available."}
                </div>
              )}
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Globe className="w-16 h-16 text-teal-500" />
              </div>
            </div>
          </div>

          <div className="mt-12 text-center print-hide pb-8">
            <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">Smart Wallet v3.0 · Strategic Planning Report</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
