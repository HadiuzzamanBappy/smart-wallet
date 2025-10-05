import React, { useEffect, useMemo, useState } from 'react';
import { X, ArrowDown, ArrowUp } from 'lucide-react';

// Minimal, animated balance modal - small slide-up panel
const BalanceModal = ({ open, onClose, balance, currency = 'BDT' }) => {
  const [value, setValue] = useState(0);

  // Read last transactions minimal info
  const last = useMemo(() => {
    try {
      if (typeof window === 'undefined') return { debit: null, credit: null };
      const raw = localStorage.getItem('wallet_last_transactions');
      if (!raw) return { debit: null, credit: null };
      const arr = JSON.parse(raw) || [];
      arr.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      const debit = arr.find(t => (t.type === 'expense' || t.type === 'loan' || t.type === 'debit')) || null;
      const credit = arr.find(t => (t.type === 'income' || t.type === 'credit')) || null;
      return { debit, credit };
    } catch {
      return { debit: null, credit: null };
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const to = Number(balance) || 0;
    const from = 0;
    const duration = 600;
    const start = performance.now();
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const v = Math.round(from + (to - from) * eased);
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // auto-close after a short delay
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [open, balance, onClose]);

  const format = (n) => {
    const currencyLocales = {
      BDT: 'en-BD',
      USD: 'en-US',
      EUR: 'en-DE',
      GBP: 'en-GB',
      INR: 'en-IN'
    };

    const locale = currencyLocales[currency] || 'en-BD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'BDT' ? 0 : 2
    }).format(n || 0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md mx-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transition-transform transform -translate-y-4 opacity-0 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Balance</div>
            <button aria-label="Close" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">{format(value)}</div>
              <div className="text-xs text-gray-500">Updated</div>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-red-50 text-red-600"><ArrowDown className="w-4 h-4"/></span>
                <div className="text-xs">
                  <div className="text-xs text-gray-500">Last Debit</div>
                  <div className="text-sm font-medium">{last.debit ? format(last.debit.amount) : '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-green-50 text-green-600"><ArrowUp className="w-4 h-4"/></span>
                <div className="text-xs">
                  <div className="text-xs text-gray-500">Last Credit</div>
                  <div className="text-sm font-medium">{last.credit ? format(last.credit.amount) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideDown { from { transform: translateY(-12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } } .animate-slide-down { animation: slideDown 220ms cubic-bezier(.2,.9,.2,1) forwards; }`}</style>
    </div>
  );
};

export default BalanceModal;
