import React from 'react';
import { ChevronDown } from 'lucide-react';
import { THEME } from '../../../config/theme';

/**
 * Select - Standardized themed select/dropdown component.
 */
const Select = ({
    label,
    options = [],
    value,
    onChange,
    className = '',
    fullWidth = false,
    size = 'md',
    ...props
}) => {
    const sizeClasses = {
        sm: 'py-2 px-3 text-[12px] h-10',
        md: 'py-3 px-4 text-[13px] h-12',
        lg: 'py-4 px-5 text-[15px] h-14'
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className={THEME.typography.label}>
                    {label}
                </label>
            )}
            
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className={`
                        appearance-none w-full pr-10
                        ${THEME.glass.input}
                        border border-gray-200/50 dark:border-white/5
                        rounded-2xl font-bold text-gray-900 dark:text-white
                        outline-none transition-all cursor-pointer
                        hover:brightness-105
                        focus:ring-4 focus:ring-primary-500/10
                        focus:border-primary-500/50
                        shadow-glass dark:shadow-glass-dark
                        ${sizeClasses[size] || sizeClasses.md}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((opt) => (
                        <option 
                            key={opt.value} 
                            value={opt.value}
                            className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-black uppercase tracking-widest text-[10px]"
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-600 group-hover:text-brand-teal transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default Select;
