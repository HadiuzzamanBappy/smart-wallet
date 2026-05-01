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
    <div className="flex flex-row justify-between items-center gap-3 w-full print:hidden">
      <button onClick={onRecalculate} className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5" /><span>Modify Parameters</span>
      </button>
      <div className="flex gap-2">
        <button onClick={() => window.print()} className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-500 rounded-xl border border-white/10 transition-all active:scale-95">
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onSave(planData, formData, currentAdvice)} className="py-2.5 px-6 bg-teal-500 hover:bg-teal-400 text-[#050b1a] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-2">
          <Save className="w-3.5 h-3.5" /><span>Commit Plan</span>
        </button>
      </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-6">
            {/* Health Score */}
            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className={`mb-2 px-3 py-0.5 rounded-full ${status.bg} ${status.color} text-[9px] font-black uppercase tracking-widest`}>
                {status.label}
              </div>
              <div className="text-4xl font-black text-white tracking-tighter">
                {healthScore}<span className="text-sm text-gray-600 ml-1">/100</span>
              </div>
              <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Health Index</div>
              <div className="absolute inset-0 bg-gradient-to-t from-teal-500/5 to-transparent pointer-events-none" />
            </div>

            {/* Monthly Surplus */}
            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className={`text-2xl font-black ${isDeficit ? 'text-red-400' : 'text-teal-400'} tracking-tight`}>
                {isDeficit ? '-' : '+'}{c(Math.abs(net))}
              </div>
              <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Tactical Surplus</div>
              <div className="mt-2 text-[10px] font-bold text-gray-600 font-mono">NET: {c(planData.totalIncome)}</div>
            </div>

            {/* Daily Ceiling */}
            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Daily Ops</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{c(dailyLimit)}</div>
              <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Operational Ceiling</div>
            </div>

            {/* Savings Rate */}
            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-black text-blue-400 tracking-tight">{savingsPctActual}%</div>
              <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Capital Retention</div>
              <div className="mt-3 w-full px-4">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* --- LEFT: ALLOCATION MATRIX --- */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <Activity className="w-4 h-4 text-teal-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Allocation Matrix</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Needs */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fixed Ops</div>
                      <div className="text-2xl font-black text-white">{needsPct}%</div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${needsPct > 50 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]'}`} style={{ width: `${Math.min(needsPct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalNeeds)}</span>
                      <span>MAX 50%</span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lifestyle</div>
                      <div className="text-2xl font-black text-white">{wantsPctActual}%</div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${wantsPctActual > 30 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`} style={{ width: `${Math.min(wantsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalWants)}</span>
                      <span>MAX 30%</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Retention</div>
                      <div className="text-2xl font-black text-teal-400">{savingsPctActual}%</div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${savingsPctActual >= 20 ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`} style={{ width: `${Math.min(savingsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      <span>{c(totalSavings)}</span>
                      <span>MIN 20%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PURCHASE OBJECTIVE */}
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <Target className="w-4 h-4 text-teal-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Capital Objective</h3>
                </div>
                {hasGoal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Target Asset: {c(planData.goal)}</div>
                      <div className="text-4xl font-black text-white tracking-tighter">{c(planData.monthlyForGoal)}<span className="text-xs text-gray-600 ml-1">/mo</span></div>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-600 uppercase">Timeline</span>
                          <span className="text-sm font-bold text-teal-400">{planData.goalMonths} Mo</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-600 uppercase">Priority</span>
                          <span className="text-sm font-bold text-white uppercase tracking-tighter">Strategic</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-6 rounded-2xl border ${planData.canAffordGoal ? 'bg-teal-500/5 border-teal-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {planData.canAffordGoal ? <ShieldCheck className="w-4 h-4 text-teal-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${planData.canAffordGoal ? 'text-teal-400' : 'text-red-400'}`}>
                          {planData.canAffordGoal ? 'Objective Viable' : 'Strategic Deficit'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                        {planData.canAffordGoal
                          ? `Allocation protocols confirmed. You have ${c(planData.actualSavings - planData.monthlyForGoal)}/mo surplus above this target.`
                          : `Funding shortfall detected: ${c(planData.monthlyForGoal - planData.actualSavings)}/mo required. Adjust tactical allowance.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-700 font-black uppercase tracking-widest text-[9px]">No strategic objective defined.</div>
                )}
              </div>
            </div>

            {/* --- RIGHT: AUDIT --- */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Command className="w-4 h-4 text-teal-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">System Audit</h3>
                </div>
                <div className="space-y-2">
                  {planData.flags && planData.flags.length > 0 ? (
                    planData.flags.map((f, i) => (
                      <div key={i} className="flex gap-3 items-start group p-2 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                        <div className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : f.type === 'warn' ? 'bg-yellow-500' : 'bg-teal-500'}`} />
                        <p className="text-[9px] text-gray-500 font-bold leading-normal uppercase tracking-tight group-hover:text-gray-300 transition-colors">
                          {f.msg}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-gray-700 font-black uppercase tracking-widest text-center py-8">All systems nominal.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- AI INTELLIGENCE --- */}
          <div className="mt-6">
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">Strategic Advisory</h3>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-teal-500 space-y-4">
                  <RefreshCw className="w-6 h-6 animate-spin opacity-40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Data Streams...</span>
                </div>
              ) : (
                <div className="text-xs text-gray-400 leading-[1.8] font-medium italic opacity-90 max-w-4xl">
                  {currentAdvice || "Neural analysis not available."}
                </div>
              )}
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Globe className="w-24 h-24 text-teal-500" />
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
