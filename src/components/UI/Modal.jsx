import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, isMobile = false }) => {
  if (!isOpen) return null;

  const content = isMobile ? (
    // Full-screen page for mobile
    <div className="fixed inset-0 z-[140] bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Mobile Header */}
      <div className="sticky top-0 z-[151] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Mobile Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  ) : (
    // Desktop Modal Dialog
    <div className="fixed inset-0 z-[140] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[140]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden z-[150]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Use a portal so the modal is mounted at document.body and not affected by parent stacking contexts
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

export default Modal;