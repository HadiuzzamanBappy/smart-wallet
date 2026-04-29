import React, { useEffect, useState } from 'react';
import { useAIAdvice } from '../../hooks/useAIAdvice';
import { AlertCircle, CheckCircle, Info, Sparkles, Printer, Save, RefreshCw, X } from 'lucide-react';
import Modal from '../UI/Modal';

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

export default function SalaryResult({ isOpen, planData, formData, aiAdvice, onSave, onRecalculate, onClose }) {
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
  
  const savedDate = planData.savedAt ? 
    new Date(planData.savedAt?.seconds ? planData.savedAt.seconds * 1000 : planData.savedAt).toLocaleDateString() : 
    new Date().toLocaleDateString();

  const modalFooter = (
    <div className="flex flex-row justify-between items-center gap-3 w-full print:hidden">
      <button 
        onClick={onRecalculate}
        className="flex-1 py-2.5 px-3 bg-gray-800/40 hover:bg-gray-800 text-gray-500 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border border-gray-700 active:scale-95 flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>
      
      <div className="flex gap-2">
        <button 
          onClick={handlePrint} 
          className="p-2.5 bg-gray-800/40 hover:bg-gray-800 text-gray-500 rounded-xl border border-gray-700 transition-all active:scale-95"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        
        <button 
          onClick={handleSave}
          disabled={isSaving || loading}
          className="py-2.5 px-6 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-2"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'Saving' : 'Save'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Salary Analysis & Plan" 
      size="xl" 
      disableScroll={true}
      footer={modalFooter}
    >
      <div className="h-[calc(100vh-160px)] sm:h-[60vh] text-gray-200 print:text-black overflow-hidden">
        {/* Scrollable Results Area */}
        <div className="h-full overflow-y-auto scrollbar-hide">
          <div className="space-y-4 pb-4">
            {/* HERO */}
            <div className="text-center space-y-1 py-4 sm:py-6 border-b border-gray-800/50 mx-4 sm:mx-6">
              <h2 className="text-gray-500 uppercase tracking-[0.2em] text-[8px] sm:text-[10px] font-bold">Monthly Net Income</h2>
              <div className="text-3xl sm:text-5xl font-mono font-bold text-teal-400 print:text-black tracking-tight">{c(planData.totalIncome)}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-600 font-medium tracking-wide">Calculated on {savedDate}</div>
            </div>

            {/* ALERTS */}
            {planData.flags && planData.flags.length > 0 && (
              <div className="space-y-2 px-4 sm:px-6">
                {planData.flags.map((f, i) => (
                  <AlertBadge key={i} type={f.type} message={f.msg} rule={f.rule} />
                ))}
              </div>
            )}

            {/* BUDGET SPLIT CARD */}
            <div className="mx-4 sm:mx-6 bg-gray-900/40 rounded-2xl p-4 sm:p-6 border border-gray-800/50 print:border-gray-300 print:bg-white shadow-xl">
              <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2 print:text-black">
                <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                50/30/20 Breakdown
              </h3>
              
              <div className="h-4 rounded-full flex overflow-hidden mb-6 shadow-inner bg-gray-950/50 p-1 border border-gray-800/50">
                <div style={{ width: '50%' }} className="bg-blue-500 rounded-l-full relative group"></div>
                <div style={{ width: '30%' }} className="bg-orange-500 relative group"></div>
                <div style={{ width: '20%' }} className="bg-teal-500 rounded-r-full relative group"></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800/50 print:border-gray-200">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Fixed Costs</span>
                  <span className="text-sm font-mono text-white font-bold">{c(planData.totalFixed)}</span>
                </div>
                
                <div className="pt-1 grid gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Needs (50%)</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono text-white font-bold">{c(planData.needsBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Wants (30%)</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono text-white font-bold">{c(planData.wantsBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Savings (20%)</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono text-white font-bold">{c(planData.savingsTarget)}</span>
                  </div>
                </div>

                {planData.untrackedMoney > 0 && (
                  <div className="mt-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500/80">Leaking</span>
                    <span className="text-xs font-mono font-bold text-orange-400">{c(planData.untrackedMoney)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2-COL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6">
              <div className="bg-gray-900/40 rounded-2xl p-4 sm:p-5 border border-gray-800/50 print:border-gray-300 print:bg-white shadow-xl">
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4">Spending Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] text-gray-600 mb-1 font-bold uppercase tracking-widest">Daily Food Max</div>
                    <div className="text-xl font-mono text-white print:text-black">{c(planData.dailyFoodMax)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800/50">
                    <div>
                      <div className="text-[8px] text-gray-600 font-bold uppercase mb-0.5">Personal</div>
                      <div className="text-xs font-mono text-gray-300">{c(planData.personalMax)}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-gray-600 font-bold uppercase mb-0.5">Leisure</div>
                      <div className="text-xs font-mono text-gray-300">{c(planData.entertainmentMax)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/40 rounded-2xl p-4 sm:p-5 border border-gray-800/50 print:border-gray-300 print:bg-white flex flex-col justify-between shadow-xl">
                <div>
                  <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Safety Net</h3>
                  <div className="flex justify-between text-[8px] mb-2 font-bold uppercase tracking-wider text-gray-600">
                    <span className="text-teal-500/70">Have: {c(planData.currentSavings)}</span>
                    <span>Goal: {c(planData.efTarget)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden print:bg-gray-200 border border-gray-800/50">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(planData.efProgress * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-4 p-2 bg-gray-950/50 rounded-xl border border-gray-800/50 text-center">
                  <div className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-0.5">Time to target</div>
                  <div className="text-sm font-bold text-white print:text-black">
                    {planData.efMonths > 500 ? '∞' : `${planData.efMonths} months`}
                  </div>
                </div>
              </div>
            </div>

            {/* LOANS (if any) */}
            {planData.loanDetails && planData.loanDetails.length > 0 && (
              <div className="mx-4 sm:mx-6 bg-gray-900/40 rounded-2xl p-4 sm:p-5 border border-gray-800/50 print:border-gray-300 print:bg-white shadow-xl">
                <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between print:text-black">
                  <span>Debt Overview</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${planData.dtiRatio > 0.36 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-teal-500/10 text-teal-500 border border-teal-500/20'}`}>
                    DTI: {Math.round(planData.dtiRatio * 100)}%
                  </span>
                </h3>
                <div className="space-y-2">
                  {planData.loanDetails.map((l, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-950/30 rounded-xl border border-gray-800/50 transition-colors">
                      <div className="min-w-0 flex-1 mr-4">
                        <div className="text-xs font-bold text-white truncate print:text-black">{l.name || `Loan ${i+1}`}</div>
                        <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Due: {l.payoffDate}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-teal-400 font-bold">{c(l.emi)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI ADVICE */}
            <div className="mx-4 sm:mx-6 bg-gradient-to-br from-gray-900/60 to-black/60 rounded-2xl p-5 sm:p-6 border border-teal-500/10 print:border-gray-300 print:bg-white shadow-xl relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em] print:text-black">AI Insights</h3>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-teal-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-[8px] uppercase font-bold tracking-[0.3em]">Analyzing...</span>
                </div>
              ) : (
                <div className="space-y-3 text-[11px] sm:text-xs text-gray-400 whitespace-pre-wrap print:text-black leading-relaxed italic opacity-80">
                  {currentAdvice}
                </div>
              )}
            </div>

            <div className="text-center text-[8px] text-gray-700 print:text-gray-400 py-4 uppercase tracking-[0.3em] font-bold">
              CFP Certified Standard
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
