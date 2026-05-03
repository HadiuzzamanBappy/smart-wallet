import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', disableScroll = false }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center sm:p-4 bg-ink-950/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizes[size]} mx-4 bg-surface-light dark:bg-surface-dark backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-200
          rounded-3xl max-h-[90vh] flex flex-col border border-paper-200 dark:border-paper-900/10 overflow-hidden`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-paper-200 dark:border-paper-900/10 flex-shrink-0">
            <h3 className="text-h5 font-bold text-ink-900 dark:text-paper-50 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-400 hover:text-ink-900 dark:text-paper-600 dark:hover:text-paper-50 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-lg transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content area */}
        <div className={`flex-1 ${disableScroll ? 'overflow-hidden' : 'p-5 overflow-auto custom-scrollbar'}`}>
          {children}
        </div>

        {/* Fixed Footer Area */}
        {footer && (
          <div className="px-5 py-4 border-t border-paper-200 dark:border-paper-900/10 flex-shrink-0 bg-surface-light/50 dark:bg-ink-950/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;