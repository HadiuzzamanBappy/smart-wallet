import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'teal' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colors = {
    teal: 'border-teal-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500'
  };

  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
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

export const LoadingOverlay = ({ loading, children, text = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center backdrop-blur-sm z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-3 text-gray-600 dark:text-gray-400">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;