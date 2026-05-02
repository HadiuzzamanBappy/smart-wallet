import { X, Plus, Trash2, Wallet2, Building2, PiggyBank, ShieldCheck, Target, ChevronRight, Sparkles, Receipt, ChevronLeft, Briefcase, Home, CreditCard, Activity, Wallet, ArrowRight } from 'lucide-react';
import Modal from '../UI/base/Modal';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { calculatePlan } from '../../utils/salaryCalculator';

const StepBar = ({ current, total, onStepClick }) => {
  const steps = [
    { label: 'Income', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { label: 'Fixed Costs', icon: <Home className="w-3.5 h-3.5" /> },
    { label: 'Loans', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { label: 'Savings', icon: <PiggyBank className="w-3.5 h-3.5" /> },
    { label: 'Goals', icon: <Target className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        <div className="flex items-center gap-2 text-teal-500">
          {steps[current].icon}
          <span>{steps[current].label}</span>
        </div>
        <span>Step {current + 1} of {total}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onStepClick && onStepClick(i)}
            disabled={i > current && !onStepClick} // Disable jumping ahead if we want to enforce sequence, but here we allow it if provided
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i === current ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' :
              i < current ? 'bg-teal-700/50 hover:bg-teal-600/70' : 'bg-gray-700 hover:bg-gray-600'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

const SalaryFormModal = ({ isOpen, onClose, initialData, onComplete }) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(0);

  // Ensure initialData is merged with defaults so missing keys (like loans/deposits) don't cause crashes
  const [form, setForm] = useState(() => {
    const defaults = {
      currency: userProfile?.currency || 'BDT',
      salary: '',
      extra: '',
      ageBracket: '22-30',
      cityTier: 'Major city',
      hasRent: false,
      rent: '',
      hasFamilySend: false,
      familySend: '',
      bills: '',
      transport: '',
      cashInHand: '',
      loans: [],
      deposits: [],
      goal: '',
      goalMonths: '12',
    };
    const data = initialData ? { ...defaults, ...initialData } : defaults;
    // Normalize legacy city values for button matching
    if (data.cityTier?.includes('Major')) data.cityTier = 'Major city';
    if (data.cityTier?.includes('Smaller')) data.cityTier = 'Smaller city';
    if (data.cityTier?.includes('Rural')) data.cityTier = 'Rural';
    return data;
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Sync form with initialData when it arrives (handles async loading)
  React.useEffect(() => {
    if (initialData) {
      setForm(f => ({ ...f, ...initialData }));
    }
  }, [initialData]);

  // Live Calculation for immediate feedback
  const livePlan = calculatePlan(form);
  const sym = livePlan.currencySymbol;
  const c = (val) => `${sym}${Math.round(val || 0).toLocaleString()}`;

  const nextStep = () => {
    if (step === 0 && !form.salary) return;
    if (step < 4) setStep(s => s + 1);
    else onComplete(form);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const renderIncome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Monthly Bank Deposit (After Tax) *</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <span className="text-teal-500 font-mono font-bold text-sm">{sym}</span>
          </div>
          <input
            type="number"
            value={form.salary}
            onChange={e => update('salary', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 pl-10 text-white text-lg font-mono focus:ring-2 focus:ring-teal-500/50 transition-all outline-none placeholder:text-gray-700"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Any Side Income? (Freelance, Rental, etc.)</label>
          {form.extra > 0 && (
            <button onClick={() => update('extra', '')} className="text-[9px] text-teal-500 font-bold uppercase hover:underline">None this month</button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">{sym}</span>
          <input
            type="number" value={form.extra} onChange={e => update('extra', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3.5 pl-10 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none font-mono"
            placeholder="0"
          />
        </div>
      </div>

      {/* Age & Location Selection */}
      <div className="flex flex-col gap-6 pt-4 border-t border-gray-800/40">
        {/* Age Selection */}
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">How old are you?</label>
          <div className="flex gap-2">
            {['18-22', '22-30', '30-40', '40+'].map((range) => (
              <button
                key={range}
                onClick={() => update('ageBracket', range)}
                className={`flex-1 py-2.5 rounded-2xl border text-[10px] font-bold transition-all duration-300 ${form.ageBracket === range
                  ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700 hover:bg-gray-900/40'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Where do you live?</label>
          <div className="flex gap-2">
            {['Major city', 'Smaller city', 'Rural'].map((tier) => (
              <button
                key={tier}
                onClick={() => update('cityTier', tier)}
                className={`flex-1 py-2.5 rounded-2xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${form.cityTier === tier
                  ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                  : 'bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-700 hover:bg-gray-900/40'
                  }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFixedCosts = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${form.hasRent ? 'bg-teal-500/10 border-teal-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
            }`}
          onClick={() => update('hasRent', !form.hasRent)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${form.hasRent ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-800 text-gray-500'}`}>
              <Home className="w-4 h-4" />
            </div>
            <span className={`text-sm font-bold ${form.hasRent ? 'text-white' : 'text-gray-500'}`}>I pay Rent / Housing</span>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${form.hasRent ? 'bg-teal-500 border-teal-500' : 'border-gray-700'
            }`}>
            {form.hasRent && <ChevronRight className="w-3 h-3 text-white" />}
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${form.hasFamilySend ? 'bg-teal-500/10 border-teal-500/50' : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
            }`}
          onClick={() => update('hasFamilySend', !form.hasFamilySend)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${form.hasFamilySend ? 'bg-teal-500/20 text-teal-400' : 'bg-gray-800 text-gray-500'}`}>
              <Plus className="w-4 h-4" />
            </div>
            <span className={`text-sm font-bold ${form.hasFamilySend ? 'text-white' : 'text-gray-500'}`}>I send to Family</span>
          </div>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${form.hasFamilySend ? 'bg-teal-500 border-teal-500' : 'border-gray-700'
            }`}>
            {form.hasFamilySend && <ChevronRight className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {form.hasRent && (
          <div className="animate-in zoom-in-95 duration-200">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Monthly Rent / EMI</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">{sym}</span>
              <input
                type="number" value={form.rent} onChange={e => update('rent', e.target.value)}
                className="w-full bg-gray-900/50 border border-teal-500/30 rounded-xl p-3.5 pl-10 text-white outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
                placeholder="0"
              />
            </div>
          </div>
        )}
        {form.hasFamilySend && (
          <div className="animate-in zoom-in-95 duration-200">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Monthly Family Support</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">{sym}</span>
              <input
                type="number" value={form.familySend} onChange={e => update('familySend', e.target.value)}
                className="w-full bg-gray-900/50 border border-teal-500/30 rounded-xl p-3.5 pl-10 text-white outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
                placeholder="0"
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Utilities & Subscriptions</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">{sym}</span>
            <input
              type="number" value={form.bills} onChange={e => update('bills', e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3.5 pl-10 text-white outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
              placeholder="Internet, Power, Netflix…"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Monthly Commute / Transport</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">{sym}</span>
            <input
              type="number" value={form.transport} onChange={e => update('transport', e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3.5 pl-10 text-white outline-none focus:ring-2 focus:ring-teal-500/50 font-mono"
              placeholder="Bus, Fuel, Uber…"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        {form.loans.length === 0 ? (
          <div className="text-center p-6 bg-gray-900/20 rounded-2xl border border-dashed border-gray-800 text-gray-600">
            <p className="text-[9px] font-bold uppercase tracking-widest">No active loans or EMIs</p>
          </div>
        ) : (
          form.loans.map((loan, idx) => (
            <div key={idx} className="p-2.5 bg-gray-950/40 border border-gray-800/40 rounded-2xl relative group transition-all">
              <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
                <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                  <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-gray-900 border border-gray-800 text-amber-400 shadow-inner">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text" value={loan.name} onChange={e => { const nl = [...form.loans]; nl[idx].name = e.target.value; update('loans', nl); }}
                    className="h-8 flex-1 min-w-0 bg-gray-900/50 border border-gray-800 rounded-xl px-3 text-white text-xs font-medium outline-none focus:border-amber-500/30 transition-all placeholder:text-gray-700"
                    placeholder="Debt Name / Bank"
                  />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <div className="flex gap-2 flex-1 lg:flex-none">
                    <div className="relative h-8 flex-1 lg:w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">{sym}</span>
                      <input
                        type="number" value={loan.emi} onChange={e => { const nl = [...form.loans]; nl[idx].emi = e.target.value; update('loans', nl); }}
                        className="h-full w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-6 pr-2 text-white text-xs font-mono outline-none focus:border-amber-500/30 transition-all"
                        placeholder="EMI"
                      />
                    </div>
                    <div className="relative h-8 flex-1 lg:w-20">
                      <input
                        type="number" value={loan.remaining} onChange={e => { const nl = [...form.loans]; nl[idx].remaining = e.target.value; update('loans', nl); }}
                        className="h-full w-full bg-gray-900/50 border border-gray-800 rounded-xl px-2 text-white text-[10px] font-mono outline-none focus:border-amber-500/30 transition-all text-center"
                        placeholder="Months"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => update('loans', form.loans.filter((_, i) => i !== idx))}
                    className="h-8 w-8 shrink-0 flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => update('loans', [...form.loans, { name: '', emi: '', remaining: '' }])}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-amber-400 hover:border-amber-500/30 transition-all group"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Add EMI / Debt Record</span>
        </button>
      </div>
    </div>
  );

  const renderSavings = () => {
    const typeConfigs = {
      'FDR': { icon: <Building2 className="w-3.5 h-3.5" />, color: 'blue', border: 'border-blue-500/20', text: 'text-blue-400' },
      'Deposit': { icon: <PiggyBank className="w-3.5 h-3.5" />, color: 'teal', border: 'border-teal-500/20', text: 'text-teal-400' },
      'Sanchaypotro': { icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'emerald', border: 'border-emerald-500/20', text: 'text-emerald-400' },
      'Others': { icon: <Plus className="w-3.5 h-3.5" />, color: 'gray', border: 'border-gray-500/20', text: 'text-gray-400' }
    };

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Dedicated Cash in Hand Field */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <Wallet2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Cash in Hand / Existing Balance</h4>
              <p className="text-[10px] text-gray-500 font-medium">Your current liquid wallet balance to start with</p>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-mono text-sm">{sym}</span>
            <input
              type="number"
              value={form.cashInHand}
              onChange={e => update('cashInHand', e.target.value)}
              className="w-full bg-gray-950/50 border border-amber-500/30 rounded-xl p-3.5 pl-10 text-white outline-none focus:ring-2 focus:ring-amber-500/30 font-mono transition-all"
              placeholder="0"
            />
          </div>
        </div>

        <div className="h-px bg-gray-800/40 my-2" />

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">Other Monthly Assets / Savings</label>
          {form.deposits.length === 0 ? (
            <div className="text-center p-6 bg-gray-900/20 rounded-2xl border border-dashed border-gray-800 text-gray-600">
              <p className="text-[9px] font-bold uppercase tracking-widest">No other assets added</p>
            </div>
          ) : (
            form.deposits.map((dep, idx) => {
              const cfg = typeConfigs[dep.type] || typeConfigs['Others'];
              return (
                <div key={idx} className={`p-2.5 bg-gray-950/40 border ${cfg.border} rounded-2xl relative group transition-all overflow-hidden`}>
                  <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
                    {/* LEFT: TYPE & NAME */}
                    <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                      <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-gray-900 border ${cfg.border} ${cfg.text} shadow-inner`}>
                        {cfg.icon}
                      </div>
                      <div className="relative h-8 shrink-0">
                        <select
                          value={dep.type || 'Deposit'}
                          onChange={e => {
                            const nd = [...form.deposits]; nd[idx] = { ...nd[idx], type: e.target.value }; update('deposits', nd);
                          }}
                          className={`h-full bg-gray-900/50 border border-gray-800 rounded-xl px-2.5 text-[9px] font-black uppercase tracking-tight outline-none cursor-pointer appearance-none pr-7 focus:border-teal-500/30 transition-all ${cfg.text}`}
                        >
                          {Object.keys(typeConfigs).map(t => <option key={t} value={t} className="bg-gray-900 text-white font-sans normal-case text-xs">{t}</option>)}
                        </select>
                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-600 rotate-90 pointer-events-none" />
                      </div>
                      <input
                        type="text" value={dep.name} onChange={e => {
                          const nd = [...form.deposits]; nd[idx] = { ...nd[idx], name: e.target.value }; update('deposits', nd);
                        }}
                        className="h-8 flex-1 min-w-0 bg-gray-900/50 border border-gray-800 rounded-xl px-3 text-white text-xs font-medium outline-none focus:border-teal-500/30 transition-all placeholder:text-gray-700"
                        placeholder="Label"
                      />
                    </div>

                    {/* RIGHT: VALUES & TOGGLE */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <div className="flex gap-2 flex-1 lg:flex-none">
                        {dep.type !== 'Sanchaypotro' && (
                          <div className="relative h-8 flex-1 lg:w-20">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-teal-600/50 font-mono">{sym}</span>
                            <input
                              type="number" value={dep.monthly} onChange={e => {
                                const nd = [...form.deposits]; nd[idx] = { ...nd[idx], monthly: e.target.value }; update('deposits', nd);
                              }}
                              className="h-full w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-6 pr-2 text-teal-400 text-xs font-mono outline-none focus:border-teal-500/30 transition-all"
                              placeholder="Mo"
                            />
                          </div>
                        )}
                        <div className="relative h-8 flex-1 lg:w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">{sym}</span>
                          <input
                            type="number" value={dep.balance} onChange={e => {
                              const nd = [...form.deposits]; nd[idx] = { ...nd[idx], balance: e.target.value }; update('deposits', nd);
                            }}
                            className="h-full w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-6 pr-2 text-white text-xs font-mono outline-none focus:border-teal-500/30 transition-all"
                            placeholder="Bal"
                          />
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const nd = [...form.deposits]; nd[idx] = { ...nd[idx], useForGoal: dep.useForGoal === false ? true : false }; update('deposits', nd);
                          }}
                          className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-xl border transition-all ${dep.useForGoal !== false ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-gray-900 border-gray-800 text-gray-700'}`}
                        >
                          <Target className={`w-3.5 h-3.5 ${dep.useForGoal !== false ? 'animate-pulse' : ''}`} />
                        </button>

                        <button
                          onClick={() => update('deposits', form.deposits.filter((_, i) => i !== idx))}
                          className="h-8 w-8 shrink-0 flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <button
            onClick={() => update('deposits', [...form.deposits, { type: 'Deposit', name: '', monthly: '', balance: '', useForGoal: true }])}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-teal-400 hover:border-teal-500/30 transition-all group"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Add Asset</span>
          </button>
        </div>
      </div>
    );
  };

  const renderGoals = () => {
    const goalVal = parseFloat(form.goal) || 0;
    const goalMonths = parseFloat(form.goalMonths) || 12;
    const cashInHand = parseFloat(form.cashInHand) || 0;
    
    const currentAssets = (form.deposits || []).filter(d => d.useForGoal !== false).reduce((s, d) => s + (parseFloat(d.balance) || 0), 0);
    const monthlySavings = (form.deposits || []).filter(d => d.useForGoal !== false).reduce((s, d) => s + (parseFloat(d.monthly) || 0), 0);
    
    const projectedSavings = monthlySavings * goalMonths;
    const totalProjected = currentAssets + cashInHand + projectedSavings;
    const gap = Math.max(goalVal - totalProjected, 0);
    const monthly = gap > 0 ? gap / goalMonths : 0;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Goal Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-[10px]">{sym}</span>
              <input
                type="number" value={form.goal} onChange={e => update('goal', e.target.value)}
                className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl p-2.5 pl-7 text-white outline-none focus:border-teal-500/30 font-mono text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1.5">Timeline</label>
            <select
              value={form.goalMonths} onChange={e => update('goalMonths', e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl p-2.5 text-white outline-none focus:border-teal-500/30 cursor-pointer text-xs"
            >
              {["6", "12", "18", "24"].map(c => <option key={c} value={c}>{c} months</option>)}
            </select>
          </div>
        </div>

        {goalVal > 0 && (
          <div className="bg-gray-950/30 border border-gray-800/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 border-b border-gray-800/40 bg-white/[0.02] flex items-center justify-between">
              <span className="text-[8px] font-black text-teal-500 uppercase tracking-[0.2em]">Breakdown</span>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{form.goalMonths} Mo Plan</span>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Total Price</span>
                <span className="font-mono text-white">{c(goalVal)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Current Assets</span>
                <span className="font-mono text-teal-400/80">-{c(currentAssets)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Cash in Hand</span>
                <span className="font-mono text-emerald-400/80">-{c(cashInHand)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Projected Savings ({goalMonths} mo)</span>
                <span className="font-mono text-indigo-400/80">-{c(projectedSavings)}</span>
              </div>

              <div className="pt-2.5 border-t border-gray-800/40 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Gap</span>
                <span className={`text-sm font-mono font-black ${gap > 0 ? 'text-white' : 'text-teal-400'}`}>
                  {gap === 0 ? 'READY' : c(gap)}
                </span>
              </div>

              {gap > 0 && (
                <div className="mt-4 p-3 bg-teal-500/5 rounded-2xl border border-teal-500/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-teal-500 uppercase tracking-widest">Monthly Commitment</span>
                    <span className="text-sm font-mono font-black text-white">{c(monthly)}</span>
                  </div>
                  <Target className="w-4 h-4 text-teal-500/50" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const modalFooter = (
    <div className="flex justify-between items-center w-full">
      <button
        onClick={step > 0 ? prevStep : onClose}
        className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-white transition-colors font-bold text-[10px] uppercase tracking-widest"
      >
        {step > 0 ? <ChevronLeft className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
        {step > 0 ? 'Back' : 'Cancel'}
      </button>

      <button
        onClick={nextStep}
        disabled={step === 0 && !form.salary}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 active:scale-95"
      >
        <span>{step === 4 ? 'Finish' : 'Next'}</span>
        {step < 4 && <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      size="lg"
      disableScroll={true}
      footer={modalFooter}
    >
      <div className="flex flex-col text-gray-300 overflow-hidden max-h-[85vh]">

        {/* --- FIXED COMMAND ZONE (TOP) --- */}
        <div className="shrink-0 bg-white/5 border-b border-gray-800/40 p-4 sm:p-6 space-y-5">
          {/* STEP HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <Briefcase className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h2 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-0.5">Step {step + 1} of 5</h2>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {['Income Setup', 'Fixed Expenses', 'Loans & Debt', 'Savings Pool', 'Purchase Goal'][step]}
                </h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="flex gap-1.5 px-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-gray-800/50 overflow-hidden relative">
                <div
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${i <= step ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-transparent'
                    }`}
                />
              </div>
            ))}
          </div>

          {/* ANALYSIS SUMMARY ISLAND */}
          <div className="bg-gray-950/50 border border-gray-800/40 rounded-2xl p-4 shadow-xl relative overflow-hidden group">
            {/* METRIC STRIP (GRID: 3-col mobile / 6-col desktop) */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-y-4 md:gap-x-1 mb-5 items-center">
              <div className="px-1 border-r border-gray-800/50 last:border-0 md:border-r flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Income</div>
                <div className="text-sm sm:text-base font-mono font-bold text-white truncate">{c(livePlan.totalIncome)}</div>
              </div>
              <div className="px-1 border-r border-gray-800/50 last:border-0 md:border-r flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fixed Cost</div>
                <div className="text-sm sm:text-base font-mono font-bold text-rose-400 truncate">{c(livePlan.totalFixedCosts)}</div>
              </div>
              <div className="px-1 border-r-0 md:border-r border-gray-800/50 last:border-0 flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Debt / EMI</div>
                <div className="text-sm sm:text-base font-mono font-bold text-amber-400 truncate">{c(livePlan.totalEMI)}</div>
              </div>
              <div className="px-1 border-r border-gray-800/50 last:border-0 md:border-r flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Saved / mo</div>
                <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 truncate">{c(livePlan.actualSavings)}</div>
              </div>
              <div className="px-1 border-r border-gray-800/50 last:border-0 md:border-r flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Goal / mo</div>
                <div className="text-sm sm:text-base font-mono font-bold text-indigo-400 truncate">
                  {c(livePlan.monthlyForGoal)}
                </div>
              </div>
              <div className="px-1 flex flex-col items-center justify-center text-center min-h-[35px]">
                <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Surplus</div>
                <div className={`text-sm sm:text-base font-mono font-bold truncate ${livePlan.isDeficit ? 'text-red-500' : 'text-sky-400'}`}>
                  {livePlan.isDeficit ? '-' : '+'}{c(Math.abs(livePlan.netBalance))}
                </div>
              </div>
            </div>

            {/* LIVE ALLOCATION BAR */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-gray-900 rounded-full flex overflow-hidden border border-gray-800/50">
                <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(livePlan.fixedRatio * 100, 100)}%` }} />
                <div className="h-full bg-amber-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.loanRatio * 100, 100)}%` }} />
                <div className="h-full bg-emerald-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.savingsRatio * 100, 100)}%` }} />
                <div className="h-full bg-indigo-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.goalRatio * 100, 100)}%` }} />
                <div className="h-full bg-sky-400 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.max(0, 100 - (livePlan.fixedRatio + livePlan.loanRatio + livePlan.savingsRatio + livePlan.goalRatio) * 100)}%` }} />
              </div>
              <div className="flex flex-wrap justify-between gap-y-1 text-[8px] font-black uppercase tracking-wider text-gray-500 px-0.5">
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-rose-500" /> {Math.round(livePlan.fixedRatio * 100)}%</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-amber-500" /> {Math.round(livePlan.loanRatio * 100)}%</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500" /> {Math.round(livePlan.savingsRatio * 100)}%</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-indigo-500" /> {Math.round(livePlan.goalRatio * 100)}%</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-sky-400" /> {Math.round(livePlan.freeRatio * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC FORM ZONE (SCROLLABLE) --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="pb-8">
              {step === 0 && renderIncome()}
              {step === 1 && renderFixedCosts()}
              {step === 2 && renderLoans()}
              {step === 3 && renderSavings()}
              {step === 4 && renderGoals()}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SalaryFormModal;
