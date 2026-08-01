import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', disableScroll = false, fullMobile = false, preventClose = false }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-none w-full h-full sm:h-[95vh] sm:w-[95vw]'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  const isFull = size === 'full' || fullMobile;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center ${isFull ? 'p-0 sm:p-4' : 'p-4'} bg-stone-900/20 dark:bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-300`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizes[size]} ${isFull ? 'mx-0 sm:mx-4' : 'mx-4'} bg-white/95 dark:bg-stone-950/40 backdrop-blur-3xl shadow-2xl shadow-stone-200/50 dark:shadow-stone-950/50 animate-in zoom-in-95 duration-200
          ${isFull ? 'rounded-none sm:rounded-3xl h-full sm:h-auto' : 'rounded-3xl max-h-[95vh]'} sm:max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-800/50 overflow-hidden`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800/50 flex-shrink-0">
            <h3 className="text-h5 text-stone-800 dark:text-stone-200">
              {title}
            </h3>
            {!preventClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable content area */}
        <div className={`flex-1 ${disableScroll ? 'overflow-hidden' : 'p-5 overflow-auto custom-scrollbar'}`}>
          {children}
        </div>

        {/* Fixed Footer Area */}
        {footer && (
          <div className="px-5 py-4 border-t border-stone-200 dark:border-stone-800/50 flex-shrink-0 bg-white/80 dark:bg-stone-900/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;