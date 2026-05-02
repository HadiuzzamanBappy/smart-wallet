import React from 'react';
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
      className="fixed inset-0 z-[150] flex items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizes[size]} mx-4 bg-white/95 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-200
          rounded-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-white/10 overflow-hidden`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
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
          <div className="px-5 py-4 border-t border-gray-100 dark:border-white/5 flex-shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;