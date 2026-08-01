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
import Badge from '../UI/base/Badge';
import IconBox from '../UI/base/IconBox';
import Button from '../UI/base/Button';
import ConfirmDialog from '../UI/base/ConfirmDialog';

export default function SalaryResult({ isOpen, planData, formData, aiAdvice, onSave, onRecalculate, onClose }) {
  const { advice, loading, error, generate } = useAIAdvice();
  const [currentAdvice, setCurrentAdvice] = useState(aiAdvice || '');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleAttemptClose = () => {
    if (loading) return; // Prevent closing entirely while AI is working
    if (aiAdvice) {
      onClose(); // Already saved, ok to close immediately
    } else {
      setShowConfirmClose(true); // Unsaved newly generated plan, prompt confirmation
    }
  };

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
      onClose={handleAttemptClose}
      title="Strategic Intelligence"
      size="xl"
      fullMobile
      preventClose={loading}
      footer={
        <div className="flex items-center gap-2 w-full print:hidden">
          <Button variant="ghost" color="ink" size="sm" icon={RefreshCw} onClick={onRecalculate} disabled={loading}>
            Update
          </Button>
          <Button variant="ghost" color="ink" size="sm" icon={Printer} onClick={() => window.print()} disabled={loading}>
            Print
          </Button>
          <div className="flex-1" />
          <Button color="primary" size="sm" icon={Save} onClick={() => onSave(planData, formData, currentAdvice)} disabled={loading || !!aiAdvice}>
            Confirm Report
          </Button>
        </div>
      }
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 5mm 4mm 5mm;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
            background-color: white !important;
            color: #111827 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #salary-dashboard-print, #salary-dashboard-print * {
            visibility: visible !important;
          }
          
          /* Override all parent overlay and card container structures to be plain static block flows */
          body > div,
          div[class*="fixed"],
          div[class*="backdrop-blur"],
          div[class*="bg-surface-card"] {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            animation: none !important;
          }

          /* Strip all layout, height, transform, filter, and animation constraints from ALL ancestors */
          * {
            overflow: visible !important;
            max-height: none !important;
            max-width: none !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
            animation: none !important;
            transition: none !important;
          }
          
          /* Print container setup: Absolute placement on top of document */
          #salary-dashboard-print {
            visibility: visible !important;
            position: absolute !important;
            z-index: 999999 !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; padding: 0 !important; margin: 0 !important;
            background-color: white !important; zoom: 1.38;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Force Tablet Responsive Grid and Column Layouts in Print */
          #salary-dashboard-print .grid {
            display: grid !important;
          }
          /* Executive Strip: Force exactly 2 Columns (2x2 grid) */
          #salary-dashboard-print .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          /* Main Layout: Force exactly 1 Column (vertical stack of Main Content & Audit Panel) */
          #salary-dashboard-print .grid-cols-1.lg\\:grid-cols-12 {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
          #salary-dashboard-print .lg\\:col-span-8,
          #salary-dashboard-print .lg\\:col-span-4 {
            grid-column: span 1 / span 1 !important;
          }
          /* Allocation Matrix: Force exactly 3 Columns */
          #salary-dashboard-print .grid-cols-1.sm\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          /* Capital Objective: Force exactly 2 Columns */
          #salary-dashboard-print .grid-cols-1.md\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          /* Optimize Card Backgrounds and Borders for Clean Paper Print */
          #salary-dashboard-print .bg-surface-card,
          #salary-dashboard-print .dark\\:bg-surface-card-dark,
          #salary-dashboard-print .bg-paper-100\\/30,
          #salary-dashboard-print .dark\\:bg-white\\/\\[0\\.02\\] {
            background-color: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 24px !important;
            box-shadow: none !important;
          }

          /* Ensure Bold Text Stays Crisp and Dark */
          #salary-dashboard-print .text-ink-900,
          #salary-dashboard-print .dark\\:text-paper-50 {
            color: #111827 !important;
          }
          #salary-dashboard-print .text-ink-400,
          #salary-dashboard-print .dark\\:text-paper-700 {
            color: #4b5563 !important;
          }

          /* Solid Hex Fill Overrides for Progress Bars and indicators */
          #salary-dashboard-print .bg-paper-100,
          #salary-dashboard-print .dark\\:bg-white\\/5 {
            background-color: #f3f4f6 !important;
          }
          #salary-dashboard-print .bg-primary-500,
          #salary-dashboard-print .bg-primary-500\\/80 {
            background-color: #0d9488 !important;
          }
          #salary-dashboard-print .bg-warning-500,
          #salary-dashboard-print .bg-warning-500\\/80 {
            background-color: #d97706 !important;
          }
          #salary-dashboard-print .bg-error-500,
          #salary-dashboard-print .bg-error-500\\/80 {
            background-color: #dc2626 !important;
          }
          #salary-dashboard-print .bg-info-500,
          #salary-dashboard-print .bg-info-500\\/80 {
            background-color: #2563eb !important;
          }
          #salary-dashboard-print .bg-success-500\\/60 {
            background-color: #16a34a !important;
          }
          #salary-dashboard-print .bg-info-500\\/60 {
            background-color: #2563eb !important;
          }

          /* Text Highlights Colors */
          #salary-dashboard-print .text-primary-600,
          #salary-dashboard-print .dark\\:text-primary-400 {
            color: #0d9488 !important;
          }
          #salary-dashboard-print .text-info-600,
          #salary-dashboard-print .dark\\:text-info-400 {
            color: #2563eb !important;
          }
          #salary-dashboard-print .text-error-600,
          #salary-dashboard-print .dark\\:text-error-400 {
            color: #dc2626 !important;
          }

          /* Audit Dot indicators */
          #salary-dashboard-print .bg-success-500 {
            background-color: #16a34a !important;
          }
          #salary-dashboard-print .bg-primary-500 {
            background-color: #0d9488 !important;
          }

          /* Luxurious Spacing for Bold Portrait Presentation */
          #salary-dashboard-print.space-y-5 > * + * {
            margin-top: 1.25rem !important;
          }
          #salary-dashboard-print .lg\\:col-span-8.space-y-5 > * + * {
            margin-top: 1.25rem !important;
          }
          #salary-dashboard-print .gap-5 {
            gap: 1.5rem !important;
          }
          #salary-dashboard-print .gap-6 {
            gap: 1.5rem !important;
          }
          #salary-dashboard-print .gap-3 {
            gap: 1rem !important;
          }
          #salary-dashboard-print .p-5 {
            padding: 1.6rem !important;
          }
          #salary-dashboard-print .p-4 {
            padding: 1.35rem !important;
          }
          #salary-dashboard-print .mb-6 {
            margin-bottom: 1.25rem !important;
          }

          /* Explicit Typographic Scaling */
          #salary-dashboard-print .text-overline {
            font-size: 13px !important;
            line-height: 1.25rem !important;
            letter-spacing: 0.12em !important;
          }
          #salary-dashboard-print .text-label {
            font-size: 14px !important;
            line-height: 1.25rem !important;
          }
          #salary-dashboard-print .text-body {
            font-size: 17px !important;
            line-height: 1.6rem !important;
          }
          #salary-dashboard-print .text-h2 {
            font-size: 2.3rem !important;
            line-height: 2.75rem !important;
          }
          #salary-dashboard-print .text-h3 {
            font-size: 1.95rem !important;
            line-height: 2.35rem !important;
          }
          #salary-dashboard-print .text-h5 {
            font-size: 1.45rem !important;
            line-height: 1.85rem !important;
          }
          .print-hide { display: none !important; }
        }
      ` }} />      <div id="salary-dashboard-print" className="space-y-5">
        {/* --- EXECUTIVE STRIP --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GlassCard padding="p-4" className="group relative flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-overline text-stone-400">Health Index</span>
              <div className={`w-2 h-2 rounded-full ${status.color === 'teal' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status.color === 'blue' ? 'bg-cyan-500' : 'bg-amber-500'}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-h2 text-stone-200">{healthScore}</span>
              <span className="text-overline text-stone-400">/ 100</span>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-[0.03] dark:opacity-[0.07]">
              <Activity size={48} />
            </div>
          </GlassCard>

          <GlassCard padding="p-4" className="group relative flex flex-col justify-between overflow-hidden">
            <span className="text-overline text-stone-400 mb-2">Net Surplus</span>
            <div className={`text-h3 ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
              {isDeficit ? '-' : '+'}{c(Math.abs(net))}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="w-2.5 h-2.5 text-warning-500" />
              <span className="text-overline text-stone-400">Daily Limit: {c(dailyLimit)}</span>
            </div>
          </GlassCard>

          <GlassCard padding="p-4" className="group relative flex flex-col justify-between overflow-hidden">
            <span className="text-overline text-stone-400 mb-2">Liquidity Runway</span>
            <div className="flex items-baseline gap-1">
              <span className="text-h2 text-stone-200">
                {planData.runwayMonths > 500 ? '∞' : planData.runwayMonths.toFixed(1)}
              </span>
              <span className="text-overline text-stone-400">Months</span>
            </div>
            <div className="mt-2 w-full h-1 bg-stone-800/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/60" style={{ width: `${Math.min(planData.efProgress * 100, 100)}%` }} />
            </div>
          </GlassCard>

          <GlassCard padding="p-4" className="group relative flex flex-col justify-between overflow-hidden">
            <span className="text-overline text-stone-400 mb-2">Retention Rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-h2 text-cyan-400">{savingsPctActual}%</span>
            </div>
            <div className="mt-2 w-full h-1 bg-stone-800/50 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/60" style={{ width: `${Math.min(savingsPctActual * 5, 100)}%` }} />
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* --- MAIN INTELLIGENCE --- */}
          <div className="lg:col-span-8 space-y-5">
            {/* ALLOCATION ANALYTICS */}
            <GlassCard padding="p-5" className="relative overflow-hidden">
              <div className="flex items-center gap-2.5 mb-6">
                <IconBox icon={BarChart3} size="xs" color="primary" variant="soft" />
                <h3 className="text-overline text-stone-400 leading-none">Allocation Matrix</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Fixed Ops', val: needsPct, color: needsPct > 50 ? 'error' : 'primary', amount: c(totalNeeds), limit: 'MAX 50%' },
                  { label: 'Lifestyle', val: wantsPctActual, color: wantsPctActual > 30 ? 'warning' : 'info', amount: c(totalWants), limit: 'MAX 30%' },
                  { label: 'Retention', val: savingsPctActual, color: savingsPctActual >= 20 ? 'primary' : 'warning', amount: c(totalSavings), limit: 'MIN 20%' }
                ].map(item => {
                  const colorClass = item.color === 'error' ? 'bg-red-500/80'
                    : item.color === 'warning' ? 'bg-amber-500/80'
                    : item.color === 'info' ? 'bg-cyan-500/80'
                    : 'bg-emerald-500/80';
                  return (
                    <div key={item.label} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-overline text-stone-400">{item.label}</span>
                        <span className="text-h5 text-stone-200 leading-none">{item.val}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-800/50 rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                      </div>
                      <div className="flex justify-between text-overline text-stone-400">
                        <span>{item.amount}</span>
                        <span>{item.limit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* CAPITAL OBJECTIVE */}
            <GlassCard padding="p-5">
              <div className="flex items-center gap-2.5 mb-6">
                <IconBox icon={Target} size="xs" color="primary" variant="soft" />
                <h3 className="text-overline text-stone-400 tracking-widest leading-none">Capital Objective</h3>
              </div>
              {hasGoal ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-overline text-stone-400 mb-1">Goal: {c(planData.goal)}</p>
                      <div className="text-h2 text-stone-200">
                        {c(planData.monthlyForGoal)}<span className="text-overline text-stone-400 ml-1.5">/ Month</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-overline text-stone-400 mb-0.5">Projection</span>
                        <span className="text-label text-emerald-400">{c(planData.projectedAssets)}</span>
                      </div>
                      <div className="flex flex-col border-l border-stone-800 pl-6">
                        <span className="text-overline text-stone-400 mb-0.5">Timeline</span>
                        <span className="text-label text-stone-200">{planData.goalMonths} Months</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-3xl border ${planData.canAffordGoal ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${planData.canAffordGoal ? 'text-emerald-500' : 'text-red-500'}`} />
                      <span className={`text-overline tracking-widest ${planData.canAffordGoal ? 'text-emerald-500' : 'text-red-500'}`}>
                        {planData.canAffordGoal ? 'Execution Verified' : 'Strategy Deficit'}
                      </span>
                    </div>
                    <p className="text-label text-stone-400 leading-relaxed opacity-70">
                      {planData.canAffordGoal
                        ? "Protocol validated. Plan ensures target realization within designated timeline."
                        : "Gap detected. Adjust timeline or increase retention to bridge shortfall."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center opacity-40">
                  <p className="text-overline text-stone-400 tracking-[0.4em]">No objectives defined.</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* --- AUDIT PANEL --- */}
          <div className="lg:col-span-4">
            <GlassCard padding="p-5" className="h-full flex flex-col">
              <div className="flex items-center gap-2.5 mb-6">
                <IconBox icon={Command} size="xs" color="primary" variant="soft" />
                <h3 className="text-overline text-stone-400 tracking-widest leading-none">System Audit</h3>
              </div>
              <div className="space-y-2 flex-1">
                {planData.flags && planData.flags.length > 0 ? (
                  planData.flags.map((f, i) => (
                    <div key={i} className="flex gap-2.5 p-2.5 rounded-2xl bg-stone-800/30 border border-stone-800 group">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${f.type === 'danger' ? 'bg-red-500' : f.type === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <p className="text-overline text-stone-400 tracking-widest opacity-80 group-hover:opacity-100 transition-opacity leading-tight">
                        {f.msg}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center opacity-30">
                    <p className="text-overline text-stone-400 tracking-[0.5em]">Protocol Nominal</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* --- STRATEGIC ADVISORY --- */}
        <GlassCard padding="p-5" className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-overline text-emerald-400">Strategic Advisory</span>
          </div>
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
              <p className="text-overline text-emerald-500/40 animate-pulse">Neural Synthesis Active...</p>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-body text-stone-300 opacity-80 whitespace-pre-line italic">
                {currentAdvice || "Neural synthesis offline."}
              </p>
            </div>
          )}
          <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-emerald-500 opacity-5 pointer-events-none" />
        </GlassCard>

        <div className="pt-4 text-center opacity-30">
          <p className="text-overline text-stone-500 tracking-[0.6em]">Intel Ledger · Version 2.0</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={onClose}
        title="Unsaved Changes"
        message="Are you sure you want to close? Your new strategic plan has not been saved yet."
        confirmText="Close Without Saving"
        cancelText="Keep Plan Open"
        type="warning"
      />
    </Modal>
  );
}
