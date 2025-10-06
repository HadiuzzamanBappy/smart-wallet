import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in"
      onClick={handleBackdropClick}
    >
      {/*
        Layout notes:
        - On small screens (mobile) we want the modal to be essentially full screen and scrollable.
        - On larger screens we constrain the width via sizes[size] and limit height (max-h-[80vh])
          so the header stays visible and the body becomes scrollable when content overflows.
      */}
      <div
        className={`w-full ${sizes[size]} bg-white dark:bg-gray-800 shadow-xl animate-in slide-in-from-top
          rounded-none sm:rounded-xl sm:mx-4 sm:my-8
          sm:max-h-[80vh] h-full sm:h-auto flex flex-col`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable content area */}
        <div className="p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;