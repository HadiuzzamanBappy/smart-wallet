import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const ConfirmDialog = ({ open, title, description, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    setTimeout(() => ref.current?.focus(), 0);
    const handle = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      if (prev && typeof prev.focus === 'function') try { prev.focus(); } catch { /* ignore */ }
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div ref={ref} tabIndex={0} className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-lg ring-1 ring-black/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{description}</p>}
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">{cancelText}</button>
          <button onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
