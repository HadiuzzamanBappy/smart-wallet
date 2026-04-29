import React, { useEffect, useState } from 'react';
import { useAIAdvice } from '../../hooks/useAIAdvice';
import { AlertCircle, CheckCircle, Info, Sparkles, Printer, Save, RefreshCw, X } from 'lucide-react';

const AlertBadge = ({ type, message, rule }) => {
  const colors = {
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    warn: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    ok: "bg-teal-500/10 text-teal-500 border-teal-500/20"
  };
  const icons = {
    danger: <AlertCircle className="w-5 h-5 shrink-0" />,
    warn: <Info className="w-5 h-5 shrink-0" />,
    ok: <CheckCircle className="w-5 h-5 shrink-0" />
  };

  return (
    <div className={`p-4 rounded-xl border flex gap-3 ${colors[type]}`}>
      {icons[type]}
      <div>
        <div className="font-semibold text-sm uppercase tracking-wider opacity-80 mb-1">{rule} Rule</div>
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
};

export default function SalaryResult({ planData, formData, aiAdvice, onSave, onRecalculate, onClose }) {
  const { advice, loading, error, generate } = useAIAdvice();
  const [currentAdvice, setCurrentAdvice] = useState(aiAdvice || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!aiAdvice && !advice && !loading && !error) {
      generate(planData, formData).then(res => {
        if (res) setCurrentAdvice(res);
      });
    } else if (advice) {
      setCurrentAdvice(advice);
    }
  }, [aiAdvice, advice, loading, error, generate, planData, formData]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(planData, formData, currentAdvice);
    setIsSaving(false);
  };

  const c = (val) => `${planData.currency.split(' ')[0]}${Math.round(val || 0).toLocaleString()}`;
  
  // Format dates
  const savedDate = planData.savedAt ? 
    new Date(planData.savedAt?.seconds ? planData.savedAt.seconds * 1000 : planData.savedAt).toLocaleDateString() : 
    new Date().toLocaleDateString();

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen w-full relative pb-20 print:bg-white print:text-black">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center print:hidden">
        <h1 className="text-lg font-bold text-white">Salary Manager</h1>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" title="Print PDF">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* HERO */}
        <div className="text-center space-y-2 py-8">
          <h2 className="text-gray-400 uppercase tracking-widest text-sm font-semibold">Monthly Income</h2>
          <div className="text-5xl font-mono font-bold text-teal-400 print:text-black">{c(planData.totalIncome)}</div>
          <div className="text-sm text-gray-500">Plan generated on {savedDate}</div>
        </div>

        {/* ALERTS */}
        {planData.flags && planData.flags.length > 0 && (
          <div className="space-y-3">
            {planData.flags.map((f, i) => (
              <AlertBadge key={i} type={f.type} message={f.msg} rule={f.rule} />
            ))}
          </div>
        )}

        {/* BUDGET SPLIT CARD */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 print:border-gray-300 print:bg-white">
          <h3 className="text-xl font-bold text-white mb-6 print:text-black">50/30/20 Budget Breakdown</h3>
          
          <div className="h-4 rounded-full flex overflow-hidden mb-8">
            <div style={{ width: '50%' }} className="bg-blue-500" title="Needs"></div>
            <div style={{ width: '30%' }} className="bg-orange-500" title="Wants"></div>
            <div style={{ width: '20%' }} className="bg-teal-500" title="Savings"></div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between pb-3 border-b border-gray-700 print:border-gray-200">
              <span className="text-gray-400">Fixed Costs (Rent, EMI, etc)</span>
              <span className="font-mono">{c(planData.totalFixed)}</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-700 print:border-gray-200">
              <span className="text-gray-400">Disposable Income</span>
              <span className="font-mono">{c(planData.disposable)}</span>
            </div>
            
            <div className="pt-2 grid gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-white print:text-black">Needs (50%)</span>
                </div>
                <span className="font-mono text-white print:text-black">{c(planData.needsBudget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-white print:text-black">Wants (30%)</span>
                </div>
                <span className="font-mono text-white print:text-black">{c(planData.wantsBudget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <span className="text-white print:text-black">Savings Target (20%)</span>
                </div>
                <span className="font-mono text-white print:text-black">{c(planData.savingsTarget)}</span>
              </div>
            </div>

            {planData.untrackedMoney > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-orange-400">
                <span>Unassigned / Leaking Money</span>
                <span className="font-mono font-bold">{c(planData.untrackedMoney)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2-COL GRID */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* DAILY LIMITS */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 print:border-gray-300 print:bg-white">
            <h3 className="text-lg font-bold text-white mb-4 print:text-black">Daily & Category Limits</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Max Daily Food</div>
                <div className="text-2xl font-mono text-white print:text-black">{c(planData.dailyFoodMax)} <span className="text-sm text-gray-500">/ day</span></div>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700 print:border-gray-200">
                <span className="text-gray-400">Personal / Misc</span>
                <span className="font-mono text-white print:text-black">{c(planData.personalMax)} / mo</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Entertainment</span>
                <span className="font-mono text-white print:text-black">{c(planData.entertainmentMax)} / mo</span>
              </div>
            </div>
          </div>

          {/* EMERGENCY FUND */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 print:border-gray-300 print:bg-white flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 print:text-black">Emergency Fund</h3>
              <p className="text-sm text-gray-400 mb-4">6 months of expenses target</p>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white print:text-black">{c(planData.currentSavings)}</span>
                <span className="text-gray-500">Target: {c(planData.efTarget)}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden print:bg-gray-200">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: `${Math.min(planData.efProgress * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-900 rounded-lg border border-gray-700 text-center print:bg-gray-50">
              <span className="text-sm text-gray-400">Time to reach target: </span>
              <span className="font-semibold text-white print:text-black">
                {planData.efMonths > 500 ? '∞' : `${planData.efMonths} months`}
              </span>
            </div>
          </div>
        </div>

        {/* LOANS (if any) */}
        {planData.loanDetails && planData.loanDetails.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 print:border-gray-300 print:bg-white">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black">
              Active Debt 
              <span className={`text-sm px-2 py-1 rounded-full ${planData.dtiRatio > 0.36 ? 'bg-red-500/20 text-red-500' : 'bg-teal-500/20 text-teal-500'}`}>
                DTI: {Math.round(planData.dtiRatio * 100)}%
              </span>
            </h3>
            <div className="space-y-3">
              {planData.loanDetails.map((l, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-900 rounded-xl border border-gray-700 print:bg-gray-50 print:border-gray-200">
                  <div>
                    <div className="font-medium text-white print:text-black">{l.name || `Loan ${i+1}`}</div>
                    <div className="text-xs text-gray-400">Payoff: {l.payoffDate} ({l.monthsLeft}m)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white print:text-black">{c(l.emi)} <span className="text-xs text-gray-500">/mo</span></div>
                    <div className="text-xs text-gray-500">Left: {c(l.totalLeft)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI ADVICE */}
        <div className="bg-gradient-to-br from-[#1C2333] to-[#161B27] rounded-2xl p-6 border border-teal-500/20 print:border-gray-300 print:bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white print:text-black">AI Financial Advisor</h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12 text-teal-400 space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing your financial profile...</span>
            </div>
          ) : error && !currentAdvice ? (
            <div className="text-red-400 p-4 bg-red-400/10 rounded-lg">{error}</div>
          ) : (
            <div className="space-y-4 text-gray-300 whitespace-pre-wrap print:text-black leading-relaxed">
              {currentAdvice}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-600 print:text-gray-400 pb-12">
          50/30/20 (E. Warren 2005) · HUD 30% Rule · Dave Ramsey Zero-based · CFP 6-month EF
        </div>
      </div>

      {/* Action Bar (Hidden when printing) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex justify-center gap-4 z-20 print:hidden">
        <button 
          onClick={onRecalculate}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700 shadow-lg"
        >
          Recalculate
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving || loading}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors shadow-lg flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Save Plan</span>
        </button>
      </div>
    </div>
  );
}
