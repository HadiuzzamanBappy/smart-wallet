import React from 'react';

/**
 * LoadingSpinner - Unified high-fidelity loader with arc animation.
 */
export const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const colors = {
    primary: 'text-emerald-500',
    secondary: 'text-amber-500',
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    ink: 'text-stone-600 dark:text-stone-500 dark:text-stone-400',
    white: 'text-white'
  };

  return (
    <svg 
      className={`animate-spin ${sizes[size] || sizes.md} ${colors[color] || colors.primary} ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
};

export const LoadingOverlay = ({ loading, children, text = 'Processing...' }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-stone-50/80 dark:bg-stone-950/60 flex items-center justify-center backdrop-blur-[4px] z-10 animate-in fade-in duration-300">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            {text && <p className="mt-4 text-overline text-stone-600 dark:text-stone-400 dark:text-stone-500 animate-pulse">{text}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
