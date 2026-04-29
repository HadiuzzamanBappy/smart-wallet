import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';

const StepBar = ({ current, total }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span className="font-medium text-white">
          {current === 0 && 'Income'}
          {current === 1 && 'Fixed Costs'}
          {current === 2 && 'Loans'}
          {current === 3 && 'Savings & Deposits'}
          {current === 4 && 'Goals'}
        </span>
        <span>Step {current + 1} of {total}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= current ? 'bg-teal-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function SalaryWizard({ initialData, onComplete, onCancel }) {
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
    if (step === 0 && !form.salary) return alert("Please enter your salary to proceed.");
    if (step < 4) setStep(s => s + 1);
    else onComplete(form);
  };

  const renderIncome = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
        <select 
          value={form.currency} onChange={e => update('currency', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
        >
          {["৳ BDT", "$ USD", "₹ INR", "€ EUR", "£ GBP"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Monthly take-home salary <span className="text-red-400">*</span></label>
        <input 
          type="number" value={form.salary} onChange={e => update('salary', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
          placeholder="Net amount after tax"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Extra income per month</label>
        <input 
          type="number" value={form.extra} onChange={e => update('extra', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
          placeholder="Freelance, rental, etc. (0 if none)"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Age bracket</label>
          <select 
            value={form.ageBracket} onChange={e => update('ageBracket', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
          >
            {["18-22", "22-30", "30-40", "40+"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
          <select 
            value={form.cityTier} onChange={e => update('cityTier', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
          >
            {["Major city / capital", "Mid-size city", "Small town"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderFixedCosts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer" onClick={() => update('hasRent', !form.hasRent)}>
        <span className="text-white">I pay rent</span>
        <input type="checkbox" checked={form.hasRent} readOnly className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500" />
      </div>
      {form.hasRent && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Monthly rent</label>
          <input 
            type="number" value={form.rent} onChange={e => update('rent', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
            placeholder="Amount"
          />
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer" onClick={() => update('hasFamilySend', !form.hasFamilySend)}>
        <span className="text-white">I send money to family monthly</span>
        <input type="checkbox" checked={form.hasFamilySend} readOnly className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500" />
      </div>
      {form.hasFamilySend && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Monthly amount sent</label>
          <input 
            type="number" value={form.familySend} onChange={e => update('familySend', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
            placeholder="Amount"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Phone + internet + utilities</label>
        <input 
          type="number" value={form.bills} onChange={e => update('bills', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Monthly transport / commute</label>
        <input 
          type="number" value={form.transport} onChange={e => update('transport', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
        />
      </div>
    </div>
  );

  const renderLoans = () => {
    const totalEMI = form.loans.reduce((acc, curr) => acc + (parseFloat(curr.emi) || 0), 0);
    return (
      <div className="space-y-4">
        {form.loans.length === 0 ? (
          <div className="text-center p-6 bg-gray-900/50 rounded-lg border border-gray-700 border-dashed text-gray-400">
            No loans? Great — skip this step.
          </div>
        ) : (
          form.loans.map((loan, idx) => (
            <div key={idx} className="p-4 bg-gray-900 border border-gray-700 rounded-lg relative">
              <button 
                onClick={() => update('loans', form.loans.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="space-y-3">
                <input 
                  type="text" value={loan.name} onChange={e => {
                    const nl = [...form.loans]; nl[idx].name = e.target.value; update('loans', nl);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Loan Name (e.g. Car Loan)"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="number" value={loan.emi} onChange={e => {
                      const nl = [...form.loans]; nl[idx].emi = e.target.value; update('loans', nl);
                    }}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Monthly EMI"
                  />
                  <input 
                    type="number" value={loan.remaining} onChange={e => {
                      const nl = [...form.loans]; nl[idx].remaining = e.target.value; update('loans', nl);
                    }}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Months Left"
                  />
                </div>
              </div>
            </div>
          ))
        )}
        <button 
          onClick={() => update('loans', [...form.loans, { name: '', emi: '', remaining: '' }])}
          className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Loan</span>
        </button>
        {totalEMI > 0 && (
          <div className="text-right text-sm text-gray-300">Total EMI: <span className="font-semibold text-white">{totalEMI.toLocaleString()}/mo</span></div>
        )}
      </div>
    );
  };

  const renderSavings = () => {
    const actualSavings = form.deposits.reduce((acc, curr) => acc + (parseFloat(curr.monthly) || 0), 0);
    return (
      <div className="space-y-4">
        {form.deposits.map((dep, idx) => (
          <div key={idx} className="p-4 bg-gray-900 border border-gray-700 rounded-lg relative">
            <button 
              onClick={() => update('deposits', form.deposits.filter((_, i) => i !== idx))}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-3">
              <input 
                type="text" value={dep.name} onChange={e => {
                  const nd = [...form.deposits]; nd[idx].name = e.target.value; update('deposits', nd);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Account Name (e.g. DPS, Savings)"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="number" value={dep.monthly} onChange={e => {
                    const nd = [...form.deposits]; nd[idx].monthly = e.target.value; update('deposits', nd);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Monthly Deposit"
                />
                <input 
                  type="number" value={dep.balance} onChange={e => {
                    const nd = [...form.deposits]; nd[idx].balance = e.target.value; update('deposits', nd);
                  }}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Current Balance"
                />
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={() => update('deposits', [...form.deposits, { name: '', monthly: '', balance: '' }])}
          className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deposit Account</span>
        </button>

        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-1">Total cash savings right now</label>
          <input 
            type="number" value={form.currentSavings} onChange={e => update('currentSavings', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
            placeholder="Used for emergency fund calc"
          />
        </div>
        <div className="text-right text-sm text-gray-300">
          Monthly savings: <span className="font-semibold text-white">{actualSavings.toLocaleString()}/mo</span>
        </div>
      </div>
    );
  };

  const renderGoals = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Purchase goal amount</label>
        <input 
          type="number" value={form.goal} onChange={e => update('goal', e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
          placeholder="Bike, laptop, travel (0 if none)"
        />
      </div>
      {parseFloat(form.goal) > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Achieve in</label>
          <select 
            value={form.goalMonths} onChange={e => update('goalMonths', e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
          >
            {["6", "12", "18", "24"].map(c => <option key={c} value={c}>{c} months</option>)}
          </select>
        </div>
      )}
      <div className="mt-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-sm">
        <h4 className="font-semibold text-teal-300 mb-1">AI will now analyse your complete financial picture.</h4>
        <ul className="list-disc list-inside space-y-1 opacity-80 mt-2">
          <li>Rent safety check</li>
          <li>Loan stress limits</li>
          <li>Savings gap & untracked money</li>
          <li>Emergency fund status</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800 text-white shadow-2xl animate-in slide-in-from-top rounded-none sm:rounded-xl sm:max-h-[80vh] h-full sm:h-auto flex flex-col print:hidden">
      <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-700 shrink-0">
        <h2 className="text-xl font-bold">Set Up Salary Plan</h2>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto">
        <StepBar current={step} total={5} />
        {step === 0 && renderIncome()}
        {step === 1 && renderFixedCosts()}
        {step === 2 && renderLoans()}
        {step === 3 && renderSavings()}
        {step === 4 && renderGoals()}
      </div>

      <div className="p-4 sm:p-6 border-t border-gray-700 flex justify-between shrink-0 bg-gray-800 rounded-none sm:rounded-b-xl">
        <button 
          onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()} 
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium flex items-center space-x-1"
        >
          {step > 0 && <ChevronLeft className="w-4 h-4" />}
          <span>{step > 0 ? 'Back' : 'Cancel'}</span>
        </button>
        <button 
          onClick={nextStep} 
          className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-1"
        >
          <span>{step === 4 ? 'Generate My Plan' : 'Next'}</span>
          {step < 4 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
