import React from 'react';
import { ChevronDown } from 'lucide-react';

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
        sm: 'py-2 px-3 text-[12px] h-9',
        md: 'py-2.5 px-4 text-[13px] h-10',
        lg: 'py-3 px-5 text-[15px] h-12'
    };

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
                    {label}
                </label>
            )}
            
            <div className="relative group">
                <select
                    value={value}
                    onChange={onChange}
                    className={`
                        appearance-none w-full pr-10
                        bg-gray-50/80 dark:bg-white/[0.02]
                        border border-gray-200 dark:border-white/10
                        rounded-xl font-bold text-gray-900 dark:text-white
                        outline-none transition-all cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-white/5
                        focus:ring-4 focus:ring-teal-500/10
                        focus:border-teal-500/50
                        shadow-sm focus:shadow-md
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

export default Select;
