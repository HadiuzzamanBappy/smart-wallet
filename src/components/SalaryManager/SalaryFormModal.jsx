import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, Briefcase, Home, CreditCard, PiggyBank, Target, Sparkles } from 'lucide-react';
import Modal from '../UI/Modal';

const StepBar = ({ current, total }) => {
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
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i === current ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 
              i < current ? 'bg-teal-700/50' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const SalaryFormModal = ({ isOpen, onClose, initialData, onComplete }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialData || {
    currency: '৳ BDT',
    salary: '',
    extra: '',
    ageBracket: '22-30',
    cityTier: 'Major city / capital',
    hasRent: false,
    rent: '',
    hasFamilySend: false,
    familySend: '',
    bills: '',
    transport: '',
    loans: [],
    deposits: [],
    currentSavings: '',
    goal: '',
    goalMonths: '12',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const nextStep = () => {
    if (step === 0 && !form.salary) return;
    if (step < 4) setStep(s => s + 1);
    else onComplete(form);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const renderIncome = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
          <select 
            value={form.currency} onChange={e => update('currency', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none"
          >
            {["৳ BDT", "$ USD", "₹ INR", "€ EUR", "£ GBP"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Take-home Salary *</label>
          <input 
            type="number" value={form.salary} onChange={e => update('salary', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none" 
            placeholder="Net monthly amount"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Extra Monthly Income</label>
        <input 
          type="number" value={form.extra} onChange={e => update('extra', e.target.value)}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none" 
          placeholder="Freelance, rental, etc."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Age Bracket</label>
          <select 
            value={form.ageBracket} onChange={e => update('ageBracket', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none"
          >
            {["18-22", "22-30", "30-40", "40+"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City Type</label>
          <select 
            value={form.cityTier} onChange={e => update('cityTier', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500/50 transition-all outline-none"
          >
            {["Major city / capital", "Mid-size city", "Small town"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderFixedCosts = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            form.hasRent ? 'bg-teal-500/10 border-teal-500/50' : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => update('hasRent', !form.hasRent)}
        >
          <span className="text-sm font-medium">I pay rent</span>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            form.hasRent ? 'bg-teal-500 border-teal-500' : 'border-gray-600'
          }`}>
            {form.hasRent && <ChevronRight className="w-3 h-3 text-white" />}
          </div>
        </div>
        <div 
          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            form.hasFamilySend ? 'bg-teal-500/10 border-teal-500/50' : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => update('hasFamilySend', !form.hasFamilySend)}
        >
          <span className="text-sm font-medium">I send to family</span>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            form.hasFamilySend ? 'bg-teal-500 border-teal-500' : 'border-gray-600'
          }`}>
            {form.hasFamilySend && <ChevronRight className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.hasRent && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly Rent</label>
            <input 
              type="number" value={form.rent} onChange={e => update('rent', e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50" 
              placeholder="Amount"
            />
          </div>
        )}
        {form.hasFamilySend && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Family Support</label>
            <input 
              type="number" value={form.familySend} onChange={e => update('familySend', e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50" 
              placeholder="Amount"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Utilities / Bills</label>
          <input 
            type="number" value={form.bills} onChange={e => update('bills', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Monthly Transport</label>
          <input 
            type="number" value={form.transport} onChange={e => update('transport', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50" 
          />
        </div>
      </div>
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {form.loans.length === 0 ? (
        <div className="text-center p-8 bg-gray-900/30 rounded-2xl border border-dashed border-gray-700 text-gray-500">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No active loans. Click below to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {form.loans.map((loan, idx) => (
            <div key={idx} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl relative group">
              <button 
                onClick={() => update('loans', form.loans.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <input 
                  type="text" value={loan.name} onChange={e => {
                    const nl = [...form.loans]; nl[idx].name = e.target.value; update('loans', nl);
                  }}
                  className="w-full bg-transparent border-b border-gray-700 focus:border-teal-500 p-1 text-white text-sm outline-none transition-colors" 
                  placeholder="Loan Name (e.g. Car Loan)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly EMI</label>
                    <input 
                      type="number" value={loan.emi} onChange={e => {
                        const nl = [...form.loans]; nl[idx].emi = e.target.value; update('loans', nl);
                      }}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-white text-sm outline-none focus:ring-1 focus:ring-teal-500/30" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Months Left</label>
                    <input 
                      type="number" value={loan.remaining} onChange={e => {
                        const nl = [...form.loans]; nl[idx].remaining = e.target.value; update('loans', nl);
                      }}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-white text-sm outline-none focus:ring-1 focus:ring-teal-500/30" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button 
        onClick={() => update('loans', [...form.loans, { name: '', emi: '', remaining: '' }])}
        className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-wider">Add Loan Item</span>
      </button>
    </div>
  );

  const renderSavings = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 gap-3">
        {form.deposits.map((dep, idx) => (
          <div key={idx} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl relative">
            <button 
              onClick={() => update('deposits', form.deposits.filter((_, i) => i !== idx))}
              className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-3">
              <input 
                type="text" value={dep.name} onChange={e => {
                  const nd = [...form.deposits]; nd[idx].name = e.target.value; update('deposits', nd);
                }}
                className="w-full bg-transparent border-b border-gray-700 focus:border-teal-500 p-1 text-white text-sm outline-none transition-colors" 
                placeholder="Account Name (e.g. Savings, DPS)"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Monthly Deposit</label>
                  <input 
                    type="number" value={dep.monthly} onChange={e => {
                      const nd = [...form.deposits]; nd[idx].monthly = e.target.value; update('deposits', nd);
                    }}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-white text-sm outline-none focus:ring-1 focus:ring-teal-500/30" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Balance</label>
                  <input 
                    type="number" value={dep.balance} onChange={e => {
                      const nd = [...form.deposits]; nd[idx].balance = e.target.value; update('deposits', nd);
                    }}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-white text-sm outline-none focus:ring-1 focus:ring-teal-500/30" 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button 
        onClick={() => update('deposits', [...form.deposits, { name: '', monthly: '', balance: '' }])}
        className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-wider">Add Deposit Account</span>
      </button>

      <div className="pt-5 border-t border-gray-700">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Current Cash Savings</label>
        <input 
          type="number" value={form.currentSavings} onChange={e => update('currentSavings', e.target.value)}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" 
          placeholder="For emergency fund analysis"
        />
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Purchase Goal Amount</label>
          <input 
            type="number" value={form.goal} onChange={e => update('goal', e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50" 
            placeholder="e.g. 50,000"
          />
        </div>
        {parseFloat(form.goal) > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Timeline</label>
            <select 
              value={form.goalMonths} onChange={e => update('goalMonths', e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              {["6", "12", "18", "24"].map(c => <option key={c} value={c}>{c} months</option>)}
            </select>
          </div>
        )}
      </div>
      
      <div className="p-5 bg-teal-500/10 border border-teal-500/20 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-2 text-teal-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <h4 className="text-sm font-bold uppercase tracking-wider">AI Analysis Ready</h4>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Our AI Financial Advisor will evaluate your Rent safety, Loan stress, Emergency fund gap, and untracked spending to build your custom plan.
        </p>
      </div>
    </div>
  );

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
      title="Setup Salary Plan" 
      size="lg" 
      disableScroll={true}
      footer={modalFooter}
    >
      <div className="h-[calc(100vh-160px)] sm:h-[55vh] flex flex-col p-4 sm:p-5">
        {/* Fixed Top Area */}
        <div className="shrink-0 mb-4 px-2">
          <StepBar current={step} total={5} />
        </div>

        {/* Scrollable Middle Area */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 scrollbar-hide px-2">
          <div className="pb-2">
            {step === 0 && renderIncome()}
            {step === 1 && renderFixedCosts()}
            {step === 2 && renderLoans()}
            {step === 3 && renderSavings()}
            {step === 4 && renderGoals()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SalaryFormModal;
