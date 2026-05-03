import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - Unified high-fidelity loader with dual-ring animation.
 */
const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14'
  };

  const colors = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    ink: 'text-ink-600 dark:text-paper-400',
    white: 'text-white'
  };

  return (
    <Loader2 
      className={`
        ${sizes[size] || sizes.md} 
        ${colors[color] || colors.primary} 
        animate-spin opacity-80
        ${className}
      `} 
    />
  );
};

export const LoadingButton = ({
  children,
  loading,
  disabled,
  className = '',
  loadingText = 'Loading...',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`relative ${className} ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export const LoadingOverlay = ({ loading, children, text = 'Processing...' }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60 flex items-center justify-center backdrop-blur-[4px] z-10 animate-in fade-in duration-300">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            {text && <p className="mt-4 text-overline font-black tracking-[0.2em] text-ink-500 dark:text-paper-500 animate-pulse">{text}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;