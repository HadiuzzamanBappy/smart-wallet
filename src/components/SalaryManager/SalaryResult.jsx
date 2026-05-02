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
      ` }} />

      <div id="salary-dashboard-print" className="space-y-4">
        {/* --- EXECUTIVE METRICS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlassCard padding="p-4" className="flex flex-col items-center text-center">
            <GlassBadge label={status.label} variant={status.color} className="mb-2" />
            <div className="text-3xl font-black text-white tracking-tighter leading-none">
              {healthScore}<span className="text-xs text-gray-600 ml-0.5">/100</span>
            </div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Health Index</p>
          </GlassCard>

          <GlassCard padding="p-4" className="flex flex-col items-center text-center">
            <div className={`text-xl font-black tracking-tight leading-none ${isDeficit ? 'text-red-400' : 'text-teal-400'}`}>
              {isDeficit ? '-' : '+'}{c(Math.abs(net))}
            </div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Monthly Surplus</p>
            <div className="mt-2 px-2 py-0.5 bg-white/5 rounded-full text-[8px] font-mono font-bold text-gray-400">
              Daily: {c(dailyLimit)}
            </div>
          </GlassCard>

          <GlassCard padding="p-4" className="flex flex-col items-center text-center relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-500">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Runway</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight leading-none">
              {planData.runwayMonths > 500 ? '∞' : planData.runwayMonths.toFixed(1)}<span className="text-xs text-gray-600 ml-0.5">MO</span>
            </div>
            <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/50" style={{ width: `${Math.min(planData.efProgress * 100, 100)}%` }} />
            </div>
          </GlassCard>

          <GlassCard padding="p-4" className="flex flex-col items-center text-center">
            <div className="text-2xl font-black text-blue-400 tracking-tight leading-none">{savingsPctActual}%</div>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Savings Rate</p>
            <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500/50" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* --- ALLOCATION MATRIX --- */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard padding="p-4">
              <div className="flex items-center gap-2 mb-4">
                <IconBox icon={Activity} size="xs" color="teal" variant="glass" />
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Allocation Matrix</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Fixed Ops', val: needsPct, color: needsPct > 50 ? 'red' : 'teal', amount: c(totalNeeds), limit: 'MAX 50%' },
                  { label: 'Lifestyle', val: wantsPctActual, color: wantsPctActual > 30 ? 'amber' : 'blue', amount: c(totalWants), limit: 'MAX 30%' },
                  { label: 'Retention', val: savingsPctActual, color: savingsPctActual >= 20 ? 'teal' : 'amber', amount: c(totalSavings), limit: 'MIN 20%' }
                ].map(item => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex justify-between items-end px-0.5">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-lg font-black text-white leading-none">{item.val}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full bg-${item.color}-500/80 transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider">
                      <span className="text-white/60">{item.amount}</span>
                      <span className="text-gray-600">{item.limit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* CAPITAL OBJECTIVE */}
            <GlassCard padding="p-4">
              <div className="flex items-center gap-2 mb-4">
                <IconBox icon={Target} size="xs" color="teal" variant="glass" />
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Capital Objective</h3>
              </div>
              {hasGoal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Target: {c(planData.goal)}</p>
                      <div className="text-3xl font-black text-white tracking-tighter">
                        {c(planData.monthlyForGoal)}<span className="text-[10px] text-gray-600 ml-1 uppercase tracking-widest">/mo</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-600 uppercase">Projection</span>
                        <span className="text-xs font-black text-teal-400 leading-none">{c(planData.projectedAssets)}</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-600 uppercase">Timeline</span>
                        <span className="text-xs font-black text-white uppercase leading-none">{planData.goalMonths} Mo</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${planData.canAffordGoal ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {planData.canAffordGoal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className={`text-[9px] font-black uppercase tracking-widest ${planData.canAffordGoal ? 'text-emerald-400' : 'text-red-400'}`}>
                        {planData.canAffordGoal ? 'Confirmed' : 'Shortfall'}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-500 leading-tight">
                      {planData.canAffordGoal
                        ? `Strategy verified. Saving ${c(planData.monthlyForGoal)}/mo extra secures target in ${planData.goalMonths} mo.`
                        : `Gap detected: ${c(planData.remainingGoal)}. Adjust timeline or increase retention.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">No objectives defined.</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* --- AUDIT SIDEBAR --- */}
          <div className="lg:col-span-4">
            <GlassCard padding="p-4" className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <IconBox icon={Command} size="xs" color="teal" variant="glass" />
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">System Audit</h3>
              </div>
              <div className="space-y-1.5">
                {planData.flags && planData.flags.length > 0 ? (
                  planData.flags.map((f, i) => (
                    <div key={i} className="flex gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className={`mt-1 w-1 h-1 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : f.type === 'warn' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                      <p className="text-[9px] text-gray-500 font-bold leading-tight uppercase tracking-tight group-hover:text-gray-300 transition-colors">
                        {f.msg}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Protocol nominal.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* --- AI ADVISORY --- */}
        <div className="relative">
          <GlassCard padding="p-5" className="bg-gradient-to-br from-teal-500/5 to-transparent border-teal-500/10 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">Strategic Advisory</h3>
            </div>
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-teal-500 animate-spin" />
                <p className="text-[9px] font-black text-teal-500/50 uppercase tracking-[0.2em] animate-pulse">Neural Synthesis...</p>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium italic opacity-90 whitespace-pre-line">
                  {currentAdvice || "Neural synthesis offline."}
                </p>
              </div>
            )}
            <Globe className="absolute -bottom-6 -right-6 w-32 h-32 text-teal-500 opacity-5 pointer-events-none" />
          </GlassCard>
        </div>

        <div className="pt-4 text-center print-hide opacity-20">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.6em]">Wallet Tracker Intel Protocol · ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>
      </div>
    </Modal>
  );
}
