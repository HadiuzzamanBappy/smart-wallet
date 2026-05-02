import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import GlassCard from './GlassCard';
import Button from './Button';

/**
 * ConfirmDialog - Standardized themed confirmation dialog.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // warning, danger, info
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-500" />,
          color: 'red'
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-teal-600 dark:text-teal-500" />,
          color: 'teal'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />,
          color: 'teal'
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const dialogContent = (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/10 p-8 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="shrink-0 p-5 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-inner">
            {styles.icon}
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest leading-relaxed opacity-80">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            color={styles.color === 'red' ? 'red' : 'teal'}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default ConfirmDialog;