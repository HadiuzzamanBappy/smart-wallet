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
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          color: 'red'
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          color: 'teal'
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          color: 'orange'
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
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <GlassCard className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" padding="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 p-3 rounded-2xl bg-white/5 border border-white/10">
            {styles.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
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
            color={styles.color === 'orange' ? 'teal' : styles.color} // Map orange to teal/emerald for our system
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </GlassCard>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default ConfirmDialog;