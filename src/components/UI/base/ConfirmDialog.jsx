import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
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
  type = 'warning', // warning, error, info
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
      case 'danger':
        return {
          icon: <AlertCircle className="w-7 h-7 text-error-500" />,
          color: 'error'
        };
      case 'info':
        return {
          icon: <Info className="w-7 h-7 text-info-500" />,
          color: 'info'
        };
      default:
        return {
          icon: <AlertTriangle className="w-7 h-7 text-warning-500" />,
          color: 'primary'
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
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm bg-surface-card dark:bg-surface-card-dark backdrop-blur-2xl rounded-3xl shadow-2xl border border-paper-200 dark:border-paper-900/10 p-8 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-6">
            <div className="shrink-0 p-5 rounded-2xl bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-paper-900/10">
                {styles.icon}
            </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-ink-900 dark:text-paper-50">
              {title}
            </h3>
            <p className="text-sm text-ink-500 dark:text-paper-400 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <Button
            variant="soft"
            color="ink"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            color={styles.color}
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