import React from 'react';

/**
 * GlassInput - Centralized input component with glassmorphic styling.
 */
const GlassInput = ({
    label,
    icon: Icon,
    error,
    helperText,
    className = '',
    type = 'text',
    ...props
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-1">
                    {label}
                </label>
            )}
            
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                
                <input
                    type={type}
                    className={`
                        w-full py-2 bg-white dark:bg-gray-800 
                        border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                        rounded-lg ${Icon ? 'pl-10' : 'px-4'} pr-4 
                        text-sm text-gray-900 dark:text-gray-100
                        outline-none transition-all 
                        focus:ring-2 ${error ? 'focus:ring-red-500/20' : 'focus:ring-teal-500 dark:focus:ring-teal-400'}
                        placeholder:text-gray-500 dark:placeholder:text-gray-400
                        focus:border-transparent
                    `}
                    {...props}
                />
            </div>
            
            {(error || helperText) && (
                <p className={`mt-1.5 px-2 text-[9px] font-bold uppercase tracking-widest ${error ? 'text-red-500' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default GlassInput;
