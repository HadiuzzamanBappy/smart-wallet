import React, { useEffect } from 'react';

const Toast = ({ open, message, type = 'info', onClose }) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const base = 'fixed bottom-6 right-6 z-[9999] rounded-md px-4 py-2 shadow-lg text-sm';
  const style = type === 'error' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white';

  return (
    <div className={`${base} ${style}`} role="status" aria-live="polite">
      {message}
    </div>
  );
};

export default Toast;
