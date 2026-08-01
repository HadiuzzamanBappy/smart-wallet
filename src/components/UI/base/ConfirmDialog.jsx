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
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[360px] bg-stone-950/40 backdrop-blur-3xl rounded-3xl shadow-2xl border border-stone-800 p-6 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-5">
          <IconBox
            icon={styles.icon}
            size="lg"
            variant="glass"
            color={styles.color}
          />

          <div className="mt-4 mb-8">
            <h3 className="text-h5 text-stone-200">
              {title}
            </h3>
            <p className="text-body text-stone-400 px-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
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