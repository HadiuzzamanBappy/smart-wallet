import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Wallet2,
  Building2,
  PiggyBank,
  ShieldCheck,
  Target,
  ChevronRight,
  Sparkles,
  Receipt,
  ChevronLeft,
  Briefcase,
  Home,
  CreditCard,
  Activity,
  Wallet,
  ArrowRight,
  Check
} from 'lucide-react';
import Modal from '../UI/base/Modal';
import GlassInput from '../UI/base/GlassInput';
import Select from '../UI/base/Select';
import Button from '../UI/base/Button';
import GlassCard from '../UI/base/GlassCard';
import IconBox from '../UI/base/IconBox';
import GlassBadge from '../UI/base/GlassBadge';

import { useAuth } from '../../hooks/useAuth';
import { calculatePlan } from '../../utils/salaryCalculator';

const StepBar = ({ current, total }) => {
  const steps = [
    { label: 'Income', icon: Briefcase },
    { label: 'Fixed Costs', icon: Home },
    { label: 'Loans', icon: CreditCard },
    { label: 'Savings', icon: PiggyBank },
    { label: 'Goals', icon: Target }
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2.5">
          <IconBox icon={steps[current].icon} size="sm" color="teal" variant="glass" />
          <div>
            <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em]">Step {current + 1}</p>
            <p className="text-sm font-bold text-white tracking-tight">{steps[current].label}</p>
          </div>
        </div>
        <GlassBadge label={`${current + 1} / ${total}`} variant="gray" />
      </div>
      <div className="flex gap-1.5 px-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden relative">
            <div
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${i <= current ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-transparent'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const SalaryFormModal = ({ isOpen, onClose, initialData, onComplete }) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(0);

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
    if (data.cityTier?.includes('Major')) data.cityTier = 'Major city';
    if (data.cityTier?.includes('Smaller')) data.cityTier = 'Smaller city';
    if (data.cityTier?.includes('Rural')) data.cityTier = 'Rural';
    return data;
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (initialData) {
      setForm(f => ({ ...f, ...initialData }));
    }
  }, [initialData]);

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
      <div className="space-y-2">
        <label className="flex items-center gap-2 px-1">
          <Briefcase className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Base Salary (After Tax)</span>
        </label>
        <GlassInput
          type="number"
          value={form.salary}
          onChange={e => update('salary', e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Side Revenue</span>
        </label>
        <GlassInput
          type="number"
          value={form.extra}
          onChange={e => update('extra', e.target.value)}
          placeholder="Freelance, Rental, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Age Bracket</label>
          <Select
            value={form.ageBracket}
            onChange={e => update('ageBracket', e.target.value)}
            options={[
              { value: '18-22', label: '18-22' },
              { value: '22-30', label: '22-30' },
              { value: '30-40', label: '30-40' },
              { value: '40+', label: '40+' }
            ]}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Location Tier</label>
          <Select
            value={form.cityTier}
            onChange={e => update('cityTier', e.target.value)}
            options={[
              { value: 'Major city', label: 'Major City' },
              { value: 'Smaller city', label: 'Smaller City' },
              { value: 'Rural', label: 'Rural Area' }
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderFixedCosts = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: 'hasRent', label: 'Housing Rent', icon: Home },
          { key: 'hasFamilySend', label: 'Family Remittance', icon: Plus }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => update(item.key, !form[item.key])}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
              form[item.key] 
                ? 'bg-teal-500/10 border-teal-500/30 text-white' 
                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <item.icon className={`w-4 h-4 ${form[item.key] ? 'text-teal-400' : 'text-gray-500'}`} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {form.hasRent && (
          <div className="space-y-2 animate-in zoom-in-95 duration-200">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Monthly Rent</label>
            <GlassInput type="number" value={form.rent} onChange={e => update('rent', e.target.value)} placeholder="0" />
          </div>
        )}
        {form.hasFamilySend && (
          <div className="space-y-2 animate-in zoom-in-95 duration-200">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Family Support</label>
            <GlassInput type="number" value={form.familySend} onChange={e => update('familySend', e.target.value)} placeholder="0" />
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Utilities</label>
          <GlassInput type="number" value={form.bills} onChange={e => update('bills', e.target.value)} placeholder="Bills & Subs" />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Transport</label>
          <GlassInput type="number" value={form.transport} onChange={e => update('transport', e.target.value)} placeholder="Commute" />
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-3">
        {form.loans.map((loan, idx) => (
          <GlassCard key={idx} padding="p-3" className="bg-white/5 border-white/5">
            <div className="flex gap-3 items-center">
              <div className="flex-1 space-y-3">
                <GlassInput
                  value={loan.name}
                  onChange={e => { const nl = [...form.loans]; nl[idx].name = e.target.value; update('loans', nl); }}
                  placeholder="Debt Title (Bank, Personal...)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <GlassInput
                    type="number"
                    value={loan.emi}
                    onChange={e => { const nl = [...form.loans]; nl[idx].emi = e.target.value; update('loans', nl); }}
                    placeholder="Monthly EMI"
                  />
                  <GlassInput
                    type="number"
                    value={loan.remaining}
                    onChange={e => { const nl = [...form.loans]; nl[idx].remaining = e.target.value; update('loans', nl); }}
                    placeholder="Months Left"
                  />
                </div>
              </div>
              <button
                onClick={() => update('loans', form.loans.filter((_, i) => i !== idx))}
                className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}

        <Button
          variant="ghost"
          color="gray"
          fullWidth
          onClick={() => update('loans', [...form.loans, { name: '', emi: '', remaining: '' }])}
          icon={Plus}
        >
          Add Debt Obligation
        </Button>
      </div>
    </div>
  );

  const renderSavings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-2">
        <label className="flex items-center gap-2 px-1">
          <Wallet2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Liquid Cash in Hand</span>
        </label>
        <GlassInput
          type="number"
          value={form.cashInHand}
          onChange={e => update('cashInHand', e.target.value)}
          placeholder="Current Balance"
        />
      </div>

      <div className="space-y-4">
        {form.deposits.map((dep, idx) => (
          <GlassCard key={idx} padding="p-4" className="bg-white/5 border-white/5">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Select
                  value={dep.type}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].type = e.target.value; update('deposits', nd); }}
                  options={[
                    { value: 'FDR', label: 'FDR' },
                    { value: 'Deposit', label: 'Savings Deposit' },
                    { value: 'Sanchaypotro', label: 'Sanchaypotro' },
                    { value: 'Others', label: 'Other Asset' }
                  ]}
                  className="w-32"
                />
                <GlassInput
                  value={dep.name}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].name = e.target.value; update('deposits', nd); }}
                  placeholder="Asset Label"
                  className="flex-1"
                />
                <button
                  onClick={() => update('deposits', form.deposits.filter((_, i) => i !== idx))}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <GlassInput
                  type="number"
                  value={dep.monthly}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].monthly = e.target.value; update('deposits', nd); }}
                  placeholder="Monthly Contrib"
                />
                <GlassInput
                  type="number"
                  value={dep.balance}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].balance = e.target.value; update('deposits', nd); }}
                  placeholder="Current Balance"
                />
              </div>
            </div>
          </GlassCard>
        ))}

        <Button
          variant="ghost"
          color="gray"
          fullWidth
          onClick={() => update('deposits', [...form.deposits, { type: 'Deposit', name: '', monthly: '', balance: '', useForGoal: true }])}
          icon={Plus}
        >
          Add Financial Asset
        </Button>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Goal Value</label>
          <GlassInput type="number" value={form.goal} onChange={e => update('goal', e.target.value)} placeholder="Target Price" />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Horizon (Months)</label>
          <Select
            value={form.goalMonths}
            onChange={e => update('goalMonths', e.target.value)}
            options={["6", "12", "18", "24", "36"].map(v => ({ value: v, label: `${v} Months` }))}
          />
        </div>
      </div>

      {form.goal > 0 && (
        <GlassCard className="bg-teal-500/5 border-teal-500/10" padding="p-5">
          <div className="flex items-center gap-3 mb-4">
            <IconBox icon={Target} size="sm" color="teal" variant="glass" />
            <span className="text-[11px] font-black text-white uppercase tracking-widest">Plan Projection</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Target Value', val: c(form.goal), color: 'text-white' },
              { label: 'Asset Offset', val: c(livePlan.projectedAssets), color: 'text-teal-400' },
              { label: 'Net Gap', val: c(livePlan.remainingGoal), color: 'text-amber-400' }
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-gray-500 uppercase tracking-wider">{item.label}</span>
                <span className={`font-mono font-black ${item.color}`}>{item.val}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[11px] font-black text-teal-500 uppercase tracking-[0.2em]">Required / mo</span>
              <span className="text-lg font-mono font-black text-white">{c(livePlan.monthlyForGoal)}</span>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wealth Architect"
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full gap-4">
          <Button
            variant="ghost"
            color="gray"
            onClick={step > 0 ? prevStep : onClose}
            icon={step > 0 ? ChevronLeft : X}
          >
            {step > 0 ? 'Back' : 'Discard'}
          </Button>

          <Button
            color="teal"
            className="min-w-[140px]"
            onClick={nextStep}
            disabled={step === 0 && !form.salary}
            icon={step === 4 ? Check : ChevronRight}
            iconPosition="right"
          >
            {step === 4 ? 'Finalize Plan' : 'Proceed'}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <StepBar current={step} total={5} />

        {/* Intelligence Summary Island */}
        <GlassCard padding="p-5" className="bg-[#0f172a]/80 border-white/5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-y-4 items-center">
            {[
              { label: 'Income', val: c(livePlan.totalIncome), color: 'text-white' },
              { label: 'Fixed Ops', val: c(livePlan.totalFixedCosts), color: 'text-rose-400' },
              { label: 'Debt Load', val: c(livePlan.totalEMI), color: 'text-amber-400' },
              { label: 'Saved', val: c(livePlan.actualSavings), color: 'text-emerald-400' },
              { label: 'Goal Alloc', val: c(livePlan.monthlyForGoal), color: 'text-indigo-400' },
              { label: 'Surplus', val: `${livePlan.isDeficit ? '-' : '+'}${c(Math.abs(livePlan.netBalance))}`, color: livePlan.isDeficit ? 'text-red-500' : 'text-sky-400' }
            ].map((metric, i) => (
              <div key={metric.label} className={`flex flex-col items-center text-center px-1 ${i < 5 ? 'md:border-r border-white/5' : ''}`}>
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{metric.label}</span>
                <span className={`text-[11px] font-mono font-black truncate max-w-full ${metric.color}`}>{metric.val}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <div className="h-1.5 w-full bg-white/5 rounded-full flex overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(livePlan.fixedRatio * 100, 100)}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.loanRatio * 100, 100)}%` }} />
              <div className="h-full bg-emerald-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.savingsRatio * 100, 100)}%` }} />
              <div className="h-full bg-indigo-500 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.min(livePlan.goalRatio * 100, 100)}%` }} />
              <div className="h-full bg-sky-400 transition-all duration-700 border-l border-black/20" style={{ width: `${Math.max(0, 100 - (livePlan.fixedRatio + livePlan.loanRatio + livePlan.savingsRatio + livePlan.goalRatio) * 100)}%` }} />
            </div>
            <div className="flex justify-between px-0.5">
              {[
                { label: 'Fixed', color: 'bg-rose-500', pct: Math.round(livePlan.fixedRatio * 100) },
                { label: 'Debt', color: 'bg-amber-500', pct: Math.round(livePlan.loanRatio * 100) },
                { label: 'Saved', color: 'bg-emerald-500', pct: Math.round(livePlan.savingsRatio * 100) },
                { label: 'Goal', color: 'bg-indigo-500', pct: Math.round(livePlan.goalRatio * 100) },
                { label: 'Free', color: 'bg-sky-400', pct: Math.round(livePlan.freeRatio * 100) }
              ].map(leg => (
                <div key={leg.label} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${leg.color}`} />
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{leg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Dynamic Form View */}
        <div className="min-h-[320px]">
          {step === 0 && renderIncome()}
          {step === 1 && renderFixedCosts()}
          {step === 2 && renderLoans()}
          {step === 3 && renderSavings()}
          {step === 4 && renderGoals()}
        </div>
      </div>
    </Modal>
  );
};

export default SalaryFormModal;
