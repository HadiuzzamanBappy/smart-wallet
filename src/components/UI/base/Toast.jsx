import React, { useState, useEffect } from 'react';
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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const base = "border-l-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 dark:ring-white/10";
    switch (type) {
      case 'success':
        return `${base} border-green-500`;
      case 'error':
        return `${base} border-red-500`;
      case 'warning':
        return `${base} border-yellow-500`;
      default:
        return `${base} border-blue-500`;
    }
  };

  // Base classes for positioning and animation
  // Desktop: slide from right. Mobile: slide from bottom.
  const animationClasses = show 
    ? 'translate-y-0 sm:translate-x-0 opacity-100' 
    : 'translate-y-8 sm:translate-y-0 sm:translate-x-8 opacity-0';

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-4 left-4 right-4 sm:top-4 sm:right-4 sm:bottom-auto sm:left-auto sm:max-w-sm z-[100]' 
    : 'relative w-full max-w-sm';

  return (
    <div
      className={`${positionClasses} transform transition-all duration-300 ease-out ${animationClasses}`}
    >
      <div className={`${getStyles()} rounded-2xl p-4 overflow-hidden`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white font-bold tracking-tight">
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
  <div className="fixed bottom-4 left-4 right-4 sm:top-4 sm:right-4 sm:bottom-auto sm:left-auto sm:max-w-sm z-[100] flex flex-col-reverse sm:flex-col gap-3 pointer-events-none">
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