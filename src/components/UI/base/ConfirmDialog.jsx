import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import Button from './Button';
import IconBox from './IconBox';

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
  type = 'warning', // warning, error, info, danger
  loading = false
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
      case 'danger':
        return {
          icon: AlertCircle,
          color: 'error',
          iconColor: 'text-error-500'
        };
      case 'info':
        return {
          icon: Info,
          color: 'info',
          iconColor: 'text-info-500'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'primary',
          iconColor: 'text-warning-500'
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
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[360px] bg-surface-light dark:bg-surface-dark backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-paper-200 dark:border-paper-900/10 p-6 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-5">
          <IconBox 
            icon={styles.icon} 
            size="lg" 
            variant="glass" 
            color={styles.color}
          />
          
          <div className="space-y-2">
            <h3 className="text-h5 font-bold text-ink-900 dark:text-paper-50 tracking-tight">
              {title}
            </h3>
            <p className="text-label text-ink-500 dark:text-paper-400 leading-relaxed px-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-8">
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
            variant="filled"
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