import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const ReAuthDialog = ({ open, onCancel, onConfirm, loading, errorMessage }) => {
  const [password, setPassword] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    setTimeout(() => ref.current?.focus(), 0);
    return () => {
      if (prev && typeof prev.focus === 'function') try { prev.focus(); } catch (err) { console.debug('focus restore failed', err); }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div ref={ref} tabIndex={0} className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-lg ring-1 ring-black/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Re-enter password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">For security we need you to re-enter your password to delete your account.</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button onClick={() => onConfirm(password)} className="px-3 py-1 rounded bg-red-600 text-white" disabled={loading}>{loading ? 'Working...' : 'Reauthenticate & Delete'}</button>
        </div>
      </div>
    </div>
  );
};

export default ReAuthDialog;
