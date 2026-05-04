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
import Badge from '../UI/base/Badge';

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
        <div className="flex items-center gap-3">
          <IconBox icon={steps[current].icon} size="sm" color="primary" variant="glass" />
          <div className="flex flex-col">
            <h3 className="text-label font-bold text-ink-900 dark:text-white uppercase tracking-wider">{steps[current].label}</h3>
            <p className="text-overline opacity-40">Phase {current + 1} of {total}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 px-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-paper-100 dark:bg-white/5 overflow-hidden relative">
            <div
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${i <= current ? 'bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]' : 'bg-transparent'}`}
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
      const data = { ...initialData };
      if (data.cityTier?.includes('Major')) data.cityTier = 'Major city';
      if (data.cityTier?.includes('Smaller')) data.cityTier = 'Smaller city';
      if (data.cityTier?.includes('Rural')) data.cityTier = 'Rural';
      setForm(f => ({ ...f, ...data }));
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
          <Briefcase className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span className="text-overline text-ink-400 dark:text-paper-700">Base Salary (After Tax)</span>
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
          <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          <span className="text-overline text-ink-400 dark:text-paper-700">Side Revenue</span>
        </label>
        <GlassInput
          type="number"
          value={form.extra}
          onChange={e => update('extra', e.target.value)}
          placeholder="Freelance, Rental, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-5 pt-2">
        <div className="space-y-2">
          <label className="block text-overline text-ink-400 dark:text-paper-700 px-1">Age Bracket</label>
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
          <label className="block text-overline text-ink-400 dark:text-paper-700 px-1">Location Tier</label>
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
            className={`flex items-center gap-3 p-5 rounded-3xl border transition-all duration-300 shadow-sm ${form[item.key]
              ? 'bg-primary-500/10 border-primary-500/30 text-ink-900 dark:text-paper-50'
              : 'bg-paper-100/50 dark:bg-white/5 border-paper-200/50 dark:border-white/5 text-ink-400 dark:text-paper-700 hover:bg-paper-200/50 dark:hover:bg-white/10 hover:border-paper-300 dark:hover:border-white/10'
              }`}
          >
            <item.icon className={`w-4 h-4 ${form[item.key] ? 'text-primary-600 dark:text-primary-400' : 'text-ink-400'}`} />
            <span className="text-overline">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {form.hasRent && (
          <div className="space-y-2 animate-in zoom-in-95 duration-200">
            <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Monthly Rent</label>
            <GlassInput type="number" value={form.rent} onChange={e => update('rent', e.target.value)} placeholder="0" />
          </div>
        )}
        {form.hasFamilySend && (
          <div className="space-y-2 animate-in zoom-in-95 duration-200">
            <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Family Support</label>
            <GlassInput type="number" value={form.familySend} onChange={e => update('familySend', e.target.value)} placeholder="0" />
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Utilities</label>
          <GlassInput type="number" value={form.bills} onChange={e => update('bills', e.target.value)} placeholder="Bills & Subs" />
        </div>
        <div className="space-y-2">
          <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Transport</label>
          <GlassInput type="number" value={form.transport} onChange={e => update('transport', e.target.value)} placeholder="Commute" />
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        {form.loans.map((loan, idx) => (
          <GlassCard key={idx} padding="p-4" className="bg-paper-100/30 dark:bg-white/5 border-paper-100 dark:border-white/5">
            <div className="flex gap-4 items-center">
              <div className="flex-1 space-y-4">
                <GlassInput
                  value={loan.name}
                  onChange={e => { const nl = [...form.loans]; nl[idx].name = e.target.value; update('loans', nl); }}
                  placeholder="Debt Title (Bank, Personal...)"
                />
                <div className="grid grid-cols-2 gap-4">
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
                className="p-3 rounded-3xl bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-500/20 transition-all active:scale-90 border border-error-100 dark:border-error-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}

        <Button
          variant="soft"
          color="info"
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
          <Wallet2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          <span className="text-overline text-ink-400 dark:text-paper-700 tracking-widest">Liquid Cash in Hand</span>
        </label>
        <GlassInput
          type="number"
          value={form.cashInHand}
          onChange={e => update('cashInHand', e.target.value)}
          placeholder="Current Balance"
        />
      </div>

      <div className="space-y-5">
        {form.deposits.map((dep, idx) => (
          <GlassCard key={idx} padding="p-5" className="bg-paper-100/30 dark:bg-white/5 border-paper-100 dark:border-white/5">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={dep.type}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].type = e.target.value; update('deposits', nd); }}
                  options={[
                    { value: 'FDR', label: 'FDR' },
                    { value: 'Deposit', label: 'Savings Deposit' },
                    { value: 'Sanchaypotro', label: 'Sanchaypotro' },
                    { value: 'Others', label: 'Other Asset' }
                  ]}
                  className="w-36"
                />
                <GlassInput
                  value={dep.name}
                  onChange={e => { const nd = [...form.deposits]; nd[idx].name = e.target.value; update('deposits', nd); }}
                  placeholder="Asset Label"
                  className="flex-1"
                />
                <button
                  onClick={() => update('deposits', form.deposits.filter((_, i) => i !== idx))}
                  className="p-3 rounded-3xl bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-500/20 transition-all border border-error-100 dark:border-error-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
          variant="soft"
          color="info"
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
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Goal Value</label>
          <GlassInput type="number" value={form.goal} onChange={e => update('goal', e.target.value)} placeholder="Target Price" />
        </div>
        <div className="space-y-2">
          <label className="block text-overline text-ink-400 dark:text-paper-700 tracking-widest px-1">Horizon (Months)</label>
          <Select
            value={form.goalMonths}
            onChange={e => update('goalMonths', e.target.value)}
            options={["6", "12", "18", "24", "36"].map(v => ({ value: v, label: `${v} Months` }))}
          />
        </div>
      </div>

      {form.goal > 0 && (
        <GlassCard className="bg-primary-500/5 dark:bg-primary-500/5 border-primary-500/10 shadow-sm" padding="p-6">
          <div className="flex items-center gap-4 mb-5">
            <IconBox icon={Target} size="sm" color="primary" variant="glass" />
            <span className="text-overline text-ink-900 dark:text-paper-50 tracking-widest">Plan Projection</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Target Value', val: c(form.goal), color: 'text-ink-900 dark:text-paper-50' },
              { label: 'Asset Offset', val: c(livePlan.projectedAssets), color: 'text-primary-600 dark:text-primary-400' },
              { label: 'Net Gap', val: c(livePlan.remainingGoal), color: 'text-amber-600 dark:text-amber-400' }
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-overline text-ink-400 dark:text-paper-700 opacity-70">{item.label}</span>
                <span className={`text-label font-mono ${item.color}`}>{item.val}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-paper-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-overline text-primary-600 dark:text-primary-500">Required / mo</span>
              <span className="text-h4 font-mono text-ink-900 dark:text-paper-50">{c(livePlan.monthlyForGoal)}</span>
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
      fullMobile
      footer={
        <div className="flex justify-between items-center w-full gap-4">
          <Button
            variant="ghost"
            color="ink"
            onClick={step > 0 ? prevStep : onClose}
            icon={step > 0 ? ChevronLeft : X}
          >
            {step > 0 ? 'Back' : 'Discard'}
          </Button>

          <Button
            color="primary"
            className="min-w-[160px]"
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
        <GlassCard
          variant="flat"
          padding="p-4 sm:p-6"
          className="!bg-surface-card dark:!bg-surface-card-dark backdrop-blur-xl rounded-3xl border-paper-200/50 dark:border-white/5 shadow-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-6 gap-y-4 sm:gap-y-6 items-center">
            {[
              { label: 'Income', val: c(livePlan.totalIncome), color: 'text-ink-900 dark:text-paper-50' },
              { label: 'Fixed Ops', val: c(livePlan.totalFixedCosts), color: 'text-error-600 dark:text-error-400' },
              { label: 'Debt Load', val: c(livePlan.totalEMI), color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Saved', val: c(livePlan.actualSavings), color: 'text-success-600 dark:text-success-400' },
              { label: 'Goal Alloc', val: c(livePlan.monthlyForGoal), color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Surplus', val: `${livePlan.isDeficit ? '-' : '+'}${c(Math.abs(livePlan.netBalance))}`, color: livePlan.isDeficit ? 'text-error-600 dark:text-error-500' : 'text-primary-600 dark:text-primary-400' }
            ].map((metric, i) => (
              <div key={metric.label} className={`flex flex-col items-center text-center px-1 ${i < 5 ? 'md:border-r border-paper-200 dark:border-white/5' : ''}`}>
                <span className="text-overline text-ink-400 dark:text-paper-700 mb-1 opacity-50 uppercase tracking-widest">{metric.label}</span>
                <span className={`text-label font-bold truncate max-w-full ${metric.color}`}>{metric.val}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div className="h-1.5 w-full bg-paper-100 dark:bg-white/5 rounded-full flex overflow-hidden border border-paper-200 dark:border-white/5">
              <div className="h-full bg-error-500 transition-all duration-700" style={{ width: `${Math.min(livePlan.fixedRatio * 100, 100)}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-700 border-l border-black/10" style={{ width: `${Math.min(livePlan.loanRatio * 100, 100)}%` }} />
              <div className="h-full bg-success-500 transition-all duration-700 border-l border-black/10" style={{ width: `${Math.min(livePlan.savingsRatio * 100, 100)}%` }} />
              <div className="h-full bg-indigo-500 transition-all duration-700 border-l border-black/10" style={{ width: `${Math.min(livePlan.goalRatio * 100, 100)}%` }} />
              <div className="h-full bg-primary-400 transition-all duration-700 border-l border-black/10" style={{ width: `${Math.max(0, 100 - (livePlan.fixedRatio + livePlan.loanRatio + livePlan.savingsRatio + livePlan.goalRatio) * 100)}%` }} />
            </div>
            <div className="flex flex-wrap justify-center sm:justify-between gap-x-4 gap-y-2 px-1">
              {[
                { label: 'Fixed', color: 'bg-error-500', pct: Math.round(livePlan.fixedRatio * 100) },
                { label: 'Debt', color: 'bg-amber-500', pct: Math.round(livePlan.loanRatio * 100) },
                { label: 'Saved', color: 'bg-success-500', pct: Math.round(livePlan.savingsRatio * 100) },
                { label: 'Goal', color: 'bg-indigo-500', pct: Math.round(livePlan.goalRatio * 100) },
                { label: 'Free', color: 'bg-primary-400', pct: Math.round(livePlan.freeRatio * 100) }
              ].map(leg => (
                <div key={leg.label} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${leg.color}`} />
                  <span className="text-overline text-ink-400 dark:text-paper-700 tracking-wider ">{leg.pct}% <span className="opacity-40">{leg.label}</span></span>
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
