import React, { useEffect, useState } from 'react';
import { Sparkles, Printer, Save, RefreshCw, Target, PiggyBank, Home, Heart as WantsIcon, Zap, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useAIAdvice } from '../../hooks/useAIAdvice';
import Modal from '../UI/Modal';

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
      <button onClick={onRecalculate} className="flex-1 py-2.5 px-3 bg-gray-800/40 hover:bg-gray-800 text-gray-500 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-gray-700 active:scale-95 flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5" /><span>Edit Plan</span>
      </button>
      <div className="flex gap-2">
        <button onClick={() => window.print()} className="p-2.5 bg-gray-800/40 hover:bg-gray-800 text-gray-500 rounded-xl border border-gray-700 transition-all active:scale-95">
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onSave(planData, formData, currentAdvice)} className="py-2.5 px-6 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center gap-2">
          <Save className="w-3.5 h-3.5" /><span>Save Plan</span>
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Financial Intelligence" size="xl" disableScroll={true} footer={modalFooter}>
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
            zoom: 0.85; /* Increased slightly for better text readability */
            filter: grayscale(100%) contrast(1.2);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
          .bg-gradient-to-br, .bg-gradient-to-b, .bg-gradient-to-r { background-image: none !important; }
          
          /* Force all card backgrounds to white */
          .bg-black\\/40, .bg-gray-900\\/40, .bg-gray-950\\/40, .bg-gray-900\\/20, 
          .bg-teal-500\\/5, .bg-red-500\\/5, .bg-red-500\\/10, .bg-blue-500\\/10, 
          .bg-teal-500\\/10, .bg-amber-500\\/10, .bg-gray-900\\/40 {
            background-color: white !important;
          }
          
          /* Force all text and borders to black */
          #salary-dashboard-print * { 
            color: black !important; 
            border-color: black !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          
          /* Fix Progress Bars for B&W */
          .bg-gray-950, .bg-gray-900 { 
            background-color: white !important; 
            border: 1px solid black !important; 
          }
          .bg-teal-500, .bg-red-500, .bg-blue-500, .bg-amber-500, .bg-gray-800 { 
            background-color: black !important; 
          }
          
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

          {/* --- TOP HIGH-DENSITY STATS GRID --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 py-6">
            {/* Score Card */}
            <div className="bg-gray-900/40 border border-gray-800/40 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className={`mb-2 px-3 py-0.5 rounded-full border ${status.bg} ${status.border} ${status.color} text-[10px] font-black uppercase tracking-widest`}>
                {status.label}
              </div>
              <div className="text-5xl font-mono font-black text-white">
                {healthScore}<span className="text-base text-gray-700">/100</span>
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Health Score</div>
            </div>

            {/* Income & Surplus Card */}
            <div className="bg-gray-900/40 border border-gray-800/40 p-5 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="text-3xl font-mono font-black text-sky-400">
                {isDeficit ? '-' : '+'}{c(Math.abs(net))}
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Monthly Surplus</div>
              <div className="mt-2 text-[11px] font-mono text-gray-400">Income: {c(planData.totalIncome)}</div>
            </div>

            {/* Daily Limit Card */}
            <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Tactical Limit</span>
              </div>
              <div className="text-4xl font-mono font-black text-white">{c(dailyLimit)}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Per Day Allowance</div>
            </div>

            {/* Savings Rate Card */}
            <div className="bg-gray-900/40 border border-gray-800/40 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-mono font-black text-emerald-400">{savingsPctActual}%</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Actual Savings Rate</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
                </div>
                <span className="text-[10px] text-gray-600 font-bold">VS 20%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* --- LEFT COLUMN: BENCHMARKS & GOALS (8 cols) --- */}
            <div className="lg:col-span-8 space-y-6">

              {/* 50/30/20 BENCHMARKS COMPACT CARD */}
              <div className="bg-gray-950/40 border border-gray-800/60 rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Allocation Benchmarks</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Needs */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Needs</div>
                      <div className="text-2xl font-mono font-bold text-white">{needsPct}%</div>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className={`h-full ${needsPct > 50 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gray-700'}`} style={{ width: `${Math.min(needsPct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-gray-600 font-mono">
                      <span>{c(totalNeeds)}</span>
                      <span>Target: 50%</span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Wants</div>
                      <div className="text-2xl font-mono font-bold text-white">{wantsPctActual}%</div>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className={`h-full ${wantsPctActual > 30 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-gray-700'}`} style={{ width: `${Math.min(wantsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-gray-600 font-mono">
                      <span>{c(totalWants)}</span>
                      <span>Target: 30%</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Savings</div>
                      <div className="text-2xl font-mono font-bold text-teal-400">{savingsPctActual}%</div>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className={`h-full ${savingsPctActual >= 20 ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : 'bg-amber-500'}`} style={{ width: `${Math.min(savingsPctActual, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-gray-600 font-mono">
                      <span>{c(totalSavings)}</span>
                      <span>Target: 20%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TARGET BREAKDOWN (Compact Version) */}
              <div className="bg-gray-950/40 border border-gray-800/60 rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-4 h-4 text-gray-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Purchase Strategy</h3>
                </div>
                {hasGoal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Goal: {c(planData.goal)}</div>
                          <div className="text-3xl font-mono font-black text-white">{c(planData.monthlyForGoal)}<span className="text-xs text-gray-500 ml-1">/mo</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Timeline</div>
                          <div className="text-base font-bold text-white">{planData.goalMonths} Months</div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden p-0.5">
                        <div className="h-full bg-teal-500 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.3)]" style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${planData.canAffordGoal ? 'bg-teal-500/5 border-teal-500/10 text-teal-400' : 'bg-red-500/5 border-red-500/10 text-red-400'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {planData.canAffordGoal ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{planData.canAffordGoal ? 'Goal is Viable' : 'Funding Deficit'}</span>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed opacity-80">
                        {planData.canAffordGoal
                          ? `Allocation confirmed. You have ${c(planData.actualSavings - planData.monthlyForGoal)}/mo surplus above this target.`
                          : `You are short by ${c(planData.monthlyForGoal - planData.actualSavings)}/mo. Reallocate from your Tactical Allowance.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-700 font-bold uppercase tracking-widest text-[9px]">No specific purchase target defined.</div>
                )}
              </div>
            </div>

            {/* --- RIGHT COLUMN: AUDIT (4 cols) --- */}
            <div className="lg:col-span-4 space-y-6">
              {/* SYSTEM SUGGESTIONS (Compact) */}
              <div className="bg-gray-900/20 border border-gray-800/40 rounded-[2rem] p-6 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">System Audit</h3>
                </div>
                <div className="space-y-3.5">
                  {planData.flags && planData.flags.length > 0 ? (
                    planData.flags.map((f, i) => (
                      <div key={i} className="flex gap-3 items-start group">
                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : f.type === 'warn' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                        <p className="text-[10px] text-gray-500 font-bold leading-tight group-hover:text-gray-400 transition-colors">
                          {f.msg}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">No issues detected.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- BOTTOM ROW: AI INTELLIGENCE (FULL WIDTH) --- */}
          <div className="mt-6">
            <div className="bg-gradient-to-r from-gray-900/40 to-transparent border border-gray-800/40 rounded-[2rem] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">Nexus AI Intelligence</h3>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-teal-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin opacity-50" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] animate-pulse">Processing...</span>
                </div>
              ) : (
                <div className="text-[11px] sm:text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-medium italic opacity-80">
                  {currentAdvice || "No analysis available."}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center print-hide pb-8">
            <p className="text-[8px] text-gray-800 font-black uppercase tracking-[0.6em]">Nexus Dashboard v3.0 · High Fidelity Reporting</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
