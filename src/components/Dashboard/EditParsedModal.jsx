import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { learnFromCorrection } from '../../utils/transactionParser';
import * as transactionService from '../../services/transactionService';

const EditParsedModal = ({ open, onClose, originalMessage, parsed, onSave }) => {
  const [form, setForm] = useState({
    type: parsed?.type || 'expense',
    amount: parsed?.amount || '',
    category: parsed?.category || 'other',
    description: parsed?.description || ''
  });
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);
  const previousActiveRef = useRef(null);

  // Keep internal form in sync when the modal opens or parsed changes
  useEffect(() => {
    if (open) {
      setForm({
        type: parsed?.type || 'expense',
        amount: parsed?.amount ?? '',
        category: parsed?.category || 'other',
        description: parsed?.description || ''
      });
    }
  }, [open, parsed]);

  // Focus trap & restore
  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement;
    // focus the modal
    setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    const handleKey = (e) => {
      if (e.key === 'Tab') {
        // trap focus within modal
        const focusable = modalRef.current.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      // restore focus
      try { previousActiveRef.current?.focus(); } catch { /* ignore */ }
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Normalize amount to a number for downstream consumers
      const normalizedAmount = (() => {
        if (form.amount === null || form.amount === undefined) return null;
        // If already a number, return it
        if (typeof form.amount === 'number') return form.amount;
        // Remove commas and currency symbols then parse
        const cleaned = String(form.amount).replace(/[_,\s\u20B9$\u09F3\u09F2\u20B9\u00A3\u20AC\u00A5]/g, '').replace(/,/g, '');
        const num = Number(cleaned);
        return isNaN(num) ? null : num;
      })();

      const normalized = { ...form, amount: normalizedAmount };
      // Call learning hook to adapt future predictions
      try {
        learnFromCorrection(originalMessage, parsed, normalized);
      } catch (e) {
        // non-fatal
        console.warn('Learning call failed', e);
      }

      // If server update function exists and parsed had an id, update the stored transaction
      if (parsed?.id && typeof transactionService.updateTransaction === 'function') {
        try {
          const updatesWithUser = { ...normalized, userId: parsed.userId };
          await transactionService.updateTransaction(parsed.id, updatesWithUser);
        } catch (e) {
          console.warn('Could not update transaction on server', e);
        }
      }

      if (onSave) onSave(normalized);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Keep internal form in sync when the modal opens or parsed changes
  return (
    <div tabIndex={-1} role="dialog" aria-modal="true" aria-label="Edit parsed transaction" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div ref={modalRef} tabIndex={0} className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-4 shadow-lg ring-1 ring-black/10" role="document">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Edit parsed transaction</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-4 h-4"/></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full rounded px-2 py-1 bg-gray-50 dark:bg-gray-900" aria-label="Transaction type">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="credit">Credit Given</option>
              <option value="loan">Loan Taken</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Amount</label>
            <input name="amount" value={form.amount} onChange={handleChange} className="w-full rounded px-2 py-1 bg-gray-50 dark:bg-gray-900" aria-label="Amount" autoFocus />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Category</label>
            <input name="category" value={form.category} onChange={handleChange} className="w-full rounded px-2 py-1 bg-gray-50 dark:bg-gray-900" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Description</label>
            <input name="description" value={form.description} onChange={handleChange} className="w-full rounded px-2 py-1 bg-gray-50 dark:bg-gray-900" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="px-3 py-1 rounded bg-teal-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditParsedModal;
