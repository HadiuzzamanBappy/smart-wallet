import React from 'react';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizes[size]} bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-top
          rounded-none sm:rounded-xl sm:mx-4 sm:my-8
          sm:max-h-[85vh] h-full sm:h-auto flex flex-col border border-gray-200 dark:border-gray-800`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content area */}
        <div className={`flex-1 ${disableScroll ? 'overflow-hidden' : 'p-4 sm:p-6 overflow-auto'}`}>
          {children}
        </div>

        {/* Fixed Footer Area */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-b-none sm:rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;