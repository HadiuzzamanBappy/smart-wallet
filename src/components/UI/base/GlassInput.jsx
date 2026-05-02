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
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
                    {label}
                </label>
            )}
            
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 dark:group-focus-within:text-teal-500 transition-colors pointer-events-none">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                
                <input
                    type={type}
                    className={`
                        w-full py-3 bg-gray-50/80 dark:bg-white/[0.02]
                        border ${error ? 'border-rose-500' : 'border-gray-200 dark:border-white/10'} 
                        rounded-2xl ${Icon ? 'pl-11' : 'px-4'} pr-4 
                        text-[13px] font-bold text-gray-900 dark:text-white
                        outline-none transition-all 
                        focus:ring-4 ${error ? 'focus:ring-rose-500/10' : 'focus:ring-teal-500/10'}
                        placeholder:text-gray-400 dark:placeholder:text-white/20
                        focus:border-teal-500/50
                        shadow-sm focus:shadow-md
                    `}
                    {...props}
                />
            </div>
            
            {(error || helperText) && (
                <p className={`mt-2 px-2 text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-600 dark:text-rose-500' : 'text-gray-400 dark:text-gray-600'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default GlassInput;
