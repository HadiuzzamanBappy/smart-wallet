import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'info', isVisible, onClose, duration = 5000, position = 'fixed' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      default:
        return <Info className="w-5 h-5 text-info-500" />;
    }
  };

  const getStyles = () => {
    const base = "bg-stone-50 dark:bg-stone-900/60 backdrop-blur-md shadow-2xl border border-stone-200 dark:border-stone-800/50";
    switch (type) {
      case 'success':
        return `${base} border-l-2 border-l-success-500`;
      case 'error':
        return `${base} border-l-2 border-l-error-500`;
      case 'warning':
        return `${base} border-l-2 border-l-warning-500`;
      default:
        return `${base} border-l-2 border-l-info-500`;
    }
  };

  const animationClasses = show 
    ? 'translate-y-0 sm:translate-x-0 opacity-100 scale-100' 
    : 'translate-y-8 sm:translate-y-0 sm:translate-x-8 opacity-0 scale-90';

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 left-6 right-6 sm:top-6 sm:right-6 sm:bottom-auto sm:left-auto sm:max-w-sm z-[250]' 
    : 'relative w-full max-w-sm';

  return (
    <div
      className={`${positionClasses} transform transition-all duration-300 ease-out ${animationClasses}`}
    >
      <div className={`${getStyles()} rounded-3xl p-3 overflow-hidden`}>
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <p className="text-body text-stone-800 dark:text-stone-200">
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 p-1.5 hover:bg-stone-100 dark:bg-stone-800/50 rounded-xl text-stone-600 dark:text-stone-500 hover:text-stone-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container component for multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 left-6 right-6 sm:top-6 sm:right-6 sm:bottom-auto sm:left-auto sm:max-w-sm z-[200] flex flex-col-reverse sm:flex-col gap-3 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className="pointer-events-auto">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
          position="relative"
        />
      </div>
    ))}
  </div>
);

export default Toast;