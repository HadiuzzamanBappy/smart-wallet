import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Printer,
  Save,
  RefreshCw,
  Target,
  PiggyBank,
  Home,
  Heart as WantsIcon,
  Zap,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  BarChart3,
  Globe,
  Command,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAIAdvice } from '../../hooks/useAIAdvice';
import Modal from '../UI/base/Modal';
import GlassCard from '../UI/base/GlassCard';
import GlassBadge from '../UI/base/GlassBadge';
import IconBox from '../UI/base/IconBox';
import Button from '../UI/base/Button';

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
    if (isDeficit) return { label: 'At Risk', color: 'red' };
    if (healthScore > 85) return { label: 'Excellent', color: 'teal' };
    if (healthScore > 65) return { label: 'Healthy', color: 'blue' };
    return { label: 'Stable', color: 'amber' };
  };
  const status = getHealthStatus();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Intelligence"
      size="xl"
      footer={
        <div className="flex items-center gap-2 w-full print:hidden">
          <Button variant="ghost" color="gray" size="sm" icon={RefreshCw} onClick={onRecalculate}>
            Update
          </Button>
          <Button variant="ghost" color="gray" size="sm" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <div className="flex-1" />
          <Button color="teal" size="sm" icon={Save} onClick={() => onSave(planData, formData, currentAdvice)}>
            Confirm Report
          </Button>
        </div>
      }
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          html, body { height: 100vh !important; max-height: 100vh !important; overflow: hidden !important; }
          body * { visibility: hidden; }
          #salary-dashboard-print, #salary-dashboard-print * { visibility: visible; }
          #salary-dashboard-print {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; padding: 10mm !important; margin: 0 !important;
            background-color: white !important; zoom: 0.85;
            filter: grayscale(100%) contrast(1.2);
            -webkit-print-color-adjust: exact !important;
          }
          #salary-dashboard-print div, #salary-dashboard-print span, #salary-dashboard-print p {
            background-color: white !important; color: black !important; border-color: #ddd !important;
          }
          .print-hide { display: none !important; }
        }
      ` }} />      <div id="salary-dashboard-print" className="space-y-5">
        {/* --- EXECUTIVE STRIP --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="group relative p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Health Index</span>
              <div className={`w-2 h-2 rounded-full ${status.color === 'teal' ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : status.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{healthScore}</span>
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-tighter">/ 100</span>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-[0.03] dark:opacity-[0.07]">
              <Activity size={48} />
            </div>
          </div>

          <div className="group relative p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-between overflow-hidden">
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Net Surplus</span>
            <div className={`text-2xl font-black tracking-tighter ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`}>
              {isDeficit ? '-' : '+'}{c(Math.abs(net))}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Daily Limit: {c(dailyLimit)}</span>
            </div>
          </div>

          <div className="group relative p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-between overflow-hidden">
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Liquidity Runway</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {planData.runwayMonths > 500 ? '∞' : planData.runwayMonths.toFixed(1)}
              </span>
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-tighter">Months</span>
            </div>
            <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/60" style={{ width: `${Math.min(planData.efProgress * 100, 100)}%` }} />
            </div>
          </div>

          <div className="group relative p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-between overflow-hidden">
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Retention Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400 tracking-tighter">{savingsPctActual}%</span>
            </div>
            <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500/60" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* --- MAIN INTELLIGENCE --- */}
          <div className="lg:col-span-8 space-y-5">
            {/* ALLOCATION ANALYTICS */}
            <div className="p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/10 relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Allocation Matrix</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Fixed Ops', val: needsPct, color: needsPct > 50 ? 'rose' : 'teal', amount: c(totalNeeds), limit: 'MAX 50%' },
                  { label: 'Lifestyle', val: wantsPctActual, color: wantsPctActual > 30 ? 'amber' : 'sky', amount: c(totalWants), limit: 'MAX 30%' },
                  { label: 'Retention', val: savingsPctActual, color: savingsPctActual >= 20 ? 'teal' : 'amber', amount: c(totalSavings), limit: 'MIN 20%' }
                ].map(item => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">{item.label}</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white leading-none tracking-tighter">{item.val}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full bg-${item.color}-500/80 transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
                      <span>{item.amount}</span>
                      <span>{item.limit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAPITAL OBJECTIVE */}
            <div className="p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                  <Target className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Capital Objective</h3>
              </div>
              {hasGoal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Goal: {c(planData.goal)}</p>
                      <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {c(planData.monthlyForGoal)}<span className="text-[10px] text-gray-400 dark:text-gray-600 ml-1.5 uppercase tracking-widest">/ Month</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-0.5">Projection</span>
                        <span className="text-xs font-black text-teal-600 dark:text-teal-400">{c(planData.projectedAssets)}</span>
                      </div>
                      <div className="flex flex-col border-l border-gray-200 dark:border-white/10 pl-6">
                        <span className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-0.5">Timeline</span>
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase">{planData.goalMonths} Months</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${planData.canAffordGoal ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${planData.canAffordGoal ? 'text-emerald-500' : 'text-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${planData.canAffordGoal ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {planData.canAffordGoal ? 'Execution Verified' : 'Strategy Deficit'}
                      </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 leading-relaxed opacity-70">
                      {planData.canAffordGoal
                        ? "Protocol validated. Plan ensures target realization within designated timeline."
                        : "Gap detected. Adjust timeline or increase retention to bridge shortfall."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center opacity-40">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">No objectives defined.</p>
                </div>
              )}
            </div>
          </div>

          {/* --- AUDIT PANEL --- */}
          <div className="lg:col-span-4">
            <div className="h-full p-5 rounded-2xl bg-white/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/10 flex flex-col">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                  <Command className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">System Audit</h3>
              </div>
              <div className="space-y-2 flex-1">
                {planData.flags && planData.flags.length > 0 ? (
                  planData.flags.map((f, i) => (
                    <div key={i} className="flex gap-2.5 p-2.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 group">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-rose-500' : f.type === 'warn' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 font-black leading-tight uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                        {f.msg}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center opacity-30">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em]">Protocol Nominal</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- STRATEGIC ADVISORY --- */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/[0.03] to-transparent dark:from-teal-500/[0.07] border border-teal-500/10 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.4em]">Strategic Advisory</span>
          </div>
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-teal-500 animate-spin" />
              <p className="text-[9px] font-black text-teal-500/40 uppercase tracking-widest animate-pulse">Neural Synthesis Active...</p>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-black uppercase tracking-[0.05em] opacity-80 whitespace-pre-line italic">
                {currentAdvice || "Neural synthesis offline."}
              </p>
            </div>
          )}
          <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-teal-500 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" />
        </div>

        <div className="pt-4 text-center opacity-30">
          <p className="text-[8px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-[0.6em]">Intel Ledger · Version 2.0</p>
        </div>
      </div>
    </Modal>
  );
}
