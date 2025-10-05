import React from 'react';

/**
 * Reusable loading spinner component
 * @param {string} message - Optional loading message
 * @param {string} size - Spinner size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} fullScreen - Whether to show as full screen loader
 */
const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "md", 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  };

  const containerClass = fullScreen 
    ? "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className={`text-gray-600 dark:text-gray-300 ${textSizes[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;