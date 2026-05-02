import React from 'react';
import { THEME } from '../../../config/theme';

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
                <label className={THEME.typography.label}>
                    {label}
                </label>
            )}
            
            <div className="relative group">
                {Icon && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors pointer-events-none`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                
                <input
                    type={type}
                    className={`
                        w-full py-3.5 ${THEME.glass.input}
                        border ${error ? 'border-brand-rose' : 'border-gray-200/50 dark:border-white/5'} 
                        rounded-2xl ${Icon ? 'pl-11' : 'px-4'} pr-4 
                        text-[13px] font-bold text-gray-900 dark:text-white
                        outline-none transition-all 
                        focus:ring-4 ${error ? 'focus:ring-brand-rose/10' : 'focus:ring-primary-500/10'}
                        placeholder:text-gray-400 dark:placeholder:text-white/20
                        focus:border-primary-500/50
                        shadow-glass dark:shadow-glass-dark
                    `}
                    {...props}
                />
            </div>
            
            {(error || helperText) && (
                <p className={`mt-2 px-2 text-[10px] font-black uppercase tracking-widest ${error ? 'text-brand-rose' : 'text-gray-400 dark:text-gray-600'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default GlassInput;
